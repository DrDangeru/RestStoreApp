package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"restaurant-backend/internal/models"
	"restaurant-backend/internal/repository"
)

var jwtSecret []byte

func init() {
	// Load JWT private/server secret from environment variable
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-in-production" // Fallback for development
	} // think an error would be better
	jwtSecret = []byte(secret)
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func checkPassword(password, hash string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func generateToken(user *models.User) (string, error) {
	claims := models.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(4 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).
		SignedString(jwtSecret)
}

func validateToken(tokenString string) (*models.Claims, error) {
	keyFunc := func(t *jwt.Token) (any, error) {
		return jwtSecret, nil
	}

	token, err := jwt.ParseWithClaims(tokenString, &models.Claims{}, keyFunc)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*models.Claims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}

// authMiddleware validates JWT token and adds user to context
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
			return
		}

		claims, err := validateToken(parts[1])
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), models.UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// adminMiddleware ensures user has admin role
func adminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(models.UserContextKey).(*models.Claims)
		if !ok || claims.Role != "admin" {
			http.Error(w, "Admin access required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// registerHandler handles POST /api/auth/register
func registerHandler(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		http.Error(w, "Email, password, and name are required",
			http.StatusBadRequest)
		return
	}

	// Check if user exists
	existing, _ := repository.GetUserByEmail(req.Email)
	if existing != nil {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		http.Error(w, "Failed to process password", http.StatusInternalServerError)
		return
	}

	// Determine role: first user is admin, others are customers
	role := "customer"
	count, err := repository.GetUserCount()
	if err == nil && count == 0 {
		role = "admin"
	}

	user := &models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
		Role:     role,
	}

	if err := repository.CreateUser(user); err != nil {
		slog.Error("failed to create user", "error", err, "email", user.Email)
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	token, err := generateToken(user)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	user.Password = "" // Don't send password back
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.AuthResponse{Token: token, User: *user})
}

// loginHandler handles POST /api/auth/login
func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	user, err := repository.GetUserByEmail(req.Email)
	if err != nil || user == nil {
		slog.Warn("failed login attempt", "email", req.Email)
		http.Error(w, "Invalid credentials or User is not registered",
			http.StatusUnauthorized)
		return
	}

	match, err := checkPassword(req.Password, user.Password)
	if err != nil {
		slog.Error("password check error", "error", err, "email", req.Email)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if !match {
		slog.Warn("failed login attempt: invalid password", "email", req.Email)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := generateToken(user)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	user.Password = "" // Don't send password back
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AuthResponse{Token: token, User: *user})
}

// getMeHandler handles GET /api/auth/me
func getMeHandler(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(models.UserContextKey).(*models.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := repository.GetUserByID(claims.UserID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	user.Password = ""
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

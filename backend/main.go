package main

import (
	"io"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"

	"restaurant-backend/internal/handlers"
	"restaurant-backend/internal/repository"
)

// CORS middleware
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// loggingMiddleware logs incoming HTTP requests using slog
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.Info("incoming request",
			"method", r.Method,
			"path", r.URL.Path,
			"remote_addr", r.RemoteAddr,
		)
		next.ServeHTTP(w, r)
	})
}

// initLogger sets up slog to write to both a file and stdout
func initLogger() (*os.File, error) {
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, err
	}

	logFile := filepath.Join(logDir, "app.log")
	file, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	// MultiWriter to send logs to both the file and console
	mw := io.MultiWriter(os.Stdout, file)

	// Set the global logger with a JSON handler for better searchability in files
	logger := slog.New(slog.NewJSONHandler(mw, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	return file, nil
}

func main() {
	// Initialize logger
	logFile, err := initLogger()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logFile.Close()

	// Load .env file
	if err := godotenv.Load(); err != nil {
		slog.Error("No .env file found, relying on system environment variables")
	}

	repository.InitDB()

	r := mux.NewRouter()
	r.Use(loggingMiddleware)

	// Public routes
	r.HandleFunc("/api/products", handlers.GetProducts).Methods("GET")
	r.HandleFunc("/api/products/category/{category}",
		handlers.GetProductsByCategory).Methods("GET")
	r.HandleFunc("/api/products/{id}", handlers.GetProduct).Methods("GET")
	r.HandleFunc("/api/feedback", handlers.SubmitFeedback).Methods("POST")
	r.HandleFunc("/api/feedback", handlers.GetFeedback).Methods("GET")

	// Auth routes
	r.HandleFunc("/api/auth/register", registerHandler).Methods("POST")
	r.HandleFunc("/api/auth/login", loginHandler).Methods("POST")

	// Protected routes (require auth)
	authRouter := r.PathPrefix("/api").Subrouter()
	authRouter.Use(authMiddleware)
	authRouter.HandleFunc("/auth/me", getMeHandler).Methods("GET")
	authRouter.HandleFunc("/orders", handlers.CreateOrder).Methods("POST")
	authRouter.HandleFunc("/orders/user/{userId}",
		handlers.GetUserOrders).Methods("GET")

	// Admin routes (require admin role)
	adminRouter := r.PathPrefix("/api").Subrouter()
	adminRouter.Use(authMiddleware)
	adminRouter.Use(adminMiddleware)
	adminRouter.HandleFunc("/dashboard", handlers.GetDashboardStats).Methods("GET")
	adminRouter.HandleFunc("/reports/sales", handlers.GetSalesReport).Methods("GET")
	adminRouter.HandleFunc("/products", handlers.CreateProduct).Methods("POST")
	adminRouter.HandleFunc("/products/{id}",
		handlers.UpdateProduct).Methods("PUT")
	adminRouter.HandleFunc("/products/{id}",
		handlers.DeleteProduct).Methods("DELETE")
	adminRouter.HandleFunc("/products/{id}/supply",
		handlers.OrderSupplies).Methods("POST")

	// Apply CORS middleware
	handler := enableCORS(r)

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	slog.Info("Server starting", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("server failed", "error", err)
	}
}

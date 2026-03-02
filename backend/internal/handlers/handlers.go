package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/mux"

	"restaurant-backend/internal/models"
	"restaurant-backend/internal/repository"
)

var (
	promos = []string{
		"🎉 Weekend Special: 20% off all Eastern Eats! Use code EAST20",
		"🍔 Burger Tuesday: Buy one get one free on all Western meals!",
		"🍜 Free Kimchi with any Eastern order over $30",
		"🍟 Friday Deal: Free large fries with any combo",
		"🍰 Dessert Sunday: 50% off all sweet treats!",
	}
	promosLock sync.RWMutex
)

// GetPromosSSE handles GET /api/promos for Server-Sent Events
func GetPromosSSE(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	// Make sure we allow CORS for this specific endpoint just in case
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	// Send initial promo immediately
	promosLock.RLock()
	if len(promos) > 0 {
		fmt.Fprintf(w, "data: %s\n\n", promos[0])
	}
	promosLock.RUnlock()
	flusher.Flush()

	i := 1
	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			promosLock.RLock()
			if len(promos) > 0 {
				fmt.Fprintf(w, "data: %s\n\n", promos[i%len(promos)])
			}
			promosLock.RUnlock()
			flusher.Flush()
			i++
		}
	}
}

// GetPromos handles GET /api/promos/list (for admin)
func GetPromos(w http.ResponseWriter, r *http.Request) {
	promosLock.RLock()
	defer promosLock.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(promos)
}

// UpdatePromos handles PUT /api/promos/list (for admin)
func UpdatePromos(w http.ResponseWriter, r *http.Request) {
	var newPromos []string
	if err := json.NewDecoder(r.Body).Decode(&newPromos); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	promosLock.Lock()
	promos = newPromos
	promosLock.Unlock()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Promos updated successfully"})
}

// GetProducts handles GET /api/products
func GetProducts(w http.ResponseWriter, r *http.Request) {
	products, err := repository.FetchProducts()
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// GetProductsByCategory handles GET /api/products/category/{category}
func GetProductsByCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	category := vars["category"]

	products, err := repository.FetchProductsByCategory(category)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// GetProduct handles GET /api/products/{id}
func GetProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	product, err := repository.FetchProductByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Product not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// SubmitFeedback handles POST /api/feedback
func SubmitFeedback(w http.ResponseWriter, r *http.Request) {
	var feedback models.Feedback
	if err := json.NewDecoder(r.Body).Decode(&feedback); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate feedback
	// User should not have to enter the product ID and product name
	// These should be automatically set based on the product being reviewed
	if feedback.Name == "" || feedback.Email == "" || feedback.Comment == "" || feedback.ProductID == nil || feedback.ProductName == "" {
		http.Error(w, "Name, email, comment, product ID, and product name are required",
			http.StatusBadRequest)
		return
	}

	if feedback.Rating < 1 || feedback.Rating > 5 {
		http.Error(w, "Rating must be between 1 and 5", http.StatusBadRequest)
		return
	}

	if err := repository.SaveFeedback(&feedback); err != nil {
		http.Error(w, "Failed to save feedback", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(feedback)
}

// GetFeedback handles GET /api/feedback
func GetFeedback(w http.ResponseWriter, r *http.Request) {
	feedbacks, err := repository.FetchAllFeedback()
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feedbacks)
}

// CreateProduct handles POST /api/products
func CreateProduct(w http.ResponseWriter, r *http.Request) {
	var product models.Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if product.Name == "" || product.Category == "" {
		http.Error(w, "Name and category are required", http.StatusBadRequest)
		return
	}

	if err := repository.InsertProduct(&product); err != nil {
		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(product)
}

// UpdateProduct handles PUT /api/products/{id}
func UpdateProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var product models.Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	product.ID = id
	if err := repository.UpdateProduct(&product); err != nil {
		http.Error(w, "Failed to update product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

// DeleteProduct handles DELETE /api/products/{id}
func DeleteProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	if err := repository.DeleteProduct(id); err != nil {
		http.Error(w, "Failed to delete product", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// CreateOrder handles POST /api/orders
func CreateOrder(w http.ResponseWriter, r *http.Request) {
	var order models.Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	claims, ok := r.Context().Value(models.UserContextKey).(*models.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	order.UserID = claims.UserID

	order.Status = "pending"
	if err := repository.CreateOrder(&order); err != nil {
		http.Error(w, "Failed to create order", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

// GetUserOrders handles GET /api/orders/user/{userId}
func GetUserOrders(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["userId"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	claims, ok := r.Context().Value(models.UserContextKey).(*models.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Only allow access if user requests their own orders or is admin
	if claims.UserID != userID && claims.Role != "admin" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	orders, err := repository.FetchOrdersByUserID(userID)
	if err != nil {
		http.Error(w, "Failed to fetch orders", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// GetDashboardStats handles GET /api/dashboard
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	stats, err := repository.GetDashboardStats()
	if err != nil {
		http.Error(w, "Failed to fetch dashboard stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// GetSalesReport handles GET /api/reports/sales
func GetSalesReport(w http.ResponseWriter, r *http.Request) {
	report, err := repository.GetSalesReport()
	if err != nil {
		http.Error(w, "Failed to fetch sales report", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

// OrderSupplies handles POST /api/products/{id}/supply
func OrderSupplies(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid product ID", http.StatusBadRequest)
		return
	}

	var req models.OrderSupplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		http.Error(w, "Quantity must be positive", http.StatusBadRequest)
		return
	}

	if err := repository.OrderSupplies(id, req.Quantity, req.Received); err != nil {
		http.Error(w, "Failed to update supplies", http.StatusInternalServerError)
		return
	}

	message := "Supply order placed successfully"
	if req.Received {
		message = "Supplies received successfully"
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}

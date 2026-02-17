package models

import (
	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the JWT claims
type Claims struct {
	UserID int    `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"` // customer or admin
	jwt.RegisteredClaims
}

// ContextKey is a type for context keys to avoid collisions
type ContextKey string

// UserContextKey is the key for the user in the context
const UserContextKey ContextKey = "user"

// ProductCategory represents the category of a product
type ProductCategory string

const (
	CategoryEastern ProductCategory = "eastern"
	CategoryWestern ProductCategory = "western"
)

// IsValid checks if the category is valid
func (c ProductCategory) IsValid() bool {
	return c == CategoryEastern || c == CategoryWestern
}

// ImageAttribution contains photo credit information
type ImageAttribution struct {
	Photographer string `json:"photographer"`
	Source       string `json:"source"`
	URL          string `json:"url"`
}

// Review represents a customer review
type Review struct {
	ID       int    `json:"id"`
	UserName string `json:"userName"`
	Rating   int    `json:"rating"`
	Comment  string `json:"comment"`
	Date     string `json:"date"`
}

// Product represents a menu item
type Product struct {
	ID                  int               `json:"id"`
	Name                string            `json:"name"`
	Price               float64           `json:"price"`
	Description         string            `json:"description"`
	Category            ProductCategory   `json:"category"`
	Image               string            `json:"image,omitempty"`
	ImageAttribution    *ImageAttribution `json:"imageAttribution,omitempty"`
	DetailedDescription string            `json:"detailedDescription,omitempty"`
	Reviews             []Review          `json:"reviews,omitempty"`
	StockQuantity       int               `json:"stockQuantity"`
	LowStockThreshold   int               `json:"lowStockThreshold"`
}

// Feedback represents customer feedback
type Feedback struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Email       string `json:"email"`
	Rating      int    `json:"rating"`
	Comment     string `json:"comment"`
	ProductID   *int   `json:"productId,omitempty"`
	ProductName string `json:"productName,omitempty"`
	Date        string `json:"date"`
}

// CustomizationOption represents an extra option for a product
type CustomizationOption struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

// OrderItem represents a single item within an order
type OrderItem struct {
	ProductID      int                   `json:"productId"`
	Quantity       int                   `json:"quantity"`
	PortionSize    string                `json:"portionSize"`
	Customizations []CustomizationOption `json:"customizations,omitempty"`
}

// Order represents a customer's order
type Order struct {
	ID         int         `json:"id"`
	UserID     int         `json:"userId"`
	Items      []OrderItem `json:"items"`
	TotalPrice float64     `json:"totalPrice"`
	Status     string      `json:"status"` // "pending", "completed", "cancelled"
	CreatedAt  string      `json:"createdAt"`
}

// User represents an authenticated user
type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
	Role     string `json:"role"` // "admin" or "customer"
	Name     string `json:"name"`
}

// LoginRequest is the payload for login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RegisterRequest is the payload for registration
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// AuthResponse is returned after successful auth
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// DailyStat represents sales statistics for a single day
type DailyStat struct {
	Date         string  `json:"date"`
	TotalOrders  int     `json:"totalOrders"`
	TotalRevenue float64 `json:"totalRevenue"`
}

// DashboardStats represents aggregated data for the dashboard
type DashboardStats struct {
	TotalOrders   int         `json:"totalOrders"`
	TotalRevenue  float64     `json:"totalRevenue"`
	LowStockItems []Product   `json:"lowStockItems"`
	Inventory     []Product   `json:"inventory"`
	DailyStats    []DailyStat `json:"dailyStats"`
}

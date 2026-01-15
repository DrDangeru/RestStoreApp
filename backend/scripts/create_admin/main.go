package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
)

const baseURL = "http://localhost:8080/api"

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  struct {
		ID    int    `json:"id"`
		Email string `json:"email"`
		Role  string `json:"role"`
		Name  string `json:"name"`
	} `json:"user"`
}

func main() {
	email := flag.String("email", "admin@restaurant.com", "Admin email")
	password := flag.String("password", "admin123", "Admin password")
	name := flag.String("name", "Admin", "Admin name")
	flag.Parse()

	req := RegisterRequest{
		Email:    *email,
		Password: *password,
		Name:     *name,
	}

	data, _ := json.Marshal(req)
	resp, err := http.Post(baseURL+"/auth/register", "application/json", bytes.NewBuffer(data))
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusCreated {
		fmt.Printf("Failed to create user: %s\n", string(body))
		os.Exit(1)
	}

	var authResp AuthResponse
	json.Unmarshal(body, &authResp)

	fmt.Printf("User created successfully!\n")
	fmt.Printf("  ID: %d\n", authResp.User.ID)
	fmt.Printf("  Email: %s\n", authResp.User.Email)
	fmt.Printf("  Name: %s\n", authResp.User.Name)
	fmt.Printf("  Role: %s\n", authResp.User.Role)
	fmt.Printf("\nNote: User is created as 'customer'. To make admin, run:\n")
	fmt.Printf("  sqlite3 restaurant_v4.db \"UPDATE users SET role='admin' WHERE email='%s'\"\n", *email)
	fmt.Printf("\nToken: %s\n", authResp.Token)
}

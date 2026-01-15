# Restaurant Backend - Go API

A simple Go REST API server for the restaurant application.

## Prerequisites

- Go 1.21 or higher

## Installation

- Navigate to the backend directory:

```bash
cd backend
```

- Install dependencies:

```bash
go mod download
```

## Running the Server

```bash
go run main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/category/{category}` - Get products by category (eastern/western)
- `GET /api/products/{id}` - Get a single product by ID

## Example Requests

```bash
# Get all products
curl http://localhost:8080/api/products

# Get eastern dishes
curl http://localhost:8080/api/products/category/eastern

# Get western dishes
curl http://localhost:8080/api/products/category/western

# Get product by ID
curl http://localhost:8080/api/products/1
```

## CORS

CORS is enabled for all origins to allow the React frontend to communicate with the API.

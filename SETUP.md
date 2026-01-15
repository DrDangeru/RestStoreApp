# Restaurant App - Go Backend + React Frontend Setup

This guide shows you how to run the React frontend with the Go backend API.

## Architecture

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Go REST API
- **Communication**: Frontend fetches data from Go API via HTTP

## Prerequisites

- **Node.js** (v16 or higher)
- **Go** (v1.21 or higher)

## Quick Start

### 1. Start the Go Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Install Go dependencies:

```bash
go mod download
```

Run the Go server:

```bash
go run main.go
```

The backend will start on `http://localhost:8080`

You should see: `Server starting on :8080...`

### 2. Start the React Frontend

Open a **new terminal** (keep the Go server running) and navigate to the project root:

```bash
cd e:\ReactPrj\RestStoreSoft
```

Install npm dependencies (if not already done):

```bash
npm install
```

Start the React dev server:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or similar)

### 3. Open the App

Open your browser and go to the URL shown by Vite (usually `http://localhost:5173`)

The React app will automatically fetch products from the Go backend!

## How It Works

1. **Go Backend** serves product data via REST API endpoints:
   - `GET /api/products` - All products
   - `GET /api/products/category/{category}` - Products by category
   - `GET /api/products/{id}` - Single product

2. **React Frontend** fetches data on load using `useEffect` hook:
   ```typescript
   useEffect(() => {
     fetch('http://localhost:8080/api/products')
       .then(res => res.json())
       .then(data => setProducts(data))
   }, [])
   ```

3. **CORS** is enabled in the Go backend to allow cross-origin requests from React

## Testing the API

You can test the Go API directly using curl or your browser:

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

## Troubleshooting

**Error: "Failed to fetch products"**
- Make sure the Go backend is running on port 8080
- Check that CORS is enabled in the Go server
- Verify the API URL in `src/App.tsx` matches your backend

**Port already in use**
- Backend: Change the port in `backend/main.go` (line with `:8080`)
- Frontend: Vite will automatically use a different port if 5173 is taken

## Next Steps

- Add a database (PostgreSQL, MySQL, SQLite) to the Go backend
- Implement POST/PUT/DELETE endpoints for CRUD operations
- Add authentication/authorization
- Deploy both services (backend to a Go hosting service, frontend to Netlify/Vercel)

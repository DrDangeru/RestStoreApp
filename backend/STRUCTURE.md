# Backend Structure

The Go backend is now organized into separate files for better maintainability.

## File Organization

### `types.go`

**Purpose**: Type definitions (equivalent to TypeScript interfaces)

Contains all struct definitions:

- `ImageAttribution` - Photo credit information
- `DetailedDescription` - Multi-paragraph product descriptions
- `Review` - Customer review data
- `Product` - Main product/menu item structure

### `data.go`

**Purpose**: Data layer

Contains:

- `GetProducts()` function that returns all product data
- All 9 products (4 Eastern, 5 Western dishes)

### `handlers.go`

**Purpose**: HTTP request handlers

Contains:

- `getProducts()` - GET /api/products
- `getProductsByCategory()` - GET /api/products/category/{category}
- `getProduct()` - GET /api/products/{id}

### `main.go`

**Purpose**: Application entry point and configuration

Contains:

- `main()` function
- `enableCORS()` middleware
- Route definitions
- Server startup

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single responsibility
2. **Easier to Navigate**: Find types, data, or handlers quickly
3. **Scalability**: Easy to add new types, products, or endpoints
4. **Testability**: Can test handlers independently
5. **Familiar Pattern**: Similar to how TypeScript projects separate types from logic

## Comparison to TypeScript

```text
Go Backend          →  TypeScript Frontend
─────────────────────  ──────────────────────
types.go            →  types.ts
data.go             →  data.ts or API calls
handlers.go         →  API routes/controllers
main.go             →  index.ts/server.ts
```

## Next Steps

When you need to:

- **Add a new product**: Edit `data.go`
- **Add a new field to Product**: Edit `types.go`
- **Add a new API endpoint**: Add handler in `handlers.go`, route in `main.go`
- **Change server config**: Edit `main.go`

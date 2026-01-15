# Product Manager CLI

A command-line tool for managing restaurant products.

## Build

```bash
cd scripts
go build -o product_manager.exe product_manager.go
```

## Usage

**Note:** The backend server must be running on `localhost:8080` for these commands to work.

### Add a product

```bash
./product_manager add --name "Sushi Roll" --price 15.99 --category eastern --desc "Fresh salmon roll"
```

### Delete a product

```bash
./product_manager delete --id 5
```

### List products

```bash
# List all
./product_manager list

# Filter by category
./product_manager list --category eastern
```

### Import from JSON

```bash
./product_manager import --file sample_products.json
```

### Export to JSON

```bash
# Export all
./product_manager export --file all_products.json

# Export by category
./product_manager export --file eastern.json --category eastern
```

## JSON Format

Products should be in this format:

```json
[
  {
    "name": "Product Name",
    "price": 12.99,
    "description": "Short description",
    "category": "eastern",
    "image": "https://example.com/image.jpg",
    "detailedDescription": "Longer description..."
  }
]
```

## API Endpoints

You can also use the REST API directly:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create a product |
| GET | `/api/products/{id}` | Get a product |
| PUT | `/api/products/{id}` | Update a product |
| DELETE | `/api/products/{id}` | Delete a product |

### Example with curl

```bash
# Add product
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Ramen","price":13.99,"category":"eastern","description":"Japanese noodle soup"}'

# Delete product
curl -X DELETE http://localhost:8080/api/products/5

# Update product
curl -X PUT http://localhost:8080/api/products/5 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Ramen","price":14.99,"category":"eastern"}'
```

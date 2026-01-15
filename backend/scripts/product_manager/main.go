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

type ImageAttribution struct {
	Photographer string `json:"photographer"`
	Source       string `json:"source"`
	URL          string `json:"url"`
}

type Product struct {
	ID                  int               `json:"id,omitempty"`
	Name                string            `json:"name"`
	Price               float64           `json:"price"`
	Description         string            `json:"description"`
	Category            string            `json:"category"`
	Image               string            `json:"image,omitempty"`
	ImageAttribution    *ImageAttribution `json:"imageAttribution,omitempty"`
	DetailedDescription string            `json:"detailedDescription,omitempty"`
}

func main() {
	// Subcommands
	addCmd := flag.NewFlagSet("add", flag.ExitOnError)
	deleteCmd := flag.NewFlagSet("delete", flag.ExitOnError)
	listCmd := flag.NewFlagSet("list", flag.ExitOnError)
	importCmd := flag.NewFlagSet("import", flag.ExitOnError)
	exportCmd := flag.NewFlagSet("export", flag.ExitOnError)

	// Add flags
	addName := addCmd.String("name", "", "Product name (required)")
	addPrice := addCmd.Float64("price", 0, "Product price")
	addDesc := addCmd.String("desc", "", "Product description")
	addCategory := addCmd.String("category", "", "Product category: eastern or western (required)")
	addImage := addCmd.String("image", "", "Product image URL")
	addDetailed := addCmd.String("detailed", "", "Detailed description")

	// Delete flags
	deleteID := deleteCmd.Int("id", 0, "Product ID to delete (required)")

	// List flags
	listCategory := listCmd.String("category", "", "Filter by category (optional)")

	// Import flags
	importFile := importCmd.String("file", "", "JSON file to import (required)")

	// Export flags
	exportFile := exportCmd.String("file", "products.json", "Output JSON file")
	exportCategory := exportCmd.String("category", "", "Filter by category (optional)")

	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "add":
		addCmd.Parse(os.Args[2:])
		if *addName == "" || *addCategory == "" {
			fmt.Println("Error: --name and --category are required")
			addCmd.PrintDefaults()
			os.Exit(1)
		}
		addProduct(*addName, *addPrice, *addDesc, *addCategory, *addImage, *addDetailed)

	case "delete":
		deleteCmd.Parse(os.Args[2:])
		if *deleteID == 0 {
			fmt.Println("Error: --id is required")
			deleteCmd.PrintDefaults()
			os.Exit(1)
		}
		deleteProduct(*deleteID)

	case "list":
		listCmd.Parse(os.Args[2:])
		listProducts(*listCategory)

	case "import":
		importCmd.Parse(os.Args[2:])
		if *importFile == "" {
			fmt.Println("Error: --file is required")
			importCmd.PrintDefaults()
			os.Exit(1)
		}
		importProducts(*importFile)

	case "export":
		exportCmd.Parse(os.Args[2:])
		exportProducts(*exportFile, *exportCategory)

	default:
		printUsage()
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Println("Product Manager CLI")
	fmt.Println("\nUsage: product_manager <command> [options]")
	fmt.Println("\nCommands:")
	fmt.Println("  add      Add a new product")
	fmt.Println("  delete   Delete a product by ID")
	fmt.Println("  list     List all products")
	fmt.Println("  import   Import products from JSON file")
	fmt.Println("  export   Export products to JSON file")
	fmt.Println("\nRun 'product_manager <command> -h' for command-specific help")
}

func addProduct(name string, price float64, desc, category, image, detailed string) {
	product := Product{
		Name:                name,
		Price:               price,
		Description:         desc,
		Category:            category,
		Image:               image,
		DetailedDescription: detailed,
	}

	data, _ := json.Marshal(product)
	resp, err := http.Post(baseURL+"/products", "application/json", bytes.NewBuffer(data))
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Error: %s\n", string(body))
		os.Exit(1)
	}

	var created Product
	json.NewDecoder(resp.Body).Decode(&created)
	fmt.Printf("Created product: ID=%d, Name=%s\n", created.ID, created.Name)
}

func deleteProduct(id int) {
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("%s/products/%d", baseURL, id), nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Error: %s\n", string(body))
		os.Exit(1)
	}

	fmt.Printf("Deleted product ID=%d\n", id)
}

func listProducts(category string) {
	url := baseURL + "/products"
	if category != "" {
		url = fmt.Sprintf("%s/products/category/%s", baseURL, category)
	}

	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	var products []Product
	json.NewDecoder(resp.Body).Decode(&products)

	fmt.Printf("Found %d products:\n\n", len(products))
	for _, p := range products {
		fmt.Printf("ID: %d | %s | $%.2f | %s\n", p.ID, p.Name, p.Price, p.Category)
	}
}

func importProducts(filename string) {
	data, err := os.ReadFile(filename)
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		os.Exit(1)
	}

	var products []Product
	if err := json.Unmarshal(data, &products); err != nil {
		fmt.Printf("Error parsing JSON: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Importing %d products...\n", len(products))
	for _, p := range products {
		data, _ := json.Marshal(p)
		resp, err := http.Post(baseURL+"/products", "application/json", bytes.NewBuffer(data))
		if err != nil {
			fmt.Printf("  Error adding %s: %v\n", p.Name, err)
			continue
		}
		resp.Body.Close()

		if resp.StatusCode == http.StatusCreated {
			fmt.Printf("  Added: %s\n", p.Name)
		} else {
			fmt.Printf("  Failed: %s (status %d)\n", p.Name, resp.StatusCode)
		}
	}
	fmt.Println("Import complete!")
}

func exportProducts(filename, category string) {
	url := baseURL + "/products"
	if category != "" {
		url = fmt.Sprintf("%s/products/category/%s", baseURL, category)
	}

	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	var products []Product
	json.NewDecoder(resp.Body).Decode(&products)

	data, _ := json.MarshalIndent(products, "", "  ")
	if err := os.WriteFile(filename, data, 0644); err != nil {
		fmt.Printf("Error writing file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Exported %d products to %s\n", len(products), filename)
}

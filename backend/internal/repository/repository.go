package repository

import (
	"database/sql"
	"encoding/json"
	"log"
	"log/slog"

	"restaurant-backend/internal/models"

	_ "modernc.org/sqlite"
)

var db *sql.DB

// InitDB initializes the database connection
func InitDB() {
	var err error
	db, err = sql.Open("sqlite", "./restaurant_v4.db")
	if err != nil {
		slog.Error("failed to open database", "error", err)
		log.Fatal(err)
	}

	if err = db.Ping(); err != nil {
		slog.Error("failed to ping database", "error", err)
		log.Fatal(err)
	}

	createTables()
}

// SeedDB seeds the database with initial data
func SeedDB(products []models.Product) {
	const migrationID = 1 // Unique ID for this seeding version
	const migrationName = "initial_seed_v1"

	// Check if this specific migration ID has already been executed
	var alreadyExecuted bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM migrations WHERE id = ?)", migrationID).Scan(&alreadyExecuted)
	if err != nil {
		log.Printf("Error checking migration status: %v", err)
	}

	if alreadyExecuted {
		slog.Info("migration already performed",
			"id", migrationID,
			"name", migrationName)
		return
	}

	slog.Info("executing migration", "id", migrationID, "name", migrationName)

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}
	defer tx.Rollback()

	// Perform Seeding or Updating within a single transaction
	for _, p := range products {
		ia, _ := json.Marshal(p.ImageAttribution)

		// Using INSERT OR REPLACE (Upsert) for efficiency
		_, err := tx.Exec(`
		INSERT OR REPLACE INTO products (id, name, price, description,
		category, image, image_attribution, detailed_description)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			p.ID, p.Name, p.Price, p.Description, p.Category, p.Image,
			string(ia), p.DetailedDescription)
		if err != nil {
			log.Printf("Error seeding/updating product %s: %v", p.Name, err)
			continue
		}

		for _, r := range p.Reviews {
			_, err := tx.Exec(`
			INSERT OR IGNORE INTO reviews (product_id, user_name, rating,
			comment, date)
			VALUES (?, ?, ?, ?, ?)`,
				p.ID, r.UserName, r.Rating, r.Comment, r.Date)
			if err != nil {
				log.Printf("Error seeding review for %s: %v", p.Name, err)
			}
		}
	}

	// Record migration by ID and Name
	_, err = tx.Exec("INSERT INTO migrations (id, name) VALUES (?, ?)",
		migrationID, migrationName)
	if err != nil {
		log.Printf("Error recording migration: %v", err)
	}

	if err := tx.Commit(); err != nil {
		log.Fatal(err)
	}
	log.Println("Migration successful.")
}

func createTables() {
	query := `
	CREATE TABLE IF NOT EXISTS migrations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE NOT NULL,
		executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS products (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		price REAL NOT NULL,
		description TEXT,
		category TEXT NOT NULL,
		image TEXT,
		image_attribution TEXT,
		detailed_description TEXT,
		portionSize TEXT,
		protein TEXT,
		calories TEXT
	);

	CREATE TABLE IF NOT EXISTS reviews (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		product_id INTEGER,
		user_name TEXT,
		rating INTEGER,
		comment TEXT,
		date TEXT,
		image TEXT,
		FOREIGN KEY(product_id) REFERENCES products(id)
	);

	CREATE TABLE IF NOT EXISTS feedback (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT NOT NULL,
		rating INTEGER NOT NULL,
		comment TEXT NOT NULL,
		product_id INTEGER,
		product_name TEXT,
		date TEXT NOT NULL,
		FOREIGN KEY(product_id) REFERENCES products(id)
	);

	CREATE TABLE IF NOT EXISTS orders (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		total_price REAL NOT NULL,
		status TEXT NOT NULL,
		created_at TEXT DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY(user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS order_items (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		order_id INTEGER,
		product_id INTEGER,
		quantity INTEGER NOT NULL,
		portion_size TEXT NOT NULL,
		customizations TEXT, -- JSON array of CustomizationOption
		FOREIGN KEY(order_id) REFERENCES orders(id),
		FOREIGN KEY(product_id) REFERENCES products(id)
	);
	`
	_, err := db.Exec(query)
	if err != nil {
		log.Fatal(err)
	}
}

// FetchProducts retrieves all products from the database
func FetchProducts() ([]models.Product, error) {
	rows, err := db.Query(`SELECT id, name, price, description, category, 
		image, image_attribution, detailed_description FROM products`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		var iaJSON string
		err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Description, &p.Category,
			&p.Image, &iaJSON, &p.DetailedDescription)
		if err != nil {
			return nil, err
		}
		if p.Category == models.CategoryWestern {
			log.Printf("DEBUG: Product %s description length: %d",
				p.Name, len(p.DetailedDescription))
		}
		json.Unmarshal([]byte(iaJSON), &p.ImageAttribution)

		p.Reviews, _ = fetchReviews(p.ID)
		products = append(products, p)
	}
	return products, nil
}

// FetchProductByID retrieves a single product by ID
func FetchProductByID(id int) (*models.Product, error) {
	var p models.Product
	var iaJSON string
	err := db.QueryRow(`SELECT id, name, price, description, category, image, 
		image_attribution, detailed_description FROM products 
		WHERE id = ?`, id).
		Scan(&p.ID, &p.Name, &p.Price, &p.Description, &p.Category, &p.Image,
			&iaJSON, &p.DetailedDescription)
	if err != nil {
		return nil, err
	}
	json.Unmarshal([]byte(iaJSON), &p.ImageAttribution)

	p.Reviews, _ = fetchReviews(p.ID)
	return &p, nil
}

// FetchProductsByCategory retrieves products by category
func FetchProductsByCategory(category string) ([]models.Product, error) {
	rows, err := db.Query(`SELECT id, name, price, description, category, 
		image, image_attribution, detailed_description FROM products 
		WHERE category = ?`, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		var iaJSON string
		err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Description, &p.Category,
			&p.Image, &iaJSON, &p.DetailedDescription)
		if err != nil {
			return nil, err
		}
		json.Unmarshal([]byte(iaJSON), &p.ImageAttribution)

		p.Reviews, _ = fetchReviews(p.ID)
		products = append(products, p)
	}
	return products, nil
}

func fetchReviews(productID int) ([]models.Review, error) {
	rows, err := db.Query(`SELECT id, user_name, rating, comment, date 
		FROM reviews WHERE product_id = ?`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var r models.Review
		if err := rows.Scan(&r.ID, &r.UserName, &r.Rating, &r.Comment,
			&r.Date); err != nil {
			return nil, err
		}
		reviews = append(reviews, r)
	}
	return reviews, nil
}

// SaveFeedback saves customer feedback to the database
func SaveFeedback(feedback *models.Feedback) error {
	result, err := db.Exec(`
		INSERT INTO feedback (name, email, rating, comment, product_id, 
			product_name, date)
		VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
		feedback.Name, feedback.Email, feedback.Rating, feedback.Comment,
		feedback.ProductID, feedback.ProductName)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	feedback.ID = int(id)
	return nil
}

// InsertProduct adds a new product to the database
func InsertProduct(p *models.Product) error {
	ia, _ := json.Marshal(p.ImageAttribution)
	result, err := db.Exec(`
		INSERT INTO products (name, price, description, category, image, 
			image_attribution, detailed_description)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		p.Name, p.Price, p.Description, p.Category, p.Image, string(ia),
		p.DetailedDescription)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	p.ID = int(id)
	return nil
}

// UpdateProduct updates an existing product in the database
func UpdateProduct(p *models.Product) error {
	ia, _ := json.Marshal(p.ImageAttribution)
	_, err := db.Exec(`
		UPDATE products SET name=?, price=?, description=?, category=?, 
		image=?, image_attribution=?, detailed_description=?
		WHERE id=?`,
		p.Name, p.Price, p.Description, p.Category, p.Image, string(ia),
		p.DetailedDescription, p.ID)
	return err
}

// DeleteProduct removes a product and its reviews from the database
func DeleteProduct(id int) error {
	_, err := db.Exec("DELETE FROM reviews WHERE product_id = ?", id)
	if err != nil {
		return err
	}
	_, err = db.Exec("DELETE FROM products WHERE id = ?", id)
	return err
}

// FetchAllFeedback retrieves all feedback from the database
func FetchAllFeedback() ([]models.Feedback, error) {
	rows, err := db.Query(`SELECT id, name, email, rating, comment, 
		product_id, product_name, date FROM feedback ORDER BY date DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feedbacks []models.Feedback
	for rows.Next() {
		var f models.Feedback
		var productID sql.NullInt64
		var productName sql.NullString
		err := rows.Scan(&f.ID, &f.Name, &f.Email, &f.Rating, &f.Comment,
			&productID, &productName, &f.Date)
		if err != nil {
			return nil, err
		}
		if productID.Valid {
			pid := int(productID.Int64)
			f.ProductID = &pid
		}
		if productName.Valid {
			f.ProductName = productName.String
		}
		feedbacks = append(feedbacks, f)
	}
	return feedbacks, nil
}

// CreateUser inserts a new user into the database
func CreateUser(user *models.User) error {
	result, err := db.Exec(`
		INSERT INTO users (email, password, name, role)
		VALUES (?, ?, ?, ?)`,
		user.Email, user.Password, user.Name, user.Role)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = int(id)
	return nil
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := db.QueryRow(`SELECT id, email, password, name, role 
		FROM users WHERE email = ?`, email).
		Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.Role)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateOrder saves a new order and its items to the database
func CreateOrder(order *models.Order) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(`
		INSERT INTO orders (user_id, total_price, status)
		VALUES (?, ?, ?)`,
		order.UserID, order.TotalPrice, order.Status)
	if err != nil {
		return err
	}

	orderID, err := result.LastInsertId()
	if err != nil {
		return err
	}
	order.ID = int(orderID)

	for _, item := range order.Items {
		custJSON, _ := json.Marshal(item.Customizations)
		_, err := tx.Exec(`
			INSERT INTO order_items (order_id, product_id, quantity, 
				portion_size, customizations)
			VALUES (?, ?, ?, ?, ?)`,
			order.ID, item.ProductID, item.Quantity, item.PortionSize,
			string(custJSON))
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// FetchOrdersByUserID retrieves all orders for a specific user
func FetchOrdersByUserID(userID int) ([]models.Order, error) {
	rows, err := db.Query(`SELECT id, user_id, total_price, status, created_at 
		FROM orders WHERE user_id = ? ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.UserID, &o.TotalPrice, &o.Status,
			&o.CreatedAt); err != nil {
			return nil, err
		}

		// Fetch items for each order
		o.Items, _ = fetchOrderItems(o.ID)
		orders = append(orders, o)
	}
	return orders, nil
}

func fetchOrderItems(orderID int) ([]models.OrderItem, error) {
	rows, err := db.Query(`SELECT product_id, quantity, portion_size, 
		customizations FROM order_items WHERE order_id = ?`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		var custJSON string
		if err := rows.Scan(&item.ProductID, &item.Quantity, &item.PortionSize,
			&custJSON); err != nil {
			return nil, err
		}
		json.Unmarshal([]byte(custJSON), &item.Customizations)
		items = append(items, item)
	}
	return items, nil
}

// GetUserCount returns the total number of users in the database
func GetUserCount() (int, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	return count, err
}

// GetUserByID retrieves a user by ID
func GetUserByID(id int) (*models.User, error) {
	var user models.User
	err := db.QueryRow(`SELECT id, email, password, name, role 
		FROM users WHERE id = ?`, id).
		Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.Role)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

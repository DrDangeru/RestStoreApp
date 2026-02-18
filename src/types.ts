export type ProductCategory = 'eastern' | 'western';

export interface Review {
    id: number;
    userName: string;
    rating: number;
    comment: string;
    date: string;
    stars?: number;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    detailedDescription?: string;
    reviews?: Review[];
    category: ProductCategory;
    image?: string;
    imageAttribution?: {
        photographer: string;
        source: string;
        url: string;
    };
    stockQuantity?: number;
    lowStockThreshold?: number;
    orderedQuantity?: number;
}

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'customer';
    phone: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface DailyStat {
    date: string;
    totalOrders: number;
    totalRevenue: number;
}

export interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    lowStockItems: Product[];
    inventory: Product[];
    dailyStats: DailyStat[];
}

export interface CustomizationOption {
    id: string;
    name: string;
    price: number;
}

export interface CartItem {
    product: Product;
    quantity: number;
    portionSize: string;
    customizations?: CustomizationOption[];
}

export interface PurchasedProduct {
    product: Product;
    quantity: number;
    feedback: string;
    rating: number;
    transactionId: string;
}

export interface Feedback {
    id?: number;
    name: string;
    email: string;
    rating: number;
    comment: string;
    productId?: number;
    productName?: string;
    date?: string;
}

export interface OrderItem {
    productId: number;
    quantity: number;
    portionSize: string;
    customizations?: CustomizationOption[];
}

export interface Order {
    id: number;
    userId: number;
    items: OrderItem[];
    totalPrice: number;
    status: string;
    createdAt: string;
}
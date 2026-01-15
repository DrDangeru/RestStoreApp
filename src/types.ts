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
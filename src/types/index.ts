// Product Types
export interface ProductVariant {
  _id: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

export interface ImageRenditions {
  original: string;
  medium: string;
  thumbnail: string;
  webp?: string;
  avif?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  imageUrls: string[]; // Will now contain the primary display image (e.g., medium.webp)
  imageRenditions: ImageRenditions[]; // New: Stores URLs for different sizes/formats
  imageProcessingStatus: 'pending' | 'completed' | 'failed'; // New: Tracks image processing status
  isFeatured: boolean;
  variants: ProductVariant[];
  averageRating: number; // New: Average rating of the product
  numberOfReviews: number; // New: Total number of reviews
  createdAt: string;
  updatedAt: string;
}

// New: Paginated response specifically for products
export interface PaginatedProductsResponse {
  success: boolean;
  products: Product[];
  totalProducts: number;
  nextPage: number | null;
}

// Order Types
export interface OrderItem {
  _id: string;
  productId: string;
  variantId: string;
  quantity: number;
  nameAtTime: string;
  imageAtTime: string;
  priceAtTime: number;
  sizeAtTime: string;
  colorAtTime: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  _id: string;
  userId: { // Updated to reflect populated user data
    _id: string;
    userName: string;
  };
  orderNumber: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User {
  _id: string;
  email: string;
  userName: string;
  phoneNumber: string; // Added phone number
  isVerified: boolean; // Added verification status
  lastLogin: string; // Added last login date
  role?: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
  totalOrders?: number; // Aggregated from backend
  totalSpent?: number; // Aggregated from backend
}

// Review Types
export interface Review {
  _id: string;
  productId: { // Populated product details
    _id: string;
    name: string;
    imageUrls: string[];
  };
  userId: { // Populated user details
    _id: string;
    userName: string;
  };
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Cart Types
export interface CartItem {
  _id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// Dashboard Analytics Types
export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  productsGrowth: number;
  statusCounts: { _id: OrderStatus; count: number }[];
  recentOrders: Order[];
}

// Sales data point for charts
export interface SalesDataPoint {
  date: string; // e.g., "YYYY-MM-DD"
  revenue: number;
  orders: number;
}

// Top Product data
export interface TopProductData {
  _id: string; // Product ID
  name: string;
  imageUrls: string[];
  category: string;
  totalSales: number; // Total quantity sold
  totalRevenue: number; // Total revenue generated
}

// New: Customer Growth data point for charts
export interface CustomerGrowthDataPoint {
  date: string;
  newCustomers: number;
}

// New: Category Type
export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  product?: T; // Changed from 'data' to 'product' for consistency with backend
  data?: T; // Keep data for other responses
}

// Removed generic PaginatedResponse as it's not used consistently
// export interface PaginatedResponse<T> {
//   data: T[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// Form Types
export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  imageUrls: string[];
  variants: {
    size: string;
    color: string;
    price: number;
    stock: number;
  }[];
}

export interface OrderUpdateData {
  status: OrderStatus;
}

// New: FilterState for products in AdminClient
export interface ProductsFilterState {
  page?: number;
  limit?: number;
  searchTerm?: string;
  categories?: string;
  priceRange?: string;
  colors?: string;
  sizes?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'averageRating-desc' | 'numberOfReviews-desc' | 'relevance-desc' | 'createdAt-desc';
  sortOrder?: 'asc' | 'desc'; // Added sortOrder for consistency, though sortBy handles direction
  includeProcessing?: boolean;
}
export interface ContactMessage {

  _id: string;

  name: string;

  email: string;

  subject: string;

  message: string;

  ip?: string;

  userAgent?: string;

  createdAt: string;

}



export interface PaginatedContactMessagesResponse {

  messages: ContactMessage[];

  totalMessages: number;

  nextPage: number | null;

}
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If an API call is unauthorized, log the user out.
      useAuthStore.getState().logout();
      // The ProtectedRoute component will then redirect to /login
    }
    return Promise.reject(error);
  }
);

// API endpoints (keeping this for reference, but services are preferred)
export const endpoints = {
  // Auth
  login: '/auth/login',
  logout: '/auth/logout',
  profile: '/auth/profile',
  
  // Products
  products: '/products',
  productById: '/products', // Changed to string
  
  // Orders
  orders: '/orders',
  adminOrders: '/orders/admin',
  orderMetrics: '/orders/metrics',
  orderById: '/orders', // Changed to string
  updateOrderStatus: '/orders', // Changed to string
  
  // Cart
  cart: '/cart',
  
  // Reviews
  reviews: '/reviews',
  productReviews: '/reviews/product', // Changed to string
  
  // Wishlist
  wishlist: '/wishlist',

  // Reports
  salesReport: '/reports/sales',
  customerReport: '/reports/customers',
  inventoryReport: '/reports/inventory',
  orderHistoryReport: '/reports/order-history',
  reviewSummaryReport: '/reports/review-summary',
} as const;
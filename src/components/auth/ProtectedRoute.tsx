import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();

  // If not authenticated OR user is not an admin, redirect to the login page.
  // The AuthInitializer component handles the initial check and redirection.
  // This component acts as a final gate.
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
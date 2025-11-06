"use client";

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const { setUser, logout, isAuthenticated, user } = useAuthStore();
  const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false);
  const refreshingRef = useRef(false);

  const { data, isLoading, isError: isAuthQueryError, error: authQueryError, refetch: refetchAuthStatus } = useQuery({
    queryKey: ['checkAuth'],
    queryFn: authService.checkAuth,
    enabled: true,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (isLoading) return;

    if (data?.success && data.user) {
      if (data.user.role === 'admin') {
        setUser(data.user);
      } else {
        logout();
      }
      setIsInitialCheckComplete(true);
    } else if (isAuthQueryError) {
      // Extract message safely
      const msg =
        (authQueryError as any)?.response?.data?.message ||
        (authQueryError as any)?.message ||
        '';

      const looksLikeExpired =
        typeof msg === 'string' &&
        (msg.toLowerCase().includes('access token expired') ||
          msg.toLowerCase().includes('token expired') ||
          msg.toLowerCase().includes('jwt expired') ||
          msg.toLowerCase().includes('expired token'));

      if (looksLikeExpired && !refreshingRef.current) {
        refreshingRef.current = true;
        authService.refreshToken()
          .then((refreshed) => {
            if (refreshed.success) {
              refetchAuthStatus();
            } else {
              logout();
              setIsInitialCheckComplete(true);
            }
          })
          .catch((err) => {
            console.warn('[AuthInitializer] refresh failed', err);
            logout();
            setIsInitialCheckComplete(true);
          })
          .finally(() => {
            refreshingRef.current = false;
          });
      } else {
        // Not expired or already refreshing: logout and complete
        logout();
        setIsInitialCheckComplete(true);
      }
    }
  }, [isLoading, data, isAuthQueryError, authQueryError, setUser, logout, refetchAuthStatus, isAuthenticated]);

  if (!isInitialCheckComplete || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService, loginSchema, LoginData } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function Login() {
  const navigate = useNavigate();
  const { setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    const toastId = toast.loading('Logging in...');
    try {
      const response = await authService.login(data);
      if (response.success && response.user) {
        // IMPORTANT: Check for admin role here
        if (response.user.role === 'admin') {
          setUser(response.user);
          toast.success('Login successful!', { id: toastId });
          navigate('/');
        } else {
          // If not admin, log out and show an error
          logout(); // Clear any partial session data
          toast.error('You do not have permission to access the admin panel.', { id: toastId });
        }
      } else {
        throw new Error(response.message || 'Login failed.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
      toast.error(errorMessage, { id: toastId });
      logout(); // Ensure local state is cleared on any login failure
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle>Testing Credentials</AlertTitle>
            <AlertDescription>
              Use placeholder values for testing: 
              <code className="font-mono text-sm font-semibold block mt-1">
                Email: admin@uniquegamer.dpdns.org <br />
                Password: Admin123!
              </code>
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername">Email or Username</Label>
              <Input
                id="emailOrUsername"
                placeholder="admin@example.com"
                {...register('emailOrUsername')}
                disabled={isLoading}
              />
              {errors.emailOrUsername && <p className="text-sm text-destructive">{errors.emailOrUsername.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
import { Button } from '@/components/ui/button';
import { Bell, Search, User, LogOut, Loader2 } from 'lucide-react'; // Import Loader2
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService.ts';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react'; // Import useState
import ThemeToggle from './ThemeToggle'; // Import ThemeToggle

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false); // State for logout loading

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const toastId = toast.loading('Logging out...');
    try {
      await authService.logout();
      logout();
      toast.success('Logged out successfully', { id: toastId });
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed', { id: toastId });
      // Force logout on client even if server fails
      logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-10 w-64 rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <ThemeToggle /> {/* Add Theme Toggle here */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">{user?.userName || 'Admin'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}
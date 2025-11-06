import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

interface OrdersHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export const OrdersHeader = ({ onRefresh, onExport, isLoading }: OrdersHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders and track fulfillment</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
};
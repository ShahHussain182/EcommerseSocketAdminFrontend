import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { getStatusIcon, statusConfig } from '@/lib/orderUtils';

interface BulkActionsBarProps {
  selectedOrders: string[];
  onBulkUpdateStatus: (newStatus: OrderStatus) => void;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({ selectedOrders, onBulkUpdateStatus, onClearSelection }: BulkActionsBarProps) => {
  if (selectedOrders.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <p>{selectedOrders.length} orders selected</p>
      <div className="flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Update Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Set Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(statusConfig).map((status) => (
              <DropdownMenuItem 
                key={status} 
                onClick={() => onBulkUpdateStatus(status as OrderStatus)}
              >
                <div className="flex items-center">
                  {getStatusIcon(status as OrderStatus)}
                  <span className="ml-2">{status}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </div>
    </div>
  );
};
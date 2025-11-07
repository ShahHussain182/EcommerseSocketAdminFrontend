
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Edit, MoreHorizontal, Trash2, ChevronLeft, ChevronRight, Loader2, Package, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { orderService } from '@/services/orderService';
import type { Order, OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { getStatusIcon, getStatusBadgeVariant, statusConfig } from '@/lib/orderUtils';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  pendingOrderIds?: string[];
  totalOrders: number;
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
  selectedOrders: string[];
  toggleOrderSelection: (orderId: string) => void;
  selectAllOrders: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onViewOrderDetails: (order: Order) => void;
}

export const OrdersTable = ({
  orders,
  isLoading,
  error,
  
  totalPages,
  page,
  setPage,
  selectedOrders,
  toggleOrderSelection,
  selectAllOrders,
  onUpdateOrderStatus,
  onViewOrderDetails,
  pendingOrderIds = []
}: OrdersTableProps) => {
  const queryClient = useQueryClient();

  // Mutation for deleting an order (cancelling it)
  const deleteOrderMutation = useMutation({
    mutationFn: (orderId: string) => orderService.updateOrderStatus(orderId, 'Cancelled'),
    // optimistic update
    onMutate: async (orderIdToDelete) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
  
      const previous = queryClient.getQueryData<{ data: Order[]; totalOrders?: number } | undefined>(['orders']);
  
      // Optimistically mark the order as Cancelled in cache (defensive)
      queryClient.setQueryData(['orders'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((o: Order) => (o._id === orderIdToDelete ? { ...o, status: 'Cancelled' } : o)),
        };
      });
  
      // show a loading toast keyed by order id so we can update/replace it later
      toast.loading('Cancelling order...', { id: `cancel-${orderIdToDelete}` });
  
      return { previous };
    },
    onSuccess: (res: any, orderIdToDelete: string) => {
      // res should be the server body: { success, message, order }
      const orderNumber =
        res?.order?.orderNumber ?? res?.orderNumber ?? res?.data?.orderNumber ?? 'unknown';
  
      // replace loading toast with success toast
      toast.success(`Order #${orderNumber} cancelled successfully`, { id: `cancel-${orderIdToDelete}` });
    },
    onError: (err: any, orderIdToDelete: string, context) => {
      // restore previous cache on error
      if (context?.previous) {
        queryClient.setQueryData(['orders'], context.previous);
      }
  
      // show a clearer error message (prefer server message if present)
      const serverMsg = err?.response?.data?.message;
      toast.error(serverMsg || 'Failed to cancel order', { id: `cancel-${orderIdToDelete}` });
  
      // keep the error in console for debugging
      console.error('Failed to cancel order:', err);
    },
    onSettled: () => {
      // re-fetch so server is authoritative
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
  const pendingSet = new Set(pendingOrderIds);
  const handleDeleteOrder = (orderId: string) => {
    deleteOrderMutation.mutate(orderId);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={selectAllOrders}
                className="h-4 w-4"
              />
            </TableHead><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading orders...
                </div>
              </TableCell></TableRow>
          ) : error ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive mb-2" />
                  <h3 className="text-lg font-semibold">Error loading orders</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an issue fetching the orders.
                  </p>
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}>Try Again</Button>
                </div>
              </TableCell></TableRow>
          ) : orders.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8">
                <div className="flex flex-col items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
                  <p className="text-muted-foreground">
                    No orders match your search criteria.
                  </p>
                </div>
              </TableCell></TableRow>
          ) : (
            orders.map((order) => (
              <TableRow 
                key={order._id}
                className={cn(selectedOrders.includes(order._id) ? "bg-muted" : "")}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order._id)}
                    onChange={() => toggleOrderSelection(order._id)}
                    className="h-4 w-4"
                  />
                </TableCell><TableCell>
                  <div>
                    <div className="font-medium">#{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">ID: {order._id.slice(-8)}</div>
                  </div>
                </TableCell><TableCell>
                  <div>
                    <div className="font-medium">{order.userId?.userName || order.shippingAddress.fullName}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.shippingAddress.city}, {order.shippingAddress.state}
                    </div>
                  </div>
                </TableCell><TableCell>
                  <div>
                    <div className="font-medium">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items[0]?.nameAtTime}{order.items.length > 1 && ` +${order.items.length - 1} more`}
                    </div>
                  </div>
                </TableCell><TableCell>
                  <div className="font-medium">${order.totalAmount.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{order.paymentMethod}</div>
                </TableCell><TableCell>
  <div className="flex items-center gap-2">
    <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-1 w-fit">
      {getStatusIcon(order.status)}
      {order.status}
    </Badge>

    {pendingSet.has(order._id) && (
      <div className="flex items-center text-sm text-muted-foreground ml-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-1">Updating…</span>
      </div>
    )}
  </div>
</TableCell><TableCell>
                  <div>
                    <div className="font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</div>
                    <div className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'HH:mm')}</div>
                  </div>
                </TableCell><TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewOrderDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onViewOrderDetails(order)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Order
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        {Object.keys(statusConfig).map((status) => (
                          <DropdownMenuItem 
                            key={status} 
                            onClick={() => onUpdateOrderStatus(order._id, status as OrderStatus)}
                          >
                            <div className="flex items-center">
                              {getStatusIcon(status as OrderStatus)}
                              <span className="ml-2">{status}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Cancel Order
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently cancel this order.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, keep order</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(order._id)} disabled={deleteOrderMutation.isPending}>
                                {deleteOrderMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Yes, cancel order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
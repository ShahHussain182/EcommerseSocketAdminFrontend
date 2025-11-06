import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { OrdersHeader } from '@/components/orders/OrdersHeader';
import { OrdersStatsCards } from '@/components/orders/OrdersStatsCards';
import { OrdersFilterBar } from '@/components/orders/OrdersFilterBar';
import { BulkActionsBar } from '@/components/orders/BulkActionsBar';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetailsDialog } from '@/components/orders/OrderDetailsDialog';

import { orderService } from '@/services/orderService';
import type { Order, OrderStatus } from '@/types';

export function Orders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pendingOrderIds, setPendingOrderIds] = useState<string[]>([]);

const addPending = (id: string) => setPendingOrderIds(prev => prev.includes(id) ? prev : [...prev, id]);
const removePending = (id: string) => setPendingOrderIds(prev => prev.filter(x => x !== id));
  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on new search term
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Query for orders from API
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', page, limit, debouncedSearchTerm, statusFilter, sortBy, sortOrder],
    queryFn: () => orderService.getAllOrders({ 
      page, 
      limit, 
      searchTerm: debouncedSearchTerm || undefined,
      statusFilter: statusFilter === 'All' ? undefined : statusFilter,
      sortBy,
      sortOrder,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const orders = ordersData?.data || [];
  const totalOrders = ordersData?.totalOrders || 0;
  const totalPages = Math.ceil(totalOrders / limit);

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) =>
      orderService.updateOrderStatus(orderId, newStatus),
    onMutate: ({ orderId }) => {
      // purely visual: mark this order as "updating"
      addPending(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
    onSettled: (_data, _err, variables) => {
      // remove pending marker and re-fetch authoritative data
      if (variables?.orderId) removePending(variables.orderId);
      // you already invalidate in onSuccess; this ensures cleanup on both success & error
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatusMutation.mutate({ orderId, newStatus });
  };

  const handleBulkUpdateStatus = async (newStatus: OrderStatus) => {
    if (selectedOrders.length === 0) return;
    
    try {
      await Promise.all(
        selectedOrders.map(id => orderService.updateOrderStatus(id, newStatus))
      );
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedOrders([]);
      toast.success(`Updated ${selectedOrders.length} orders to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update orders');
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrders.length === orders.length && orders.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
  };

  const exportOrders = () => {
    // In a real app, this would generate a CSV file
    toast.success('Orders exported successfully');
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <OrdersHeader 
        onRefresh={() => refetch()} 
        onExport={exportOrders} 
        isLoading={isLoading} 
      />

      <OrdersStatsCards orders={orders} totalOrders={totalOrders} />

      <OrdersFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onApplyFilters={() => setPage(1)} // Trigger refetch by resetting page
      />

      <BulkActionsBar
        selectedOrders={selectedOrders}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onClearSelection={() => setSelectedOrders([])}
      />

      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        error={error}
        totalOrders={totalOrders}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        selectedOrders={selectedOrders}
        toggleOrderSelection={toggleOrderSelection}
        selectAllOrders={selectAllOrders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onViewOrderDetails={handleViewOrderDetails}
        pendingOrderIds={pendingOrderIds}

      />

      <OrderDetailsDialog
        selectedOrder={selectedOrder}
        isOrderDialogOpen={isOrderDialogOpen}
        setIsOrderDialogOpen={setIsOrderDialogOpen}
      />
    </div>
  );
}
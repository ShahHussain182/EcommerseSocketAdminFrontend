import { Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import type { OrderStatus } from '@/types';

export const statusConfig = {
  'Pending': { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-100', variant: 'secondary' as const },
  'Processing': { icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-100', variant: 'default' as const },
  'Shipped': { icon: Truck, color: 'text-purple-500', bgColor: 'bg-purple-100', variant: 'outline' as const },
  'Delivered': { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', variant: 'default' as const },
  'Cancelled': { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100', variant: 'destructive' as const },
};

export const getStatusIcon = (status: OrderStatus) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  return <Icon className={`h-4 w-4 ${config.color}`} />;
};

export const getStatusBadgeVariant = (status: OrderStatus) => {
  return statusConfig[status].variant;
};
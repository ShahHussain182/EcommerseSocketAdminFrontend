
import { BadgeProps } from '@/components/ui/badge';

export type CustomerType = 'Active' | 'Inactive' | 'VIP' | 'New' | 'Potential';

export const getCustomerTypeVariant = (type: CustomerType): BadgeProps['variant'] => {
  switch (type) {
    case 'VIP': return 'default';
    case 'New': return 'secondary';
    case 'Potential': return 'outline';
    case 'Active': return 'default';
    case 'Inactive': return 'destructive';
    default: return 'default';
  }
};

export const getCustomerType = (totalSpent: number, totalOrders: number, lastLogin: string): CustomerType => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const lastLoginDate = new Date(lastLogin);

  if (totalSpent > 2000) return 'VIP';
  if (totalOrders === 0) return 'New';
  // Inactive: has orders, but last login is older than 30 days
  if (totalOrders > 0 && lastLoginDate < thirtyDaysAgo) return 'Inactive';
  if (totalSpent < 100 && totalOrders > 0) return 'Potential';
  return 'Active';
};
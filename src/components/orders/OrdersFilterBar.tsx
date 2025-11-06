import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { getStatusIcon, statusConfig } from '@/lib/orderUtils';

interface OrdersFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: OrderStatus | 'All';
  setStatusFilter: (status: OrderStatus | 'All') => void;
  sortBy: 'date' | 'total';
  setSortBy: (by: 'date' | 'total') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onApplyFilters: () => void; // Callback to trigger refetch in parent
}

export const OrdersFilterBar = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onApplyFilters,
}: OrdersFilterBarProps) => {
  // Internal state for debounced search term, managed by parent now
  // useEffect(() => {
  //   const handler = setTimeout(() => {
  //     onApplyFilters();
  //   }, 500);
  //   return () => clearTimeout(handler);
  // }, [searchTerm, statusFilter, sortBy, sortOrder, onApplyFilters]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-1 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'All')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {Object.keys(statusConfig).map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center">
                  {getStatusIcon(status as OrderStatus)}
                  <span className="ml-2">{status}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'total')}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="total">Total</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
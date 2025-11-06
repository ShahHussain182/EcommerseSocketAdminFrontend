import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, Eye, Mail, Phone, Calendar, Users as UsersIcon, RefreshCw, ChevronLeft, ChevronRight, Loader2, XCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { customerService } from '@/services/customerService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCustomerType, getCustomerTypeVariant } from '@/lib/customerUtils';
import type { User } from '@/types';
import { CustomerDetailsDialog } from '@/components/customers/CustomerDetailsDialog';
import { CustomerForm } from '@/components/customers/CustomerForm';

export function Customers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'VIP' | 'New' | 'Potential' | 'All'>('All');
  const [sortBy, setSortBy] = useState<'userName' | 'email' | 'createdAt' | 'lastLogin' | 'totalOrders' | 'totalSpent'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  // Query for customers from API
  const { data: customersData, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', page, limit, debouncedSearchTerm, statusFilter, sortBy, sortOrder],
    queryFn: () => customerService.getAllCustomers({
      page,
      limit,
      searchTerm: debouncedSearchTerm || undefined,
      statusFilter: statusFilter === 'All' ? undefined : statusFilter,
      sortBy,
      sortOrder,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const customers = customersData?.data || [];
  const totalCustomers = customersData?.totalCustomers || 0;
  const totalPages = Math.ceil(totalCustomers / limit);

  const handleViewDetails = (customer: User) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
  };

  const handleEditCustomer = (customer: User) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleDeleteCustomer = (customer: User) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    try {
      // In a real app, you would call an API to delete the customer
      // For now, we'll just simulate the deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Deleting customer:', customerToDelete._id);
      
      // Refresh the customer list
      refetch();
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    // Refresh the customer list after successful edit
   /*  refetch(); */
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships and insights</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p> {/* Placeholder */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => (c.totalSpent || 0) > 2000).length}
            </div>
            <p className="text-xs text-muted-foreground">High-value customers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / Math.max(1, customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0))).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">+8% from last month</p> {/* Placeholder */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => (c.totalOrders || 0) > 0 && new Date(c.lastLogin).getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground">Users who made orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 flex-wrap gap-y-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => {setStatusFilter(value as typeof statusFilter); setPage(1);}}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Potential">Potential</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              Sort By
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {setSortBy('userName'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1);}}>
              Username {sortBy === 'userName' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {setSortBy('email'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1);}}>
              Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {setSortBy('createdAt'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1);}}>
              Join Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {setSortBy('lastLogin'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1);}}>
              Last Login {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {setSortBy('totalOrders'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1);}}>
              Total Orders {sortBy === 'totalOrders' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {setSortBy('totalSpent'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); setPage(1);}}>
              Total Spent {sortBy === 'totalSpent' && (sortOrder === 'asc' ? '↑' : '↓')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List ({totalCustomers})</CardTitle>
          <CardDescription>
            Complete customer information and purchase history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead><TableHead>Contact</TableHead><TableHead>Orders</TableHead><TableHead>Total Spent</TableHead><TableHead>Type</TableHead><TableHead>Last Login</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading customers...
                      </div>
                    </TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <XCircle className="h-12 w-12 text-destructive mb-2" />
                        <h3 className="text-lg font-semibold">Error loading customers</h3>
                        <p className="text-muted-foreground mb-4">There was an issue fetching the customer data.</p>
                        <Button onClick={() => refetch()}>Try Again</Button>
                      </div>
                    </TableCell></TableRow>
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No customers found</h3>
                        <p className="text-muted-foreground">No customers match your search criteria.</p>
                      </div>
                    </TableCell></TableRow>
                ) : (
                  customers.map((customer) => {
                    const customerType = getCustomerType(customer.totalSpent || 0, customer.totalOrders || 0, customer.lastLogin);
                    
                    return (
                      <TableRow key={customer._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.userName}</div>
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Joined {format(new Date(customer.createdAt), 'MMM yyyy')}
                            </div>
                          </div>
                        </TableCell><TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                              {customer.email}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 mr-2" />
                              {customer.phoneNumber}
                            </div>
                          </div>
                        </TableCell><TableCell>
                          <div>
                            <div className="font-medium">{customer.totalOrders || 0}</div>
                            <div className="text-sm text-muted-foreground">orders</div>
                          </div>
                        </TableCell><TableCell>
                          <div>
                            <div className="font-medium">${(customer.totalSpent || 0).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              ${((customer.totalSpent || 0) / Math.max(customer.totalOrders || 1, 1)).toFixed(0)} avg
                            </div>
                          </div>
                        </TableCell><TableCell>
                          <Badge variant={getCustomerTypeVariant(customerType)}>
                            {customerType}
                          </Badge>
                        </TableCell><TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(customer.lastLogin), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(customer.lastLogin), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell><TableCell className="text-right">
                          <div className="flex items-center space-x-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(customer)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleSendEmail(customer.email)}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
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
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || isLoading}
              >
              Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Details Dialog */}
      <CustomerDetailsDialog
        customer={selectedCustomer}
        isOpen={isDetailsDialogOpen}
        setIsOpen={setIsDetailsDialogOpen}
        onEdit={handleEditCustomer}
      />
      
      {/* Customer Edit Dialog */}
      {selectedCustomer && (
        <CustomerForm
          customer={selectedCustomer}
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              {customerToDelete && ` "${customerToDelete.userName}"`} and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
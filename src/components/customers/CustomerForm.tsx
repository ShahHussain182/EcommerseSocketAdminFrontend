
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { customerService } from '@/services/customerService';
import type { User } from '@/types';
import toast from 'react-hot-toast';

// Zod schema for customer form validation
const customerFormSchema = z.object({
  userName: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer: User;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess: () => void;
}

export const CustomerForm = ({ customer, isOpen, setIsOpen, onSuccess }: CustomerFormProps) => {
  const queryClient = useQueryClient();
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      userName: customer.userName || '',
      email: customer.email || '',
      phoneNumber: customer.phoneNumber || '',
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: (data: CustomerFormValues) => customerService.updateCustomer(customer._id, data),
    onSuccess: (response) => {
      // Show success message
      toast.success(response.message || 'Customer updated successfully!');
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Close the dialog
      setIsOpen(false);
      // Trigger parent component's success handler if needed
      onSuccess();
    },
    onError: (error: any) => {
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to update customer.';
      toast.error(errorMessage);
      console.error('Update customer error:', error);
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    updateCustomerMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update customer information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} disabled={updateCustomerMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} disabled={updateCustomerMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone Number" {...field} disabled={updateCustomerMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateCustomerMutation.isPending}
              >
                {updateCustomerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { User, Mail, Phone, Calendar, DollarSign, ShoppingCart,  XCircle, UserCheck, Edit } from 'lucide-react';
import type { User as CustomerType } from '@/types';
import { getCustomerType, getCustomerTypeVariant } from '@/lib/customerUtils';

interface CustomerDetailsDialogProps {
  customer: CustomerType | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onEdit: (customer: CustomerType) => void;
}

export const CustomerDetailsDialog = ({ customer, isOpen, setIsOpen, onEdit }: CustomerDetailsDialogProps) => {
  if (!customer) return null;

  const totalSpent = customer.totalSpent || 0;
  const totalOrders = customer.totalOrders || 0;
  const customerType = getCustomerType(totalSpent, totalOrders, customer.lastLogin);
  const isVerified = customer.isVerified;

  const handleSendEmail = () => {
    window.location.href = `mailto:${customer.email}`;
  };

  const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: React.ReactNode }) => (
    <div className="flex items-center space-x-3">
      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Customer Profile: {customer.userName}
          </DialogTitle>
          <DialogDescription>
            Detailed information and metrics for this customer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Verification */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Customer Type</p>
                <Badge variant={getCustomerTypeVariant(customerType)} className="text-base py-1">
                  {customerType}
                </Badge>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium">Email Status</p>
                <div className="flex items-center gap-2 justify-end">
                  {isVerified ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-500">
                      <UserCheck className="h-4 w-4 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" /> Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Contact Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem icon={Mail} label="Email" value={customer.email} />
              <DetailItem icon={Phone} label="Phone Number" value={customer.phoneNumber} />
            </CardContent>
          </Card>

          {/* Activity and Metrics */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Activity & Metrics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DetailItem 
                icon={ShoppingCart} 
                label="Total Orders" 
                value={totalOrders} 
              />
              <DetailItem 
                icon={DollarSign} 
                label="Total Spent (LTV)" 
                value={`$${totalSpent.toFixed(2)}`} 
              />
              <DetailItem 
                icon={Calendar} 
                label="Joined Date" 
                value={format(new Date(customer.createdAt), 'MMM dd, yyyy')} 
              />
              <DetailItem 
                icon={Calendar} 
                label="Last Login" 
                value={format(new Date(customer.lastLogin), 'MMM dd, yyyy HH:mm')} 
              />
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onEdit(customer)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handleSendEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button asChild>
              <a href={`/orders?customer=${customer._id}`}>
                View All Orders
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
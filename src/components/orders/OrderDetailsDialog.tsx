import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Order } from '@/types';
import { getStatusIcon, getStatusBadgeVariant } from '@/lib/orderUtils';

interface OrderDetailsDialogProps {
  selectedOrder: Order | null;
  isOrderDialogOpen: boolean;
  setIsOrderDialogOpen: (isOpen: boolean) => void;
}

export const OrderDetailsDialog = ({ selectedOrder, isOrderDialogOpen, setIsOrderDialogOpen }: OrderDetailsDialogProps) => {
  if (!selectedOrder) return null;

  return (
    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - #{selectedOrder.orderNumber}</DialogTitle>
          <DialogDescription>
            Complete order information and items
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(selectedOrder.status)}
              <div>
                <h3 className="font-semibold">Status: {selectedOrder.status}</h3>
                <p className="text-sm text-muted-foreground">
                  Order placed on {format(new Date(selectedOrder.createdAt), 'MMMM dd, yyyy \\at HH:mm')}
                </p>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="text-sm">
              {selectedOrder.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-sm">{selectedOrder.shippingAddress.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Shipping Address</label>
                    <p className="text-sm">
                      {selectedOrder.shippingAddress.addressLine1}<br />
                      {selectedOrder.shippingAddress.addressLine2 && (
                        <>{selectedOrder.shippingAddress.addressLine2}<br /></>
                      )}
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}<br />
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <p className="text-sm">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Items:</span>
                    <span className="text-sm font-medium">{selectedOrder.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Quantity:</span>
                    <span className="text-sm font-medium">
                      {selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOrder.items.map((item, index) => (
                  <div key={item._id || index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img
                      src={item.imageAtTime}
                      alt={item.nameAtTime}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.nameAtTime}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.sizeAtTime} • {item.colorAtTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${item.priceAtTime.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.quantity * item.priceAtTime).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
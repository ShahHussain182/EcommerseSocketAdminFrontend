import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TopProductData } from '@/types';
import { DollarSign, ShoppingCart } from 'lucide-react';

interface TopSellingProductsProps {
  data: TopProductData[];
  isLoading: boolean;
}

const TopSellingProducts = ({ data, isLoading }: TopSellingProductsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <CardDescription>Products generating the most revenue</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No top selling products found.</p>
        ) : (
          <div className="space-y-4">
            {data.map((product) => (
              <div key={product._id} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm font-medium">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    ${product.totalRevenue.toFixed(2)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {product.totalSales} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSellingProducts;
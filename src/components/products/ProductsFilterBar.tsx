import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import type { Category, ProductsFilterState } from '../../types';

interface ProductsFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: NonNullable<ProductsFilterState['sortBy']>;
  setSortBy: (sortBy: NonNullable<ProductsFilterState['sortBy']>) => void;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: Error | null;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const ProductsFilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  categories,
  categoriesLoading,
  categoriesError,
  setPage,
}: ProductsFilterBarProps) => {
  const handleSortChange = (value: NonNullable<ProductsFilterState['sortBy']>) => {
    setSortBy(value);
    setPage(1);
  };

  return (
    <div className="flex items-center space-x-4 flex-wrap gap-y-2">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />
      </div>

      <div className="flex items-center space-x-2 flex-wrap">
        <Button
          variant={selectedCategory === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedCategory('');
            setPage(1);
          }}
        >
          All
        </Button>
        {categoriesLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : categoriesError ? (
          <span className="text-destructive text-sm">Error loading categories</span>
        ) : (
          categories?.map((category) => (
            <Button
              key={category._id}
              variant={selectedCategory === category.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(category.name);
                setPage(1);
              }}
            >
              {category.name}
            </Button>
          ))
        )}
      </div>

      <Select value={sortBy} onValueChange={(value: NonNullable<ProductsFilterState['sortBy']>) => handleSortChange(value)}>

        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
          <SelectItem value="price-asc">Price (Low to High)</SelectItem>
          <SelectItem value="price-desc">Price (High to Low)</SelectItem>
          <SelectItem value="averageRating-desc">Top Rated</SelectItem>
          <SelectItem value="numberOfReviews-desc">Most Reviewed</SelectItem>
          <SelectItem value="createdAt-desc">Newest

          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
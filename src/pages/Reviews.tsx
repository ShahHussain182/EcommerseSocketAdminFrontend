import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Search, Filter, Edit, Trash2, Eye, Star, Loader2, ChevronLeft, ChevronRight, MoreHorizontal, UserCircle,  MessageSquareText } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService, type UpdateReviewData } from '@/services/reviewService';
import type { Review } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateReviewSchema } from '@/schemas/reviewSchema';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@radix-ui/react-dropdown-menu';

// Type for the form data, based on updateReviewSchema
type ReviewFormValues = z.infer<typeof updateReviewSchema>;

interface ReviewFormProps {
  review?: Review;
  onSubmit: (data: ReviewFormValues) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const ReviewForm = ({ review, onSubmit, onClose, isSubmitting }: ReviewFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(updateReviewSchema),
    defaultValues: {
      rating: review?.rating || 0,
      title: review?.title || '',
      comment: review?.comment || '',
    },
  });

  const currentRating = watch('rating');
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    if (review) {
      reset({
        rating: review.rating,
        title: review.title,
        comment: review.comment,
      });
    } else {
      reset({
        rating: 0,
        title: '',
        comment: '',
      });
    }
  }, [review, reset]);

  const handleRatingClick = (ratingValue: number) => {
    setValue('rating', ratingValue, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((starValue) => (
            <Star
              key={starValue}
              className={cn(
                "h-7 w-7 cursor-pointer transition-colors",
                (hoveredRating >= starValue || (currentRating ?? 0) >= starValue)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              )}
              onMouseEnter={() => setHoveredRating(starValue)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRatingClick(starValue)}
            />
          ))}
        </div>
        {errors.rating && <p className="text-sm text-destructive">{errors.rating.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register('title')}
          disabled={isSubmitting}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          {...register('comment')}
          rows={4}
          disabled={isSubmitting}
        />
        {errors.comment && <p className="text-sm text-destructive">{errors.comment.message}</p>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Review
        </Button>
      </DialogFooter>
    </form>
  );
};

export function Reviews() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

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

  // Query for reviews from API
  const { data: reviewsData, isLoading, error } = useQuery({
    queryKey: ['reviews', { searchTerm: debouncedSearchTerm, rating: ratingFilter, page, limit }],
    queryFn: () => reviewService.getAllReviews({
      page,
      limit,
      searchTerm: debouncedSearchTerm || undefined,
      rating: ratingFilter || undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.totalReviews || 0;
  const totalPages = Math.ceil(totalReviews / limit);

  // Mutations for CRUD operations
  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: string; data: UpdateReviewData }) => reviewService.updateReview(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review updated successfully');
      setIsEditDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update review');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: reviewService.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">Manage customer product reviews</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 flex-wrap gap-y-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by product name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              variant={ratingFilter === rating ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setRatingFilter(ratingFilter === rating ? '' : rating);
                setPage(1);
              }}
            >
              {rating} <Star className="ml-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
            </Button>
          ))}
          <Button
            variant={ratingFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRatingFilter('')}
          >
            All Ratings
          </Button>
        </div>
        
        <Button variant="outline" className="ml-auto">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({totalReviews})</CardTitle>
          <CardDescription>
            View, edit, and delete customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Product</TableHead><TableHead className="min-w-[120px]">Customer</TableHead><TableHead className="min-w-[80px]">Rating</TableHead><TableHead className="min-w-[250px]">Review</TableHead><TableHead className="min-w-[100px]">Date</TableHead><TableHead className="min-w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6}>
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                          <h3 className="mt-4 text-lg font-semibold">Loading reviews...</h3>
                        </div>
                      </div>
                    </TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={6}>
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <MessageSquareText className="mx-auto h-12 w-12 text-destructive" />
                          <h3 className="mt-4 text-lg font-semibold">Error loading reviews</h3>
                          <p className="text-muted-foreground mb-4">There was an issue fetching the reviews.</p>
                          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['reviews'] })}>Try Again</Button>
                        </div>
                      </div>
                    </TableCell></TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No reviews found</h3>
                          <p className="text-muted-foreground">No reviews match your search or filter criteria.</p>
                        </div>
                      </div>
                    </TableCell></TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <img
                            src={review.productId.imageUrls[0]}
                            alt={review.productId.name}
                            className="h-8 w-8 rounded-md object-cover" 
                          />
                          <div className="font-medium">{review.productId.name}</div>
                        </div>
                      </TableCell><TableCell>
                        <div className="flex items-center space-x-2">
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{review.userId.userName}</span>
                        </div>
                      </TableCell><TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{review.rating}</span>
                        </div>
                      </TableCell><TableCell>
                        <div className="max-w-[250px] truncate">
                          {review.title && <p className="font-medium">{review.title}</p>}
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      </TableCell><TableCell>
                        <div className="font-medium">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(review.createdAt), 'HH:mm')}</div>
                      </TableCell><TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedReview(review);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedReview(review);
                                setIsEditDialogOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent dropdown from closing */}
                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this review.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteReviewMutation.mutate(review._id)} disabled={deleteReviewMutation.isPending}>
                                      {deleteReviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
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
        )}
      </Card>

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Update the rating, title, or comment of this review.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            review={selectedReview || undefined}
            onSubmit={(data) => {
              if (selectedReview) {
                updateReviewMutation.mutate({ reviewId: selectedReview._id, data });
              }
            }}
            onClose={() => setIsEditDialogOpen(false)}
            isSubmitting={updateReviewMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* View Review Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>Full details of the selected review.</DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedReview.productId.imageUrls[0]}
                  alt={selectedReview.productId.name}
                  className="h-12 w-12 rounded-md object-cover" 
                />
                <div>
                  <p className="font-semibold">{selectedReview.productId.name}</p>
                  <p className="text-sm text-muted-foreground">by {selectedReview.userId.userName}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium">Rating</Label>
                <div className="flex items-center space-x-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < selectedReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
              {selectedReview.title && (
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm mt-1">{selectedReview.title}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Comment</Label>
                <p className="text-sm mt-1">{selectedReview.comment}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reviewed On</Label>
                  <p className="text-sm mt-1">{format(new Date(selectedReview.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm mt-1">{format(new Date(selectedReview.updatedAt), 'MMMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
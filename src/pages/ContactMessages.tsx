import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Eye, Trash2, Loader2, ChevronLeft, ChevronRight, RefreshCw, MessageSquareText, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { contactService } from '@/services/contactService';
import type { ContactMessage } from '@/types';
import { MessageDetailsDialog } from '@/components/contact/MessageDetailsDialog';
import { useDebounce } from 'use-debounce';

export function ContactMessages() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Query for messages from API
  const { data: messagesData, isLoading, error, refetch } = useQuery({
    queryKey: ['contactMessages', page, limit, debouncedSearchTerm],
    queryFn: () => contactService.getAllMessages({
      page,
      limit,
      searchTerm: debouncedSearchTerm || undefined,
    }),
    staleTime: 60 * 1000, // 1 minute
  });

  const messages = messagesData?.messages || [];
  const totalMessages = messagesData?.totalMessages || 0;
  const totalPages = Math.ceil(totalMessages / limit);

  // Mutation for deleting a message
  const deleteMessageMutation = useMutation({
    mutationFn: contactService.deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactMessages'] });
      toast.success('Message deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    },
  });

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDetailsDialogOpen(true);
  };

  const handleDeleteMessage = (id: string) => {
    deleteMessageMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
          <p className="text-muted-foreground">Review and manage inquiries submitted through the contact form.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 flex-wrap gap-y-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or subject..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inbox ({totalMessages})</CardTitle>
          <CardDescription>
            All incoming messages, sorted by newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Sender</TableHead>
                  <TableHead className="min-w-[250px]">Subject</TableHead>
                  <TableHead className="min-w-[350px]">Message Snippet</TableHead>
                  <TableHead className="min-w-[150px]">Received</TableHead>
                  <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading messages...
                      </div>
                    </TableCell></TableRow>
                ) : error ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <XCircle className="h-12 w-12 text-destructive mb-2" />
                        <h3 className="mt-4 text-lg font-semibold">Error loading messages</h3>
                        <p className="text-muted-foreground mb-4">There was an issue fetching the messages.</p>
                        <Button onClick={() => refetch()}>Try Again</Button>
                      </div>
                    </TableCell></TableRow>
                ) : messages.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No messages found</h3>
                        <p className="text-muted-foreground">No contact messages match your search criteria.</p>
                      </div>
                    </TableCell></TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message._id} className="hover:bg-accent/50 cursor-pointer" onClick={() => handleViewDetails(message)}>
                      <TableCell className="font-medium">
                        <div className="font-semibold">{message.name}</div>
                        <div className="text-sm text-muted-foreground">{message.email}</div>
                      </TableCell>
                      <TableCell className="font-medium">{message.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {message.message}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{format(new Date(message.createdAt), 'MMM dd, yyyy')}</div>
                        <div className="text-sm text-muted-foreground">{format(new Date(message.createdAt), 'HH:mm')}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleViewDetails(message); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} disabled={deleteMessageMutation.isPending}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the message from "{message.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteMessage(message._id)} disabled={deleteMessageMutation.isPending}>
                                  {deleteMessageMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Message Details Dialog */}
      <MessageDetailsDialog
        message={selectedMessage}
        isOpen={isDetailsDialogOpen}
        setIsOpen={setIsDetailsDialogOpen}
      />
    </div>
  );
}
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Mail, User, MessageSquareText, Clock, MapPin } from 'lucide-react';
import type { ContactMessage } from '@/types';
import { Separator } from '@/components/ui/separator';

interface MessageDetailsDialogProps {
  message: ContactMessage | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const MessageDetailsDialog = ({ message, isOpen, setIsOpen }: MessageDetailsDialogProps) => {
  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="h-6 w-6 text-primary" />
            Contact Message Details
          </DialogTitle>
          <DialogDescription>
            Full content and metadata for the message from {message.name}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Subject</p>
              <p className="text-lg font-bold">{message.subject}</p>
            </div>
          </Card>

          {/* Sender Details */}
          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sender Name</p>
                  <p className="font-semibold">{message.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sender Email</p>
                  <p className="font-semibold">{message.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Received At</p>
                  <p className="font-semibold">{format(new Date(message.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <p className="font-semibold">{message.ip || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Message Content</p>
              <Separator />
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md whitespace-pre-wrap text-sm">
                {message.message}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
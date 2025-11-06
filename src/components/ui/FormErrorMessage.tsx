
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorMessageProps {
  message?: string;
  className?: string;
}

export const FormErrorMessage = ({ message, className }: FormErrorMessageProps) => {
  if (!message) return null;

  return (
    <div
      className={cn(
        "mt-1 flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 p-2 text-xs text-destructive",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
};
import { Toaster as Sonner } from "sonner";

/**
 * Toast notification system using Sonner
 * 
 * Usage:
 * import { toast } from 'sonner'
 * 
 * toast.success('Success message')
 * toast.error('Error message', { description: 'Additional details' })
 */
export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          error: "bg-destructive text-destructive-foreground border-destructive",
          success: "bg-green-600 text-white border-green-600",
          warning: "bg-yellow-600 text-white border-yellow-600",
          info: "bg-blue-600 text-white border-blue-600",
        },
      }}
    />
  );
}

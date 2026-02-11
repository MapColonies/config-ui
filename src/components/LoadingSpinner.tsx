import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-muted-foreground`}
      />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

import { useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { AppError } from "@/lib/errors/types";

interface ErrorCardProps {
  error: AppError | Error | string;
  variant?: "error" | "warning" | "info";
  compact?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorCard - Reusable error display component
 * 
 * Features:
 * - User-friendly title and message
 * - Category badge (client/server/network)
 * - Collapsible technical details
 * - Action buttons for recovery
 */
export function ErrorCard({
  error,
  variant = "error",
  compact = false,
  className,
}: ErrorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalize error to AppError format
  const appError = normalizeError(error);

  const alertVariant = variant === "error" ? "destructive" : "default";

  return (
    <Alert variant={alertVariant} className={cn(compact && "p-3", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className={cn(compact && "text-sm")}>{appError.title}</AlertTitle>
      <AlertDescription className={cn("mt-2", compact && "text-xs")}>
        {/* User-friendly message */}
        <p className="mb-3">{appError.message}</p>

        {/* Category badge */}
        <Badge variant="outline" className="mb-3">
          {appError.category}
        </Badge>

        {/* Collapsible technical details */}
        {appError.technical && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn("p-0 h-auto font-normal", compact && "text-xs")}
              >
                {isExpanded ? "Hide" : "Show"} technical details
                <ChevronDown
                  className={cn(
                    "ml-1 h-4 w-4 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div
                className={cn(
                  "text-xs space-y-1 font-mono bg-muted p-3 rounded",
                  compact && "text-[10px] p-2"
                )}
              >
                {appError.technical.statusCode !== undefined && (
                  <div>Status: {appError.technical.statusCode}</div>
                )}
                {appError.technical.method && appError.technical.endpoint && (
                  <div>
                    {appError.technical.method} {appError.technical.endpoint}
                  </div>
                )}
                {appError.technical.timestamp && (
                  <div>Time: {appError.technical.timestamp.toLocaleString()}</div>
                )}
                {appError.technical.apiMessage && (
                  <div className="mt-2 pt-2 border-t">
                    API: {appError.technical.apiMessage}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action buttons */}
        {appError.actions && appError.actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {appError.actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "secondary"}
                size={compact ? "sm" : "default"}
                onClick={action.handler}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Normalize any error type to AppError
 */
function normalizeError(error: AppError | Error | string): AppError {
  // Already an AppError
  if (typeof error === "object" && error !== null && "category" in error) {
    return error as AppError;
  }

  // String error
  if (typeof error === "string") {
    return {
      title: "Error",
      message: error,
      category: "unknown",
      technical: { timestamp: new Date() },
    };
  }

  // Error instance
  if (error instanceof Error) {
    return {
      title: "Error",
      message: error.message,
      category: "unknown",
      technical: {
        timestamp: new Date(),
        apiMessage: error.message,
      },
    };
  }

  // Fallback
  return {
    title: "Error",
    message: "An unknown error occurred",
    category: "unknown",
    technical: { timestamp: new Date() },
  };
}

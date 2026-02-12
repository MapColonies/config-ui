import { Component } from "react";
import type { ReactNode } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import type { AppError } from "@/lib/errors/api-errors";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const appError: AppError = {
        title: "Something Went Wrong",
        message: this.state.error?.message || "An unexpected error occurred in the application",
        category: "unknown",
        technical: {
          timestamp: new Date(),
          apiMessage: this.state.error?.stack,
        },
        actions: [
          {
            label: "Reload Page",
            handler: () => window.location.reload(),
            variant: "default",
          },
        ],
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <ErrorCard error={appError} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

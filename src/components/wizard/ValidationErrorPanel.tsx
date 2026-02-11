import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { editor } from "monaco-editor";

interface ValidationErrorPanelProps {
  errors: editor.IMarker[];
  onErrorClick: (lineNumber: number) => void;
  isValidating?: boolean;
}

/**
 * ValidationErrorPanel - Displays schema validation errors from Monaco editor
 *
 * Shows a success state when no errors, or a list of errors with click-to-jump functionality
 * Designed to work in a side-by-side layout with the editor
 */
export function ValidationErrorPanel({
  errors,
  onErrorClick,
  isValidating = false,
}: ValidationErrorPanelProps) {
  if (isValidating) {
    return (
      <div className="h-full border rounded-lg overflow-hidden flex items-start p-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg w-full">
          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 animate-spin" />
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Validating references...
          </span>
        </div>
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <div className="h-full border rounded-lg overflow-hidden flex items-start p-4">
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg w-full">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-300 font-medium">
            Valid JSON - No schema errors
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border rounded-lg dark:border-gray-700 flex flex-col overflow-hidden">
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex-shrink-0">
        <span className="text-sm font-medium text-destructive">
          {errors.length} validation {errors.length === 1 ? "error" : "errors"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {errors.map((error, idx) => (
          <button
            key={idx}
            onClick={() => onErrorClick(error.startLineNumber)}
            className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-b-0 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            type="button"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-destructive font-medium">
                  Line {error.startLineNumber}:{error.startColumn}
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  {error.message}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useWizardStore } from "@/stores/wizardStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiffEditor, Editor } from "@monaco-editor/react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { ErrorCard } from "@/components/ErrorCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AppError } from "@/lib/errors/api-errors";
import type { WizardMode } from "@/stores/wizardStore";

type ReviewSubmitProps = {
  error: AppError | null;
  success: boolean;
  isSubmitting?: boolean;
  hasVersionConflict?: boolean;
  onRefreshVersion?: () => void;
  currentVersion?: number | null;
  mode?: WizardMode;
};

/**
 * ReviewSubmit - Step 4 of wizard
 * Shows final review with diff for EDIT/ROLLBACK modes
 * Submit logic handled by WizardShell
 */
export function ReviewSubmit({
  error,
  success,
  isSubmitting: _isSubmitting,
  hasVersionConflict = false,
  onRefreshVersion,
  currentVersion,
  mode: propsMode,
}: ReviewSubmitProps) {
  const {
    mode,
    configName,
    schemaId,
    jsonContent,
    originalJsonContent,
    rollbackFromVersion,
  } = useWizardStore();

  const showDiff = mode !== "create" && originalJsonContent;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-600" />
        <h2 className="text-2xl font-semibold">Config Created Successfully!</h2>
        <p className="text-muted-foreground">
          Redirecting to config inspector...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Configuration Details - Horizontal */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuration Details</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Config Name:</span>
              <code className="ml-2 bg-muted px-2 py-0.5 rounded">
                {configName}
              </code>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Mode:</span>
              <span className="ml-2 capitalize">{mode}</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-muted-foreground">Schema ID:</span>
              <code className="ml-2 bg-muted px-2 py-0.5 rounded text-xs break-all">
                {schemaId}
              </code>
            </div>
            {mode === "rollback" && rollbackFromVersion && (
              <div>
                <span className="font-medium text-muted-foreground">Rolling back to:</span>
                <code className="ml-2 bg-muted px-2 py-0.5 rounded">
                  Version {rollbackFromVersion}
                </code>
              </div>
            )}
            {propsMode !== "create" && currentVersion && (
              <div>
                <span className="font-medium text-muted-foreground">Will create version:</span>
                <code className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-0.5 rounded font-semibold">
                  {currentVersion + 1}
                </code>
                <span className="text-xs text-muted-foreground ml-2">
                  (based on v{currentVersion})
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display - Special handling for version conflicts */}
      {error && !hasVersionConflict && <ErrorCard error={error} compact />}

      {/* Version Conflict - Prominent actionable UI */}
      {hasVersionConflict && error && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-lg font-semibold text-orange-900 dark:text-orange-100">
            {error.title}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-4">
              {/* Clear explanation */}
              <p className="text-orange-800 dark:text-orange-200">
                {error.message}
              </p>

              {/* What happens box */}
              <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-md border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-semibold mb-2 text-orange-900 dark:text-orange-100">
                  What happens when you refresh:
                </p>
                <ul className="text-sm space-y-1.5 text-orange-800 dark:text-orange-200">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>Your editor content is <strong>preserved</strong> (no changes lost)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>The version number updates to the latest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span>Submitting will create the next version successfully</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={onRefreshVersion}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Version Number
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  size="sm"
                >
                  Cancel & Go Back
                </Button>
              </div>

              {/* Technical details if available */}
              {error.technical?.apiMessage && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-orange-700 dark:text-orange-300 hover:underline">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/50 rounded text-orange-900 dark:text-orange-100 overflow-auto">
                    {error.technical.apiMessage}
                  </pre>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Editor - Takes remaining space */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-semibold mb-2 flex-shrink-0">
          {showDiff ? "Changes Preview" : "Configuration Content"}
        </h3>
        <div className="flex-1 border rounded-lg overflow-hidden">
          {showDiff ? (
            <DiffEditor
              height="100%"
              language="json"
              original={originalJsonContent}
              modified={jsonContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                renderSideBySide: true,
              }}
            />
          ) : (
            <Editor
              height="100%"
              language="json"
              value={jsonContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: true },
                lineNumbers: "on",
                folding: true,
                scrollBeyondLastLine: false,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

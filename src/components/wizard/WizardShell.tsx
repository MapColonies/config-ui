import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWizardStore, type WizardStep } from "@/stores/wizardStore";
import { SelectSchema } from "./SelectSchema";
import { DefineIdentity } from "./DefineIdentity";
import { AuthorContent } from "./AuthorContent";
import { ReviewSubmit } from "./ReviewSubmit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, ArrowRight, Lock, Loader2 } from "lucide-react";
import { $api, api, type ConfigCreateRequest } from "@/lib/api";
import { Route } from "@/routes/wizard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorCard } from "@/components/ErrorCard";
import {
  parseTanStackQueryError,
  type AppError,
} from "@/lib/errors/api-errors";
import { toast } from "sonner";

/**
 * Wizard shell that manages multi-step config creation/editing flow
 */
export function WizardShell() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<AppError | null>(null);

  const {
    mode,
    currentStep,
    stepValidation,
    nextStep,
    prevStep,
    setCurrentStep,
    reset,
    initializeForEdit,
    initializeForRollback,
    configName,
    schemaId,
    jsonContent,
  } = useWizardStore();

  // Submit logic lifted from ReviewSubmit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<AppError | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [latestVersion, setLatestVersion] = useState<number | null>(null);
  const [hasVersionConflict, setHasVersionConflict] = useState(false);
  const mutation = $api.useMutation("post", "/config");

  const handleSubmit = async () => {
    if (!configName || !schemaId) {
      setSubmitError({
        title: "Validation Error",
        message: "Missing required fields",
        category: "client",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Track version for error messages
    let versionForSubmit = 1;

    try {
      const config = JSON.parse(jsonContent);

      // For create mode, version starts at 1
      // For edit/rollback, we send the CURRENT latest version
      // The server validates we have the latest and creates the next version
      if (mode !== "create") {
        // Use refreshed version if available (from conflict resolution)
        if (latestVersion !== null) {
          versionForSubmit = latestVersion;
        } else {
          // Fetch latest version using the /config/{name}/latest endpoint
          const { data: latestConfig, error: versionError } = await api.GET(
            "/config/{name}/{version}",
            {
              params: {
                path: {
                  name: configName,
                  version: "latest",
                },
                query: {
                  schemaId,
                },
              },
            },
          );

          if (versionError) {
            setSubmitError({
              title: "Failed to Fetch Latest Version",
              message: `Could not retrieve the current version of "${configName}". ${versionError.message || "The config may not exist."}`,
              category: "server",
              technical: {
                timestamp: new Date(),
                apiMessage: versionError.message,
              },
            });
            setIsSubmitting(false);
            return;
          }

          if (latestConfig) {
            versionForSubmit = latestConfig.version;
          }
        }
      }

      // Create request body without readonly fields (createdAt, createdBy, isLatest)
      // These are server-generated and marked as readOnly in the OpenAPI spec
      const requestBody: ConfigCreateRequest = {
        configName,
        schemaId,
        config,
        version: versionForSubmit,
      };

      await mutation.mutateAsync({
        body: requestBody as never,
      });

      setSubmitSuccess(true);
      toast.success("Configuration created successfully");

      // Navigate to the new config's inspector after short delay
      setTimeout(() => {
        reset();
        navigate({
          to: "/config/$name/$version",
          params: {
            name: configName,
            version: (versionForSubmit + 1).toString(),
          },
          search: {
            schemaId,
          },
        });
      }, 1500);
    } catch (err) {
      // Parse different error types with context-aware messages
      let parsedError: AppError;

      // Check if it's a mutation error with response
      if (err && typeof err === "object" && "response" in err) {
        const errorObj = err as { response?: Response; message?: string };
        const status = errorObj.response?.status;

        if (status === 409) {
          // Version conflict - special handling
          parsedError = {
            title: "Version Conflict",
            message:
              mode === "create"
                ? `A configuration named "${configName}" already exists. Choose a different name or use Edit mode.`
                : `The configuration "${configName}" was updated by another user while you were editing. The version you're trying to update (v${versionForSubmit}) is no longer the latest.`,
            category: "client",
            technical: {
              statusCode: 409,
              timestamp: new Date(),
              apiMessage: errorObj.message,
            },
          };
          setHasVersionConflict(true);
        } else if (status === 422) {
          // Validation error
          parsedError = {
            title: "Validation Failed",
            message:
              errorObj.message ||
              "The configuration data does not match the schema requirements. Check your JSON content and try again.",
            category: "client",
            technical: {
              statusCode: 422,
              timestamp: new Date(),
              apiMessage: errorObj.message,
            },
          };
        } else if (status === 400) {
          // Bad request
          parsedError = {
            title: "Invalid Request",
            message:
              errorObj.message ||
              "The server rejected the configuration. This may be a malformed request.",
            category: "client",
            technical: {
              statusCode: 400,
              timestamp: new Date(),
              apiMessage: errorObj.message,
            },
          };
        } else {
          // Generic HTTP error
          parsedError = parseTanStackQueryError(err);
        }
      } else if (err instanceof SyntaxError) {
        // JSON parse error
        parsedError = {
          title: "Invalid JSON",
          message: `Your configuration contains invalid JSON syntax: ${err.message}. Please check the editor for errors.`,
          category: "client",
          technical: {
            timestamp: new Date(),
            apiMessage: err.message,
          },
        };
      } else if (err instanceof Error) {
        // Generic Error object
        parsedError = {
          title: "Submission Failed",
          message:
            err.message ||
            "An unexpected error occurred while submitting the configuration.",
          category: "unknown",
          technical: {
            timestamp: new Date(),
            apiMessage: err.message,
          },
        };
      } else {
        // Unknown error type
        parsedError = {
          title: "Submission Failed",
          message: "An unexpected error occurred. Please try again.",
          category: "unknown",
          technical: {
            timestamp: new Date(),
            apiMessage: String(err),
          },
        };
      }

      setSubmitError(parsedError);
      setIsSubmitting(false);

      // Show toast for immediate feedback
      toast.error(parsedError.title, { description: parsedError.message });
    }
  };

  const handleRefreshVersion = async () => {
    if (!configName || !schemaId) return;

    setHasVersionConflict(false);
    setSubmitError(null);

    try {
      const { data, error } = await api.GET("/config/{name}/{version}", {
        params: {
          path: { name: configName, version: "latest" },
          query: { schemaId },
        },
      });

      if (error) {
        toast.error("Refresh Failed", {
          description: `Could not fetch latest version: ${error.message}`,
        });
        return;
      }

      if (data) {
        setLatestVersion(data.version);
        toast.success("Version Refreshed", {
          description: `Now targeting version ${data.version}. Your editor content is preserved. You can submit again.`,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh version";
      toast.error("Refresh Failed", { description: errorMessage });
    }
  };

  // Initialize wizard state from URL params and fetch data from API
  useEffect(() => {
    const initializeWizard = async () => {
      setIsInitializing(true);
      setInitError(null);

      try {
        const {
          mode: urlMode,
          configName: urlConfigName,
          schemaId: urlSchemaId,
          targetVersion,
        } = searchParams;

        if (urlMode === "create" || !urlMode) {
          // Create mode - start fresh
          reset();
          setIsInitializing(false);
          return;
        }

        if (urlMode === "edit") {
          // Edit mode - fetch latest version
          if (!urlConfigName || !urlSchemaId) {
            throw new Error("Missing configName or schemaId for edit mode");
          }

          const { data, error } = await api.GET("/config/{name}/{version}", {
            params: {
              path: {
                name: urlConfigName,
                version: "latest",
              },
              query: {
                schemaId: urlSchemaId,
              },
            },
          });

          if (error) {
            setInitError(error);
            setIsInitializing(false);
            return;
          }

          if (!data) {
            setInitError({
              title: "No Data",
              message: "Failed to fetch config - no data returned",
              category: "client",
            });
            setIsInitializing(false);
            return;
          }

          const content = JSON.stringify(data.config, null, 2);

          initializeForEdit(urlConfigName, urlSchemaId, content);
          setIsInitializing(false);
          return;
        }

        if (urlMode === "rollback") {
          // Rollback mode - fetch both target version and latest version
          if (!urlConfigName || !urlSchemaId || targetVersion === undefined) {
            throw new Error("Missing required params for rollback mode");
          }

          // Fetch the target version (version to roll back TO)
          const { data: targetData, error: targetError } = await api.GET(
            "/config/{name}/{version}",
            {
              params: {
                path: {
                  name: urlConfigName,
                  version: targetVersion,
                },
                query: {
                  schemaId: urlSchemaId,
                },
              },
            },
          );

          if (targetError) {
            setInitError(targetError);
            setIsInitializing(false);
            return;
          }

          if (!targetData) {
            setInitError({
              title: "No Data",
              message: "Failed to fetch target version - no data returned",
              category: "client",
            });
            setIsInitializing(false);
            return;
          }

          const targetContent = JSON.stringify(targetData.config, null, 2);

          // Fetch the latest version (for diff comparison)
          const { data: latestData } = await api.GET(
            "/config/{name}/{version}",
            {
              params: {
                path: {
                  name: urlConfigName,
                  version: "latest",
                },
                query: {
                  schemaId: urlSchemaId,
                },
              },
            },
          );

          let latestContent = targetContent;
          if (latestData) {
            latestContent = JSON.stringify(latestData.config, null, 2);
          }

          initializeForRollback(
            urlConfigName,
            urlSchemaId,
            targetContent,
            targetVersion,
          );

          // Set the latest content for diff comparison
          const { setOriginalJsonContent } = useWizardStore.getState();
          setOriginalJsonContent(latestContent);

          setIsInitializing(false);
          return;
        }

        // Unknown mode
        reset();
        setIsInitializing(false);
      } catch (err) {
        console.error("Failed to initialize wizard:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load wizard data";
        setInitError({
          title: "Initialization Failed",
          message: errorMessage,
          category: "client",
        });
        setIsInitializing(false);
      }
    };

    initializeWizard();
  }, [searchParams, reset, initializeForEdit, initializeForRollback]);

  const handleExit = () => {
    reset();
    navigate({ to: "/" });
  };

  const steps = [
    { number: 1, title: "Select Schema" },
    { number: 2, title: "Define Identity" },
    { number: 3, title: "Author Content" },
    { number: 4, title: "Review & Submit" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <SelectSchema />;
      case 2:
        return <DefineIdentity />;
      case 3:
        return <AuthorContent />;
      case 4:
        return (
          <ReviewSubmit
            error={submitError}
            success={submitSuccess}
            isSubmitting={isSubmitting}
            hasVersionConflict={hasVersionConflict}
            onRefreshVersion={handleRefreshVersion}
            currentVersion={latestVersion}
            mode={mode}
          />
        );
      default:
        return null;
    }
  };

  const canGoBack = mode === "create" ? currentStep > 1 : currentStep > 3;
  const showStepIndicator = mode === "create" || currentStep >= 3;

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <ErrorCard error={initError} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 max-w-[1600px] flex-1 flex flex-col pt-4 pb-4 min-h-0">
        {/* Header section */}
        <div className="mb-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="min-w-0 flex-shrink">
              <h1 className="text-2xl font-bold">
                {mode === "create"
                  ? "Create Config"
                  : mode === "edit"
                    ? "Edit Config"
                    : "Rollback Config"}
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {mode === "create"
                  ? "Create a new configuration"
                  : mode === "edit"
                    ? "Create a new version from the latest"
                    : "Rollback to a previous version"}
              </p>
            </div>

            {/* Config summary - shown when config details are available */}
            {(configName || schemaId) && (
              <>
                <div className="h-12 w-px bg-border flex-shrink-0" />
                <div className="flex items-center gap-3 text-sm min-w-0">
                  {configName && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      {mode !== "create" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Cannot be changed when{" "}
                                {mode === "edit" ? "editing" : "rolling back"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <span className="text-muted-foreground flex-shrink-0">
                        Config:
                      </span>
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono truncate"
                        title={configName}
                      >
                        {configName}
                      </code>
                    </div>
                  )}
                  {schemaId && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      {mode !== "create" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Cannot be changed when{" "}
                                {mode === "edit" ? "editing" : "rolling back"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <span className="text-muted-foreground flex-shrink-0">
                        Schema:
                      </span>
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono truncate"
                        title={schemaId}
                      >
                        {schemaId}
                      </code>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleExit}
            className="flex-shrink-0"
          >
            Cancel
          </Button>
        </div>

        {showStepIndicator && (
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-center justify-center gap-2">
              {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const isSkipped = mode !== "create" && step.number < 3;
                const canNavigate = isCompleted && !isSkipped;

                return (
                  <div key={step.number} className="flex items-center">
                    <button
                      onClick={() =>
                        canNavigate && setCurrentStep(step.number as WizardStep)
                      }
                      disabled={!canNavigate}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                            : isSkipped
                              ? "bg-muted text-muted-foreground line-through"
                              : "bg-muted text-muted-foreground"
                      } ${!canNavigate && !isActive ? "cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                          isActive
                            ? "border-primary-foreground"
                            : isCompleted
                              ? "border-primary"
                              : "border-muted-foreground"
                        }`}
                      >
                        {isSkipped ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-sm font-semibold">
                            {step.number}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{step.title}</span>
                    </button>
                    {index < steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Card with step content - takes remaining space */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden mb-3">
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle className="text-lg">
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto min-h-0 pt-0">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation footer - fixed height */}
        <div className="flex justify-between flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={!canGoBack}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                </div>
              </TooltipTrigger>
              {!canGoBack && mode !== "create" && currentStep === 3 && (
                <TooltipContent>
                  <p>
                    Schema and config name cannot be modified when{" "}
                    {mode === "edit"
                      ? "creating a new version"
                      : "rolling back"}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {currentStep === 4 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {mode === "create" ? "Create Config" : "Create New Version"}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !stepValidation.step1Valid) ||
                (currentStep === 2 && !stepValidation.step2Valid) ||
                (currentStep === 3 && !stepValidation.step3Valid)
              }
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

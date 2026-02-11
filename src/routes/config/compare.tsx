import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import * as v from "valibot";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DiffEditor } from "@monaco-editor/react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useConfigFull } from "@/lib/configCache";
import { ErrorCard } from "@/components/ErrorCard";
import { parseTanStackQueryError } from "@/lib/errors/api-errors";

type ViewMode = "raw" | "resolved" | "defaults";

const compareSearchSchema = v.object({
  source: v.optional(v.fallback(v.string(), ""), ""),
  target: v.optional(v.fallback(v.string(), ""), ""),
});

export const Route = createFileRoute("/config/compare")({
  component: ConfigCompare,
  validateSearch: compareSearchSchema,
});

function parseConfigPath(path: string) {
  // The path format is: {schemaId}/{configName}/{version}
  // where schemaId is a full URL like https://mapcolonies.com/common/db/partial/v1
  // So we need to split from the RIGHT side to get the last two parts (configName and version)
  // Everything before that is the schemaId

  const parts = path.split("/");
  if (parts.length < 3) return null;

  // Get version (last part) and configName (second to last)
  const versionStr = parts[parts.length - 1];
  const configName = parts[parts.length - 2];

  // Everything else is the schemaId (rejoin with /)
  const schemaId = parts.slice(0, parts.length - 2).join("/");

  const version = parseInt(versionStr, 10);

  if (!schemaId || !configName || isNaN(version)) return null;

  return { schemaId, configName, version };
}

function ConfigCompare() {
  const { source, target } = Route.useSearch();
  const [viewMode, setViewMode] = useState<ViewMode>("defaults");

  const sourceConfig = parseConfigPath(source);
  const targetConfig = parseConfigPath(target);

  // Fetch source config
  const {
    data: sourceData,
    isLoading: sourceLoading,
    error: sourceError,
  } = useConfigFull(
    sourceConfig?.configName,
    sourceConfig?.version,
    sourceConfig?.schemaId,
  );

  // Fetch target config
  const {
    data: targetData,
    isLoading: targetLoading,
    error: targetError,
  } = useConfigFull(
    targetConfig?.configName,
    targetConfig?.version,
    targetConfig?.schemaId,
  );

  const getConfigContent = (
    config: typeof sourceData | typeof targetData,
  ): object => {
    if (!config) return {};

    switch (viewMode) {
      case "raw":
        return config.rawConfig;
      case "resolved":
        return config.resolvedConfig;
      case "defaults":
        return config.configWithDefaults;
    }
  };

  // Loading state
  if (sourceLoading || targetLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner message="Loading configurations..." />
      </div>
    );
  }

  // Error state
  if (sourceError || targetError) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="space-y-4">
          {sourceError && (
            <div>
              <p className="text-sm font-medium mb-2">Source Configuration Error:</p>
              <ErrorCard error={parseTanStackQueryError(sourceError)} />
            </div>
          )}
          {targetError && (
            <div>
              <p className="text-sm font-medium mb-2">Target Configuration Error:</p>
              <ErrorCard error={parseTanStackQueryError(targetError)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Invalid path state
  if (!sourceConfig || !targetConfig) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="rounded-lg border p-8 text-center">
          <p className="text-destructive font-semibold">
            Invalid configuration paths
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please ensure both source and target configuration paths are valid.
          </p>
        </div>
      </div>
    );
  }

  const sourceContent = JSON.stringify(getConfigContent(sourceData), null, 2);
  const targetContent = JSON.stringify(getConfigContent(targetData), null, 2);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Compare Configs</h1>
        <p className="text-muted-foreground mt-2">
          Side-by-side comparison of configuration versions
        </p>
      </div>

      {/* Source and Target labels aligned with diff panels */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/30 border rounded-lg">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-semibold">
            Source
          </div>
          <div className="text-base font-bold mb-1">
            {sourceData?.configName}{" "}
            <span className="text-muted-foreground font-normal">
              v{sourceData?.version}
            </span>
            {sourceData?.isLatest && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded font-normal">
                Latest
              </span>
            )}
          </div>
          <code className="text-xs text-muted-foreground block truncate">
            {sourceData?.schemaId}
          </code>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-semibold">
            Target
          </div>
          <div className="text-base font-bold mb-1">
            {targetData?.configName}{" "}
            <span className="text-muted-foreground font-normal">
              v{targetData?.version}
            </span>
            {targetData?.isLatest && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded font-normal">
                Latest
              </span>
            )}
          </div>
          <code className="text-xs text-muted-foreground block truncate">
            {targetData?.schemaId}
          </code>
        </div>
      </div>

      {/* Radio buttons for view mode */}
      <div className="mb-4">
        <RadioGroup
          value={viewMode}
          onValueChange={(value: string) => setViewMode(value as ViewMode)}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="raw" id="raw" />
            <Label htmlFor="raw" className="cursor-pointer font-normal">
              Raw (with $refs)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="resolved" id="resolved" />
            <Label htmlFor="resolved" className="cursor-pointer font-normal">
              Resolved ($refs expanded)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="defaults" id="defaults" />
            <Label htmlFor="defaults" className="cursor-pointer font-normal">
              With Defaults (runtime values)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Diff viewer */}
      <div className="border rounded-lg overflow-hidden">
        <DiffEditor
          height="calc(100vh - 340px)"
          language="json"
          original={sourceContent}
          modified={targetContent}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: true },
            renderSideBySide: true,
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            folding: true,
          }}
        />
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ArrowLeft,
  ArrowLeftRight,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigSelectorDialog } from "@/components/ConfigSelectorDialog";
import type { SelectedConfig } from "@/components/ConfigSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfigFull } from "@/lib/configCache";
import { ConfigTabsContainer } from "@/components/config/ConfigTabsContainer";
import { ErrorCard } from "@/components/ErrorCard";
import { parseTanStackQueryError } from "@/lib/errors/api-errors";

export const Route = createFileRoute("/config/$name/$version")({
  component: ConfigInspector,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      schemaId: (search.schemaId as string) || "",
    };
  },
});

function ConfigInspector() {
  const { name, version } = Route.useParams();
  const { schemaId } = Route.useSearch();
  const navigate = useNavigate();

  // Single API call for all config data
  const {
    data: config,
    isLoading,
    error,
  } = useConfigFull(name, version, schemaId);

  // Set browser tab title
  useEffect(() => {
    if (config) {
      document.title = `${config.configName} v${config.version} - Config`;
    }
    return () => {
      document.title = "Config UI";
    };
  }, [config]);

  const handleCreateNewVersion = () => {
    navigate({ 
      to: "/wizard", 
      search: { 
        mode: "edit", 
        configName: name, 
        schemaId 
      } 
    });
  };

  const handleRollback = () => {
    if (config) {
      navigate({ 
        to: "/wizard", 
        search: { 
          mode: "rollback", 
          configName: name, 
          schemaId,
          targetVersion: config.version, // Version to roll back TO
        } 
      });
    }
  };

  const handleCompare = (target: SelectedConfig) => {
    if (!config) return;

    navigate({
      to: "/config/compare",
      search: {
        source: `${config.schemaId}/${config.configName}/${config.version}`,
        target: `${target.schemaId}/${target.configName}/${target.version}`,
      } as never,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner message="Loading configuration..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorCard error={parseTanStackQueryError(error)} />
      </div>
    );
  }

  // No data
  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Configuration not found</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(config.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = new Date(config.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="container mx-auto p-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Header with green accent */}
      <div className="mb-6 border-l-4 border-l-green-500 pl-4 bg-green-50 dark:bg-green-950/30 py-4 rounded-r-lg">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
            Configuration
          </span>
        </div>

        <h1 className="text-3xl font-bold">
          {config.configName}{" "}
          <span className="text-muted-foreground">v{config.version}</span>
          {config.isLatest && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full ml-3">
              Latest
            </span>
          )}
        </h1>

        {/* Metadata */}
        <TooltipProvider>
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Schema:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <code className="bg-muted px-2 py-1 rounded text-sm cursor-help">
                    {config.schema.name}
                  </code>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-mono max-w-md break-all">
                    {config.schemaId}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Link to="/schema" search={{ id: config.schemaId } as never}>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <span className="text-sm text-muted-foreground">
              Created:{" "}
              <span className="font-medium">
                {formattedDate} at {formattedTime}
              </span>{" "}
              by <span className="font-medium">{config.createdBy}</span>
            </span>
          </div>
        </TooltipProvider>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreateNewVersion}>
            Create New Version
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRollback}
                    disabled={config.isLatest}
                  >
                    Rollback to this
                  </Button>
                </span>
              </TooltipTrigger>
              {config.isLatest && (
                <TooltipContent>
                  <p>This is already the active version</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <ConfigSelectorDialog
            trigger={
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Compare
              </Button>
            }
            title="Compare Configs"
            description={
              <>
                Select a config to compare against{" "}
                <span className="font-medium">
                  {config.configName} v{config.version}
                </span>
              </>
            }
            initialValue={{
              schemaId: config.schemaId,
              configName: config.configName,
              version: config.version,
            }}
            validateSelection={(selected) => {
              if (!selected) return false;
              // Disallow selecting the exact same config
              return !(
                selected.schemaId === config.schemaId &&
                selected.configName === config.configName &&
                selected.version === config.version
              );
            }}
            disabledTooltip="Cannot compare a config to itself"
            confirmLabel="Compare"
            selectorLabel="Compare Against"
            onSelect={handleCompare}
          />
        </div>
      </div>

      {/* Tabs */}
      <ConfigTabsContainer config={config} />
    </div>
  );
}

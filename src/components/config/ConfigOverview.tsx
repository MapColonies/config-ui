import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, GitBranch, Database, Layers } from "lucide-react";
import type { operations } from "@/types/api";

type ConfigFullData =
  operations["getFullConfig"]["responses"]["200"]["content"]["application/json"];

interface ConfigOverviewProps {
  config: ConfigFullData;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ConfigOverview({ config }: ConfigOverviewProps) {
  const formattedDate = new Date(config.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = new Date(config.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalDependencies =
    (config.dependencies.children?.length || 0) +
    (config.dependencies.parents?.length || 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Config Size</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(config.stats.configSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              {config.stats.keyCount} keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">References</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{config.stats.refCount}</div>
            <p className="text-xs text-muted-foreground">config references</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dependencies</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDependencies}</div>
            <p className="text-xs text-muted-foreground">
              {config.dependencies.children?.length || 0} children,{" "}
              {config.dependencies.parents?.length || 0} parents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versions</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{config.versions.total}</div>
            <p className="text-xs text-muted-foreground">
              {config.isLatest ? "Latest version" : "Older version"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Config Name
              </dt>
              <dd className="mt-1 text-sm font-mono">{config.configName}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Version
              </dt>
              <dd className="mt-1 text-sm">
                v{config.version}
                {config.isLatest && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Latest
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Schema
              </dt>
              <dd className="mt-1 text-sm flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {config.schema.name}
                </code>
                <Link to="/schema" search={{ id: config.schemaId } as never}>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Schema Category
              </dt>
              <dd className="mt-1 text-sm">{config.schema.category}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created
              </dt>
              <dd className="mt-1 text-sm">
                {formattedDate} at {formattedTime}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created By
              </dt>
              <dd className="mt-1 text-sm">{config.createdBy}</dd>
            </div>

            {config.hash && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Hash
                </dt>
                <dd className="mt-1 text-xs font-mono bg-muted px-2 py-1 rounded inline-block">
                  {config.hash}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Max Depth
              </dt>
              <dd className="mt-1 text-sm">{config.stats.depth} levels</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Environment Variables
              </dt>
              <dd className="mt-1 text-sm">{config.envVars.length} available</dd>
            </div>

            {config.schema.description && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  Schema Description
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {config.schema.description}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

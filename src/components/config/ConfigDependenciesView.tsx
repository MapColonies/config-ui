import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";
import type { operations } from "@/types/api";

type ConfigFullData =
  operations["getFullConfig"]["responses"]["200"]["content"]["application/json"];
type ConfigReference = ConfigFullData["dependencies"]["children"][0];

interface ConfigDependenciesViewProps {
  dependencies: ConfigFullData["dependencies"];
  schemaId: string;
}

/**
 * Render a config reference card with version info
 */
function ConfigReferenceCard({ ref }: { ref: ConfigReference }) {
  // Handle both single version and array of versions
  const versionDisplay = Array.isArray(ref.version)
    ? ref.version.join(", ")
    : `v${ref.version}`;

  // For navigation, use the first/only version
  const navVersion = Array.isArray(ref.version)
    ? ref.version[0]
    : ref.version;

  return (
    <Link
      to="/config/$name/$version"
      params={{
        name: ref.configName,
        version: String(navVersion),
      }}
      search={{ schemaId: ref.schemaId } as never}
      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group gap-4 border-b last:border-b-0"
    >
      <div className="flex-1">
        <div className="text-sm font-medium">{ref.configName}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {versionDisplay}
          {ref.isLatest && (
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Latest
            </span>
          )}
        </div>
        <code className="text-xs text-muted-foreground block mt-1">
          {ref.schemaId}
        </code>
        
        {/* Show version details if multiple versions are merged */}
        {Array.isArray(ref.version) && ref.versions && (
          <div className="mt-2 text-xs text-muted-foreground">
            {ref.versions.length} versions:{" "}
            {ref.versions.map((v) => `v${v.version}`).join(", ")}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-sm text-primary group-hover:underline shrink-0">
        View
        <ExternalLink className="w-3 h-3" />
      </div>
    </Link>
  );
}

/**
 * Recursively render config reference tree
 */
function ConfigReferenceTree({ refs }: { refs: ConfigReference[] }) {
  return (
    <div className="divide-y">
      {refs.map((ref, index) => (
        <div key={index}>
          <ConfigReferenceCard ref={ref} />
          
          {/* Render nested children if they exist */}
          {ref.children && ref.children.length > 0 && (
            <div className="ml-6 border-l-2 border-muted">
              <ConfigReferenceTree refs={ref.children} />
            </div>
          )}
          
          {/* Render nested parents if they exist */}
          {ref.parents && ref.parents.length > 0 && (
            <div className="ml-6 border-l-2 border-muted">
              <ConfigReferenceTree refs={ref.parents} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ConfigDependenciesView({
  dependencies,
  schemaId,
}: ConfigDependenciesViewProps) {
  const hasParents = dependencies.parents && dependencies.parents.length > 0;
  const hasChildren = dependencies.children && dependencies.children.length > 0;

  if (!hasParents && !hasChildren) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            This configuration has no dependencies on other configs and is not
            referenced by any other configs
          </p>
        </div>

        {/* Link to schema dependencies */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <div className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                To view schema dependencies for this configuration, visit the
                schema page.
              </p>
            <Link to="/schema" search={{ id: schemaId, tab: 'dependencies' } as never}>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-blue-300 dark:border-blue-800"
                >
                  View Schema Dependencies
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parent Dependencies */}
      {hasParents && (
        <Card>
          <div className="border-b px-4 py-3 bg-muted/30">
            <h3 className="font-semibold">Parents</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configurations that reference this config
            </p>
          </div>
          <ConfigReferenceTree refs={dependencies.parents} />
        </Card>
      )}

      {/* Child Dependencies */}
      {hasChildren && (
        <Card>
          <div className="border-b px-4 py-3 bg-muted/30">
            <h3 className="font-semibold">Children</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configurations that this config references
            </p>
          </div>
          <ConfigReferenceTree refs={dependencies.children} />
        </Card>
      )}

      {/* Link to schema dependencies */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <div className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              To view schema dependencies for this configuration, visit the
              schema page.
            </p>
              <Link to="/schema" search={{ id: schemaId, tab: 'dependencies' } as never}>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-blue-300 dark:border-blue-800"
              >
                View Schema Dependencies
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

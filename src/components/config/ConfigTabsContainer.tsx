import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfigCodeViewer } from "./ConfigCodeViewer";
import { ConfigOverview } from "./ConfigOverview";
import { EnvironmentOverridesTable } from "@/components/EnvironmentOverridesTable";
import { ConfigDependenciesView } from "./ConfigDependenciesView";
import { ConfigGraph } from "./ConfigGraph";
import { ConfigVersionsList } from "./ConfigVersionsList";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { operations } from "@/types/api";

type ConfigFullData =
  operations["getFullConfig"]["responses"]["200"]["content"]["application/json"];

interface ConfigTabsContainerProps {
  config: ConfigFullData;
}

export function ConfigTabsContainer({ config }: ConfigTabsContainerProps) {
  const hasEnvVars = config.envVars.length > 0;

  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const activeTab = (search as { tab?: string }).tab || "overview";

  const handleTabChange = (value: string) => {
    navigate({
      search: (prev: Record<string, unknown>) =>
        ({ ...prev, tab: value }) as never,
      replace: true,
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        <TabsTrigger value="env" disabled={!hasEnvVars}>
          Env Variables{hasEnvVars && ` (${config.envVars.length})`}
        </TabsTrigger>
        <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
        <TabsTrigger value="versions">
          Versions ({config.versions.total})
        </TabsTrigger>
      </TabsList>

      {/* Tab: Overview */}
      <TabsContent value="overview" className="mt-6">
        <ConfigOverview config={config} />
      </TabsContent>

      {/* Tab: Raw JSON */}
      <TabsContent value="raw" className="mt-6">
        <ConfigCodeViewer
          rawConfig={config.rawConfig}
          resolvedConfig={config.resolvedConfig}
          configWithDefaults={config.configWithDefaults}
        />
      </TabsContent>

      {/* Tab: Environment Variables */}
      <TabsContent value="env" className="mt-6">
        {hasEnvVars ? (
          <EnvironmentOverridesTable
            envVars={config.envVars}
            showExtendedColumns
          />
        ) : (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            No environment variables defined for this configuration
          </div>
        )}
      </TabsContent>

      {/* Tab: Dependencies */}
      <TabsContent value="dependencies" className="mt-6">
        <ConfigDependenciesView
          dependencies={config.dependencies}
          schemaId={config.schemaId}
        />
      </TabsContent>

      {/* Tab: Graph */}
      <TabsContent value="graph" className="mt-6">
        <ConfigGraph config={config} />
      </TabsContent>

      {/* Tab: Versions */}
      <TabsContent value="versions" className="mt-6">
        <ConfigVersionsList config={config} />
      </TabsContent>
    </Tabs>
  );
}

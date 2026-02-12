import { $api } from "./api";

/**
 * Fetch comprehensive config metadata using the new /full endpoint
 * This is the primary hook for the config inspector page
 * Includes: rawConfig, resolvedConfig, configWithDefaults, schema,
 *           dependencies, versions, envVars, stats
 *
 * @param name - Config name
 * @param version - Version number or "latest"
 * @param schemaId - Schema ID
 */
export const useConfigFull = (
  name: string | undefined,
  version: string | number | undefined,
  schemaId: string | undefined,
) => {
  return $api.useQuery("get", "/config/{name}/{version}/full", {
    params: {
      path: {
        name: name || "",
        version: version === "latest" ? "latest" : Number(version || 1),
      },
      query: { schemaId: schemaId || "" },
    },
    // staleTime: 1000 * 60 * 5, // 5 min (more frequent than schema since configs change more)
    // gcTime: 1000 * 60 * 30, // 30 min
    // enabled: !!(name && version && schemaId),
  });
};

/**
 * Fetch all versions of a specific config name
 * Used for version comparison and timeline views
 *
 * @param configName - Config name
 * @param schemaId - Schema ID
 */
export const useConfigVersions = (
  configName: string | undefined,
  schemaId: string | undefined,
) => {
  return $api.useQuery("get", "/config", {
    params: {
      query: {
        config_name: configName,
        schema_id: schemaId,
        limit: 100,
        sort: ["version:desc"],
      },
    },
    // staleTime: 1000 * 60 * 2, // 2 min
    // gcTime: 1000 * 60 * 10, // 10 min
    // enabled: !!(configName && schemaId),
  });
};

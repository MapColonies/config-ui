import { $api } from "./api";

/**
 * Fetch lightweight index of all schemas
 * Backend returns schemas array only - frontend builds search index client-side
 * Aggressive caching - schemas rarely change
 */
export const useSchemaIndex = () => {
  return $api.useQuery("get", "/schema/index", {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (previously cacheTime)
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch schema tree for navigation
 * Aggressive caching - schema tree rarely changes
 */
export const useSchemaTree = () => {
  return $api.useQuery("get", "/schema/tree", {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch comprehensive schema metadata
 * Includes: raw, dereferenced, TypeScript, dependencies, env vars
 */
export const useSchemaFull = (schemaId: string | undefined) => {
  return $api.useQuery("get", "/schema/full", {
    params: {
      query: { id: schemaId || "" },
    },
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60, // 1 hour (previously cacheTime)
    enabled: !!schemaId,
  });
};

/**
 * Fetch configs that use a specific schema
 */
export const useConfigsBySchema = (schemaId: string | undefined) => {
  return $api.useQuery("get", "/config", {
    params: {
      query: {
        schema_id: schemaId,
        limit: 20,
      },
    },
    enabled: !!schemaId,
  });
};

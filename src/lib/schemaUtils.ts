/**
 * Environment variable interface
 * Matches the EnvironmentOverride interface from EnvironmentOverridesTable.tsx
 * Backend returns data in this exact format - no conversion needed
 */
export interface EnvVar {
  envVariable: string; // Environment variable name
  configPath: string; // JSON path (e.g., "db.host")
  format?: string; // From x-env-format (e.g., "json", "uri")
  type?: string; // JSON schema type
  required?: boolean; // Is this field required?
  description?: string; // Schema description
  default?: unknown; // Default value
  refLink?: string; // External schema reference
}

/**
 * Convert schema ID to UI route path
 * "https://mapcolonies.com/common/db/full/v1" -> "common/db/full/v1"
 */
export function schemaIdToPath(schemaId: string): string {
  return schemaId.replace(/^https?:\/\/[^/]+\//, "");
}

/**
 * Extract schema name from ID
 * "https://mapcolonies.com/common/db/full/v1" -> "commonDbFullV1"
 */
export function extractSchemaName(schemaId: string): string {
  const path = schemaIdToPath(schemaId);
  return path
    .split("/")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Schema tree types (supports both API response and custom types)
 */
type SchemaTreeItem = {
  name: string;
  id: string;
};

type SchemaTreeDir = {
  name: string;
  children: SchemaTree;
};

export type SchemaTree = Array<SchemaTreeItem | SchemaTreeDir>;

export type FlatSchema = {
  id: string;
  path: string;
};

/**
 * Flatten the schema tree to a searchable list
 * Recursively traverses the tree and creates a flat list of schemas with their full paths
 */
export function flattenSchemaTree(
  tree: SchemaTree,
  path: string[] = [],
): FlatSchema[] {
  const result: FlatSchema[] = [];

  for (const node of tree) {
    if ("id" in node) {
      // Leaf node with schema ID
      result.push({
        id: node.id,
        path: [...path, node.name].join(" / "),
      });
    } else if ("children" in node) {
      // Directory node - recurse
      result.push(...flattenSchemaTree(node.children, [...path, node.name]));
    }
  }

  return result;
}

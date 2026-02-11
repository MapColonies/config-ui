import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface EnvironmentOverride {
  envVariable: string;
  configPath: string;
  format?: string;
  // Optional extended fields from backend (for schema page)
  type?: string;
  required?: boolean;
  description?: string;
  default?: unknown;
  refLink?: string;
}

interface EnvironmentOverridesTableProps {
  schema?: unknown; // Config page: pass schema for client-side extraction
  envVars?: EnvironmentOverride[]; // Schema page: pass pre-extracted data from backend
  showExtendedColumns?: boolean; // Schema page: show all columns
}

export function EnvironmentOverridesTable({
  schema,
  envVars,
  showExtendedColumns = false,
}: EnvironmentOverridesTableProps) {
  // Extract from schema (config page) OR use provided envVars (schema page)
  const overrides = envVars || extractEnvironmentOverrides(schema);

  if (overrides.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          No environment variable overrides defined in this schema
        </p>
      </div>
    );
  }

  return (
    <Card>
      <div className="border-b px-4 py-3 bg-muted/30">
        <h2 className="font-semibold">
          {showExtendedColumns
            ? "Environment Variables"
            : "Environment Variable Overrides"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {showExtendedColumns
            ? "All configurable environment variables in this schema"
            : "Properties that can be overridden by environment variables at runtime"}
        </p>
      </div>
      <div className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Environment Variable</TableHead>
              <TableHead>Config Path</TableHead>
              {showExtendedColumns && <TableHead>Type</TableHead>}
              {showExtendedColumns && <TableHead>Required</TableHead>}
              <TableHead>Format</TableHead>
              {showExtendedColumns && <TableHead>Default</TableHead>}
              {showExtendedColumns && <TableHead>Description</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {overrides.map((override, index) => (
              <TableRow key={index}>
                <TableCell>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {override.envVariable}
                  </code>
                </TableCell>
                <TableCell>
                  <code className="text-sm">{override.configPath}</code>
                </TableCell>
                {showExtendedColumns && (
                  <TableCell>
                    <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium">
                      {override.type || "any"}
                    </span>
                  </TableCell>
                )}
                {showExtendedColumns && (
                  <TableCell>
                    {override.required ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {override.format ? (
                    <span className="text-sm text-muted-foreground">
                      {override.format}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Not specified
                    </span>
                  )}
                </TableCell>
                {showExtendedColumns && (
                  <TableCell>
                    <code className="text-sm">
                      {override.default !== undefined
                        ? JSON.stringify(override.default)
                        : "-"}
                    </code>
                  </TableCell>
                )}
                {showExtendedColumns && (
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground">
                      {override.description || "-"}
                    </p>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/**
 * Recursively extracts environment variable overrides from a JSON schema
 */
function extractEnvironmentOverrides(
  schema: unknown,
  path: string = "",
  overrides: EnvironmentOverride[] = [],
): EnvironmentOverride[] {
  if (!schema || typeof schema !== "object") {
    return overrides;
  }

  const schemaObj = schema as Record<string, unknown>;

  // Check if this property has x-env-value
  if (
    "x-env-value" in schemaObj &&
    typeof schemaObj["x-env-value"] === "string"
  ) {
    overrides.push({
      envVariable: schemaObj["x-env-value"],
      configPath: path,
      format:
        typeof schemaObj["x-env-format"] === "string"
          ? schemaObj["x-env-format"]
          : undefined,
    });
  }

  // Recurse into properties
  if ("properties" in schemaObj && typeof schemaObj.properties === "object") {
    const properties = schemaObj.properties as Record<string, unknown>;
    for (const [key, value] of Object.entries(properties)) {
      const newPath = path ? `${path}.${key}` : key;
      extractEnvironmentOverrides(value, newPath, overrides);
    }
  }

  // Recurse into items (for arrays)
  if ("items" in schemaObj && typeof schemaObj.items === "object") {
    const newPath = path ? `${path}[*]` : "[*]";
    extractEnvironmentOverrides(schemaObj.items, newPath, overrides);
  }

  // Recurse into nested schemas (allOf, anyOf, oneOf)
  for (const key of ["allOf", "anyOf", "oneOf"]) {
    if (key in schemaObj && Array.isArray(schemaObj[key])) {
      for (const subSchema of schemaObj[key] as unknown[]) {
        extractEnvironmentOverrides(subSchema, path, overrides);
      }
    }
  }

  return overrides;
}

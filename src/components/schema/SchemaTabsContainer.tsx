import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchemaCodeViewer } from "./SchemaCodeViewer";
import { SchemaDocumentation } from "@/components/SchemaDocumentation";
import { EnvironmentOverridesTable } from "@/components/EnvironmentOverridesTable";
import { SchemaDependenciesView } from "./SchemaDependenciesView";
import { SchemaGraph } from "./SchemaGraph";
import { RelatedConfigsList } from "./RelatedConfigsList";
import { ReadOnlyMonacoEditor } from "@/components/ReadOnlyMonacoEditor";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { components, operations } from "@/types/api";

type Config = components["schemas"]["config"];

/**
 * Wraps a TypeScript object type in an interface and formats it
 */
function wrapInInterface(typeContent: string, schemaName: string): string {
  const trimmed = typeContent.trim();

  // If it's already an interface or type declaration, return as-is
  if (
    trimmed.startsWith("interface ") ||
    trimmed.startsWith("export interface ") ||
    trimmed.startsWith("type ") ||
    trimmed.startsWith("export type ")
  ) {
    return trimmed;
  }

  // If it's an object type { ... }, wrap it in an interface and format
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    // Clean schema name for interface
    const cleanName = schemaName
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/^[a-z]/, (c) => c.toUpperCase());

    const interfaceName = cleanName || "Schema";

    // Format the code: remove all existing indentation and normalize to 2 spaces
    const formatted = formatTypeScript(trimmed);

    return `export interface ${interfaceName} ${formatted}`;
  }

  return trimmed;
}

/**
 * Simple TypeScript formatter - normalizes indentation to 2 spaces
 */
function formatTypeScript(code: string): string {
  const lines = code.split("\n");
  let indentLevel = 0;
  const formatted: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      formatted.push("");
      continue;
    }

    // Decrease indent for closing braces/brackets
    if (trimmedLine.startsWith("}") || trimmedLine.startsWith("]")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Add line with proper indentation
    formatted.push("  ".repeat(indentLevel) + trimmedLine);

    // Increase indent after opening braces/brackets
    if (trimmedLine.endsWith("{") || trimmedLine.endsWith("[")) {
      indentLevel++;
    }
    // Decrease indent if line has closing brace (for cases like "};")
    else if (trimmedLine.endsWith("};") || trimmedLine.endsWith("],")) {
      // Already handled by the decremented level
    }
  }

  return formatted.join("\n");
}

type SchemaFullData = operations["getFullSchema"]["responses"]["200"]["content"]["application/json"];

interface SchemaTabsContainerProps {
  schema: SchemaFullData;
  relatedConfigs?: Config[];
}

export function SchemaTabsContainer({
  schema,
  relatedConfigs = [],
}: SchemaTabsContainerProps) {
  const hasTypeScript = !!schema.typeContent;
  const hasEnvVars = schema.envVars.length > 0;
  const hasConfigs = relatedConfigs.length > 0;

  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const activeTab = (search as { tab?: string }).tab || "raw";

  const handleTabChange = (value: string) => {
    navigate({
      search: (prev: Record<string, unknown>) =>
        ({ ...prev, tab: value }) as never,
      replace: true,
    });
  };

  // State for formatted TypeScript code
  const [formattedTypeScript, setFormattedTypeScript] = useState(
    schema.typeContent || "",
  );

  // Format TypeScript code when schema changes
  useEffect(() => {
    if (!schema.typeContent) {
      setFormattedTypeScript("");
      return;
    }

    // Wrap object type in an interface for better readability
    const wrapped = wrapInInterface(schema.typeContent, schema.name);
    setFormattedTypeScript(wrapped);
  }, [schema.typeContent, schema.name]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="raw">Raw Schema</TabsTrigger>
        <TabsTrigger value="typescript" disabled={!hasTypeScript}>
          TypeScript
        </TabsTrigger>
        <TabsTrigger value="docs">Documentation</TabsTrigger>
        <TabsTrigger value="env" disabled={!hasEnvVars}>
          Env Variables
        </TabsTrigger>
        <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
        <TabsTrigger value="configs">
          Configs {hasConfigs && `(${relatedConfigs.length})`}
        </TabsTrigger>
      </TabsList>

      {/* Tab: Raw Schema */}
      <TabsContent value="raw" className="mt-6">
        <SchemaCodeViewer
          rawContent={schema.rawContent}
          dereferencedContent={schema.dereferencedContent}
        />
      </TabsContent>

      {/* Tab: TypeScript */}
      <TabsContent value="typescript" className="mt-6">
        {hasTypeScript ? (
          <div className="border rounded-lg">
            <div className="border-b px-4 py-3 bg-muted/30">
              <h2 className="font-semibold">TypeScript Type Definitions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Auto-generated TypeScript types for this schema
              </p>
            </div>
            <div className="p-4">
              <ReadOnlyMonacoEditor
                value={formattedTypeScript}
                language="typescript"
                height="600px"
              />
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            TypeScript definitions not available for this schema
          </div>
        )}
      </TabsContent>

      {/* Tab: Documentation */}
      <TabsContent value="docs" className="mt-6">
        <div className="border rounded-lg">
          <div className="border-b px-4 py-3 bg-muted/30">
            <h2 className="font-semibold">Schema Documentation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Human-readable documentation of schema properties
            </p>
          </div>
          <div className="p-6">
            <SchemaDocumentation schema={schema.dereferencedContent} />
          </div>
        </div>
      </TabsContent>

      {/* Tab: Environment Variables */}
      <TabsContent value="env" className="mt-6">
        <EnvironmentOverridesTable
          envVars={schema.envVars}
          showExtendedColumns
        />
      </TabsContent>

      {/* Tab: Dependencies */}
      <TabsContent value="dependencies" className="mt-6">
        <SchemaDependenciesView dependencies={schema.dependencies} />
      </TabsContent>

      {/* Tab: Graph */}
      <TabsContent value="graph" className="mt-6">
        <SchemaGraph
          schemaId={schema.id}
          schemaName={schema.name}
          dependencies={schema.dependencies}
        />
      </TabsContent>

      {/* Tab: Configs */}
      <TabsContent value="configs" className="mt-6">
        <RelatedConfigsList configs={relatedConfigs} schemaId={schema.id} />
      </TabsContent>
    </Tabs>
  );
}

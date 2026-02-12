import { createFileRoute, Link } from "@tanstack/react-router";
import * as v from "valibot";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SchemaTabsContainer } from "@/components/schema/SchemaTabsContainer";
import { useSchemaFull, useConfigsBySchema } from "@/lib/schemaCache";
import { FileJson, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/ErrorCard";
import { parseTanStackQueryError } from "@/lib/errors/api-errors";

const schemaSearchSchema = v.object({
  id: v.optional(v.string()),
  tab: v.optional(v.string()),
});

export const Route = createFileRoute("/schema/")({
  component: SchemaInspector,
  validateSearch: schemaSearchSchema,
});

function SchemaInspector() {
  const { id: schemaId } = Route.useSearch();

  // Fetch full schema metadata
  const {
    data: schemaData,
    isLoading: isLoadingSchema,
    error: schemaError,
  } = useSchemaFull(schemaId);

  // Fetch related configs
  const { data: configsData } = useConfigsBySchema(schemaId);

  // Show message if no schema ID provided
  if (!schemaId) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Schema Inspector</h1>
        </div>
        <div className="rounded-lg border border-muted p-8 text-center">
          <p className="text-muted-foreground">
            No schema ID provided. Please provide a schema ID in the URL query
            parameter.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Example:{" "}
            <code className="bg-muted px-2 py-1 rounded">
              /schema?id=https://example.com/schema/v1
            </code>
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingSchema) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner message="Loading schema..." />
      </div>
    );
  }

  // Error state
  if (schemaError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorCard error={parseTanStackQueryError(schemaError)} />
      </div>
    );
  }

  // No data
  if (!schemaData) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Schema not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/schemas">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schemas
          </Link>
        </Button>
      </div>

      {/* Header with Schema indicator */}
      <div className="mb-6 border-l-4 border-l-blue-500 pl-4 bg-blue-50 dark:bg-blue-950/30 py-4 rounded-r-lg">
        <div className="flex items-center gap-3 mb-2">
          <FileJson className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            JSON Schema
          </span>
        </div>
        <h1 className="text-3xl font-bold">
          {schemaData.title || schemaData.name}
        </h1>
        {schemaData.description && (
          <p className="text-muted-foreground mt-2">{schemaData.description}</p>
        )}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Schema ID:</span>
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {schemaData.id}
            </code>
          </div>
          <span className="text-sm text-muted-foreground">
            Category: <span className="font-medium">{schemaData.category}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            Version: <span className="font-medium">{schemaData.version}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <SchemaTabsContainer
        schema={schemaData}
        relatedConfigs={configsData?.configs || []}
      />
    </div>
  );
}

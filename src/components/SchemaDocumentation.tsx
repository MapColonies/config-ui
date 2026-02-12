import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Props for SchemaDocumentation component
 */
interface SchemaDocumentationProps {
  /** The resolved JSON schema to document */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Record<string, any>;
}

/**
 * Props for SchemaProperty component
 */
interface SchemaPropertyProps {
  /** Property name */
  name: string;
  /** Property schema definition */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property: Record<string, any>;
  /** Whether this property is required */
  required?: boolean;
  /** Nesting level for indentation */
  level?: number;
}

/**
 * SchemaProperty
 *
 * Renders a single property from a JSON schema with type information,
 * description, and nested properties if applicable.
 */
function SchemaProperty({
  name,
  property,
  required = false,
  level = 0,
}: SchemaPropertyProps) {
  const type = property.type || "any";
  const description = property.description || "";
  const defaultValue = property.default;
  const enumValues = property.enum;

  // Determine if this property has nested properties
  const hasNestedProperties =
    property.properties && Object.keys(property.properties).length > 0;
  const hasArrayItems = type === "array" && property.items;

  return (
    <div className="mb-4" style={{ marginLeft: `${level * 1.5}rem` }}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-sm font-semibold">{name}</code>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
              {type}
            </span>
            {required && (
              <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                required
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}

          {defaultValue !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold">Default:</span>{" "}
              <code className="bg-muted px-1 rounded">
                {JSON.stringify(defaultValue)}
              </code>
            </p>
          )}

          {enumValues && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold">Allowed values:</span>{" "}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {enumValues.map((val: any, idx: number) => (
                <code key={idx} className="bg-muted px-1 rounded mr-1">
                  {JSON.stringify(val)}
                </code>
              ))}
            </p>
          )}
        </div>
      </div>

      {/* Render nested object properties */}
      {hasNestedProperties && (
        <div className="mt-2 border-l-2 border-muted pl-4">
          {Object.entries(property.properties).map(([propName, propSchema]) => (
            <SchemaProperty
              key={propName}
              name={propName}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              property={propSchema as Record<string, any>}
              required={property.required?.includes(propName)}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Render array item schema */}
      {hasArrayItems && property.items.properties && (
        <div className="mt-2 border-l-2 border-muted pl-4">
          <p className="text-xs text-muted-foreground mb-2">
            Array items have the following structure:
          </p>
          {Object.entries(property.items.properties).map(
            ([propName, propSchema]) => (
              <SchemaProperty
                key={propName}
                name={propName}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                property={propSchema as Record<string, any>}
                required={property.items.required?.includes(propName)}
                level={level + 1}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SchemaDocumentation
 *
 * Renders a human-readable documentation view of a JSON schema.
 * Displays schema title, description, type, and all properties
 * in a hierarchical, easy-to-read format.
 *
 * Features:
 * - Hierarchical property display with indentation
 * - Type badges for each property
 * - Required field indicators
 * - Default values and enum constraints
 * - Nested object and array support
 */
export function SchemaDocumentation({ schema }: SchemaDocumentationProps) {
  const title = schema.title || "Schema";
  const description = schema.description || "";
  const schemaType = schema.type || "object";
  const properties = schema.properties || {};
  const requiredFields = schema.required || [];

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription className="text-base">{description}</CardDescription>
        )}
        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium">
            Type: {schemaType}
          </span>
          {requiredFields.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium">
              {requiredFields.length} required field
              {requiredFields.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(properties).length > 0 ? (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold mb-3 text-foreground">
              Properties
            </h3>
            {Object.entries(properties).map(([propName, propSchema]) => (
              <SchemaProperty
                key={propName}
                name={propName}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                property={propSchema as Record<string, any>}
                required={requiredFields.includes(propName)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No properties defined in this schema.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

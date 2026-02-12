import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { components } from "@/types/api";

type SchemaReference = components["schemas"]["schemaReference"];

interface Dependencies {
  parents: SchemaReference[];
  children: SchemaReference[];
}

interface SchemaDependenciesViewProps {
  dependencies: Dependencies;
}

export function SchemaDependenciesView({
  dependencies,
}: SchemaDependenciesViewProps) {
  const hasParents = dependencies.parents && dependencies.parents.length > 0;
  const hasChildren = dependencies.children && dependencies.children.length > 0;

  if (!hasParents && !hasChildren) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          This schema has no parent or child dependencies
        </p>
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
              Schemas that reference/depend on this schema
            </p>
          </div>
          <div className="divide-y">
            {dependencies.parents.map((parent, index) => (
              <Link
                key={index}
                to="/schema"
                search={{ id: parent.id } as never}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group gap-4"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{parent.name}</div>
                  <code className="text-xs text-muted-foreground">
                    {parent.id}
                  </code>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary group-hover:underline shrink-0">
                  View
                  <ExternalLink className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Child Dependencies */}
      {hasChildren && (
        <Card>
          <div className="border-b px-4 py-3 bg-muted/30">
            <h3 className="font-semibold">Children</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Schemas that this schema references/depends on
            </p>
          </div>
          <div className="divide-y">
            {dependencies.children.map((child, index) => (
              <Link
                key={index}
                to="/schema"
                search={{ id: child.id } as never}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group gap-4"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{child.name}</div>
                  <code className="text-xs text-muted-foreground">
                    {child.id}
                  </code>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary group-hover:underline shrink-0">
                  View
                  <ExternalLink className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

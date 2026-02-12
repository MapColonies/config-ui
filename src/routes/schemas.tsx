import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Folder, Search, X, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useSchemaIndex } from "@/lib/schemaCache";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorCard } from "@/components/ErrorCard";
import { parseTanStackQueryError } from "@/lib/errors/api-errors";

type SchemasSearch = {
  q?: string;
};

export const Route = createFileRoute("/schemas")({
  component: SchemasList,
  validateSearch: (search: Record<string, unknown>): SchemasSearch => {
    return {
      q: typeof search.q === "string" ? search.q : undefined,
    };
  },
});

// Schema family represents a group of versions for the same schema
type SchemaFamily = {
  displayName: string; // Path relative to category (e.g., "db/full")
  versions: string[]; // ["v1", "v2"]
  fullPath: string; // Full path without domain (e.g., "common/db/full")
  category: string; // "common", "infra", "vector"
  schemaIds: string[]; // Full schema IDs for each version
};

// Group schemas by base path (removing version) and organize by category
function groupSchemasByPath(
  schemas: Array<{
    id: string;
    path: string;
    version: string;
    category: string;
  }>
): Record<string, SchemaFamily[]> {
  const groupedMap = new Map<string, SchemaFamily>();

  schemas.forEach((schema) => {
    // Extract base path (remove version)
    // "common/db/full/v1" → "common/db/full"
    const basePath = schema.path.replace(/\/v\d+$/, "");

    if (!groupedMap.has(basePath)) {
      const category = schema.category;
      // Remove category prefix for display
      // "common/db/full" → "db/full"
      const displayName = basePath.replace(`${category}/`, "");

      groupedMap.set(basePath, {
        displayName,
        versions: [],
        fullPath: basePath,
        category,
        schemaIds: [],
      });
    }

    const group = groupedMap.get(basePath)!;
    group.versions.push(schema.version);
    group.schemaIds.push(schema.id);
  });

  // Group by category
  const byCategory: Record<string, SchemaFamily[]> = {};
  groupedMap.forEach((family) => {
    if (!byCategory[family.category]) {
      byCategory[family.category] = [];
    }
    byCategory[family.category].push(family);
  });

  // Sort families within each category by display name
  Object.values(byCategory).forEach((families) => {
    families.sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  return byCategory;
}

// Highlight matching text
function highlightText(text: string, query: string) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

function SchemasList() {
  const navigate = useNavigate({ from: "/schemas" });
  const { q: urlQuery } = Route.useSearch();
  const [searchQuery, setSearchQuery] = useState(urlQuery || "");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  // Sync search query with URL
  useEffect(() => {
    if (urlQuery !== undefined) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  // Auto-expand all categories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      // Clear collapsed categories when searching (expand all)
      setCollapsedCategories(new Set());
    }
  }, [searchQuery]);

  // Update URL when search query changes
  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    navigate({
      search: query ? { q: query } : {},
      replace: true,
    });
  };

  // Fetch schema index
  const { data: schemaIndex, isLoading, error } = useSchemaIndex();

  // Group schemas by category and path
  const groupedSchemas = useMemo(() => {
    if (!schemaIndex?.schemas) return {};
    return groupSchemasByPath(schemaIndex.schemas);
  }, [schemaIndex]);

  // Filter schemas based on search query
  const filteredGroupedSchemas = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedSchemas;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, SchemaFamily[]> = {};

    Object.entries(groupedSchemas).forEach(([category, families]) => {
      const matchingFamilies = families.filter((family) => {
        const searchText = [
          family.displayName,
          family.fullPath,
          family.versions.join(" "),
          category,
        ]
          .join(" ")
          .toLowerCase();

        return searchText.includes(query);
      });

      if (matchingFamilies.length > 0) {
        filtered[category] = matchingFamilies;
      }
    });

    return filtered;
  }, [searchQuery, groupedSchemas]);

  // Calculate total schema count
  const totalSchemas = useMemo(() => {
    return Object.values(groupedSchemas).reduce(
      (sum, families) => sum + families.length,
      0
    );
  }, [groupedSchemas]);

  const totalCategories = Object.keys(groupedSchemas).length;

  // Toggle category collapse state
  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="h-full w-full">
        <div className="border-b bg-background px-8 py-5">
          <h1 className="text-2xl font-semibold text-foreground">Schemas</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Browse and inspect available JSON schemas
          </p>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="rounded-lg border bg-background shadow-sm">
            <LoadingSpinner message="Loading schemas..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full">
        <div className="border-b bg-background px-8 py-5">
          <h1 className="text-2xl font-semibold text-foreground">Schemas</h1>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="max-w-md w-full">
            <ErrorCard error={parseTanStackQueryError(error)} />
          </div>
        </div>
      </div>
    );
  }

  const categories = Object.keys(filteredGroupedSchemas).sort();
  const hasResults = categories.length > 0;

  return (
    <div className="h-full w-full">
      <div className="border-b bg-background px-8 py-5">
        <h1 className="text-2xl font-semibold text-foreground">Schemas</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Browse and inspect available JSON schemas
        </p>
      </div>

      <div className="container mx-auto p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search schemas..."
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {!searchQuery && (
          <div className="mb-6 text-sm text-muted-foreground">
            {totalSchemas} schema{totalSchemas === 1 ? "" : "s"} across{" "}
            {totalCategories} categor{totalCategories === 1 ? "y" : "ies"}
          </div>
        )}

        {/* Schema Grid by Category */}
        {hasResults ? (
          <div className="space-y-8">
            {categories.map((category) => {
              const families = filteredGroupedSchemas[category];
              const isCollapsed = collapsedCategories.has(category);

              return (
                <div key={category}>
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 mb-4 group w-full"
                  >
                    <Folder className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">{category}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({families.length})
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
                    )}
                  </button>

                  {/* Schema Cards Grid */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                      {families.map((family) => (
                        <SchemaCard
                          key={family.fullPath}
                          family={family}
                          searchQuery={searchQuery}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? `No schemas found matching "${searchQuery}"`
                : "No schemas available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Schema card component
function SchemaCard({
  family,
  searchQuery,
}: {
  family: SchemaFamily;
  searchQuery: string;
}) {
  // Navigate to the latest version (last in array)
  const latestSchemaId = family.schemaIds[family.schemaIds.length - 1];
  const latestVersion = family.versions[family.versions.length - 1];

  // Create version-to-id mapping for the dropdown
  const versionItems = family.versions.map((version, index) => ({
    version,
    schemaId: family.schemaIds[index],
    isLatest: version === latestVersion,
  })).reverse(); // Show latest first

  return (
    <Card className="p-4 hover:border-primary hover:shadow-md transition-all h-full relative group">
      {/* Three-dot menu (top-right) */}
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Version menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
            {versionItems.map(({ version, schemaId, isLatest }) => (
              <DropdownMenuItem key={version} asChild>
                <Link
                  to="/schema"
                  search={{ id: schemaId }}
                  className="cursor-pointer"
                >
                  {version} {isLatest && "(latest)"}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card content - clickable to go to latest version */}
      <Link to="/schema" search={{ id: latestSchemaId }} className="block">
        <div className="space-y-3 pr-8">
          {/* Schema Name */}
          <div className="font-semibold text-base break-words">
            {highlightText(family.displayName, searchQuery)}
          </div>

          {/* Versions */}
          <div className="flex flex-wrap gap-1.5">
            {family.versions.map((version) => (
              <Badge key={version} variant="secondary" className="text-xs">
                {highlightText(version, searchQuery)}
              </Badge>
            ))}
          </div>

          {/* Full Path */}
          <div className="text-xs font-mono text-muted-foreground break-all">
            {highlightText(`${family.fullPath}/*`, searchQuery)}
          </div>
        </div>
      </Link>
    </Card>
  );
}

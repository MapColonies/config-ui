import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Search, Plus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type SortConfig,
  type SortColumn,
  type ConfigTableFilters,
} from "@/components/config/DataTable";
import { DateRangeFilterPopover } from "@/components/config/DateRangeFilterPopover";
import { type ColumnFilters } from "@/components/config/columns";
import { prepareWizardNavigation } from "@/lib/wizard-navigation";

// URL search params schema
type ConfigSearchParams = {
  q?: string;
  schemaId?: string;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
  sortColumn?: SortColumn;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

// Valid sort columns for validation
const VALID_SORT_COLUMNS: SortColumn[] = [
  "config-name",
  "schema-id",
  "version",
  "created-at",
  "created-by",
];

function isValidSortColumn(value: unknown): value is SortColumn {
  return typeof value === "string" && VALID_SORT_COLUMNS.includes(value as SortColumn);
}

export const Route = createFileRoute("/")(
  {
    component: ConfigDashboard,
    validateSearch: (search: Record<string, unknown>): ConfigSearchParams => ({
      q: (search.q as string) || undefined,
      schemaId: (search.schemaId as string) || undefined,
      createdBy: (search.createdBy as string) || undefined,
      createdAfter: (search.createdAfter as string) || undefined,
      createdBefore: (search.createdBefore as string) || undefined,
      sortColumn: isValidSortColumn(search.sortColumn) ? search.sortColumn : undefined,
      sortDirection: (search.sortDirection as "asc" | "desc") || undefined,
      page: search.page ? Number(search.page) : undefined,
      pageSize: search.pageSize ? Number(search.pageSize) : undefined,
    }),
  }
);

const DEBOUNCE_MS = 300;

function ConfigDashboard() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  // Local state for search input (for immediate feedback)
  const [searchInput, setSearchInput] = useState(searchParams.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local search input when URL changes externally
  useEffect(() => {
    setSearchInput(searchParams.q ?? "");
  }, [searchParams.q]);

  // Derive state from URL params with defaults
  const filters: ConfigTableFilters = {
    q: searchParams.q,
    schemaId: searchParams.schemaId,
    createdBy: searchParams.createdBy,
    createdAfter: searchParams.createdAfter,
    createdBefore: searchParams.createdBefore,
  };

  const sort: SortConfig = {
    column: searchParams.sortColumn ?? "created-at",
    direction: searchParams.sortDirection ?? "desc",
  };

  const page = searchParams.page ?? 1;
  const pageSize = searchParams.pageSize ?? 10;

  // Update URL params helper
  const updateSearch = (updates: Partial<ConfigSearchParams>) => {
    navigate({
      to: "/",
      search: (prev) => {
        const next = { ...prev, ...updates };
        // Reset page to 1 when filters change (but not when page/pageSize change)
        if (
          updates.q !== undefined ||
          updates.schemaId !== undefined ||
          updates.createdBy !== undefined ||
          updates.createdAfter !== undefined ||
          updates.createdBefore !== undefined
        ) {
          next.page = 1;
        }
        // Clean up undefined values
        Object.keys(next).forEach((key) => {
          if (next[key as keyof ConfigSearchParams] === undefined) {
            delete next[key as keyof ConfigSearchParams];
          }
        });
        return next;
      },
      replace: true,
    });
  };

  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setSearchInput(value); // Immediate local update

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce URL update
    debounceRef.current = setTimeout(() => {
      updateSearch({ q: value || undefined });
    }, DEBOUNCE_MS);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSortChange = (newSort: SortConfig) => {
    updateSearch({
      sortColumn: newSort.column,
      sortDirection: newSort.direction,
    });
  };

  const handlePageChange = (newPage: number) => {
    updateSearch({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateSearch({ pageSize: newPageSize, page: 1 });
  };

  const handleColumnFilterChange = (
    key: keyof ColumnFilters,
    value: string | undefined
  ) => {
    updateSearch({ [key]: value });
  };

  const handleCreatedAfterChange = (value: string | undefined) => {
    updateSearch({ createdAfter: value });
  };

  const handleCreatedBeforeChange = (value: string | undefined) => {
    updateSearch({ createdBefore: value });
  };

  const handleCreateNew = () => {
    navigate(prepareWizardNavigation({ mode: "create" }));
  };

  return (
    <div className="h-full w-full">
      <div className="border-b bg-background px-8 py-5">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Config Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Search, filter, and manage your configuration instances
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Config
          </Button>
        </div>
      </div>

      <div className="px-8 py-6 w-full">
        <div className="mx-auto max-w-[1400px]">
          {/* Search Bar and Date Filter */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search configurations..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>

            {/* Date Range Filter */}
            <DateRangeFilterPopover
              createdAfter={filters.createdAfter}
              createdBefore={filters.createdBefore}
              onCreatedAfterChange={handleCreatedAfterChange}
              onCreatedBeforeChange={handleCreatedBeforeChange}
            />
          </div>

          {/* Data Table */}
          <DataTable
            filters={filters}
            sort={sort}
            page={page}
            pageSize={pageSize}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onColumnFilterChange={handleColumnFilterChange}
          />
        </div>
      </div>
    </div>
  );
}

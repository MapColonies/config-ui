import { useMemo, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/config/DataTablePagination";
import { createColumns, type ColumnFilters } from "@/components/config/columns";
import { $api } from "@/lib/api";
import type { components } from "@/types/api";
import { ErrorCard } from "@/components/ErrorCard";
import { parseTanStackQueryError } from "@/lib/errors/api-errors";

type Config = components["schemas"]["config"];

// Valid sort columns as defined by API pattern
export type SortColumn =
  | "config-name"
  | "schema-id"
  | "version"
  | "created-at"
  | "created-by";

export type SortConfig = {
  column: SortColumn;
  direction: "asc" | "desc";
};

export type ConfigTableFilters = {
  q?: string;
  schemaId?: string;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
};

type DataTableProps = {
  filters: ConfigTableFilters;
  sort: SortConfig;
  page: number;
  pageSize: number;
  onSortChange: (sort: SortConfig) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onColumnFilterChange: (key: keyof ColumnFilters, value: string | undefined) => void;
};

export function DataTable({
  filters,
  sort,
  page,
  pageSize,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onColumnFilterChange,
}: DataTableProps) {
  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = $api.useQuery("get", "/config", {
    params: {
      query: {
        version: "latest",
        limit: pageSize,
        offset: (page - 1) * pageSize,
        sort: [`${sort.column}:${sort.direction}`],
        q: filters.q || undefined,
        schema_id: filters.schemaId || undefined,
        created_by: filters.createdBy || undefined,
        created_at_gt: filters.createdAfter || undefined,
        created_at_lt: filters.createdBefore || undefined,
      },
    },
  });

  const handleSort = useCallback((column: SortColumn) => {
    if (sort.column === column) {
      // Toggle direction
      onSortChange({
        column,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // New column, default to desc
      onSortChange({ column, direction: "desc" });
    }
  }, [sort.column, sort.direction, onSortChange]);

  const columnFilters: ColumnFilters = {
    schemaId: filters.schemaId,
    createdBy: filters.createdBy,
  };

  const columns = useMemo(
    () =>
      createColumns({
        sortColumn: sort.column,
        sortDirection: sort.direction,
        onSort: handleSort,
        columnFilters,
        onColumnFilterChange,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort.column, sort.direction, columnFilters.schemaId, columnFilters.createdBy]
  );

  const configs: Config[] = response?.configs ?? [];
  const total = response?.total ?? 0;

  const table = useReactTable({
    data: configs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  // Only show full loading state on initial load (no data yet)
  const showInitialLoading = isLoading && configs.length === 0;
  // Show subtle loading overlay when refetching
  const showRefetchOverlay = isFetching && !isLoading;

  if (error) {
    return <ErrorCard error={parseTanStackQueryError(error)} compact />;
  }

  return (
    <div className="space-y-4">
      {/* Table with loading overlay */}
      <div className="relative border rounded-lg">
        {/* Loading overlay for refetches */}
        {showRefetchOverlay && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {showInitialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Loading configurations...</span>
          </div>
        ) : configs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No configurations found matching your filters
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-[52px]">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {/* Empty placeholder rows to maintain consistent table height */}
              {configs.length < pageSize &&
                Array.from({ length: pageSize - configs.length }).map((_, index) => (
                  <TableRow key={`empty-${index}`} className="h-[52px] hover:bg-transparent">
                    {columns.map((_, colIndex) => (
                      <TableCell key={`empty-${index}-${colIndex}`}>
                        &nbsp;
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Bottom pagination */}
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

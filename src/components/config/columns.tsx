import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RowActions } from "@/components/config/RowActions";
import { SchemaComboBox } from "@/components/SchemaComboBox";
import { schemaIdToPath } from "@/lib/schemaUtils";
import type { components } from "@/types/api";
import type { SortColumn } from "@/components/config/DataTable";

type Config = components["schemas"]["config"];

// Column filter state passed from parent
export type ColumnFilters = {
  schemaId?: string;
  createdBy?: string;
};

type ColumnsProps = {
  sortColumn?: SortColumn;
  sortDirection?: "asc" | "desc";
  onSort: (column: SortColumn) => void;
  columnFilters: ColumnFilters;
  onColumnFilterChange: (key: keyof ColumnFilters, value: string | undefined) => void;
};

export function createColumns({
  sortColumn,
  sortDirection,
  onSort,
  columnFilters,
  onColumnFilterChange,
}: ColumnsProps): ColumnDef<Config>[] {
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-1 h-3 w-3" />;
    }
    return <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return [
    {
      accessorKey: "configName",
      size: 350,
      header: () => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 gap-1"
          onClick={() => onSort("config-name")}
        >
          Config Name
          {getSortIcon("config-name")}
        </Button>
      ),
      cell: ({ row }) => {
        const config = row.original;
        return (
          <Link
            to="/config/$name/$version"
            params={{
              name: config.configName,
              version: String(config.version),
            }}
            search={{ schemaId: config.schemaId }}
            className="font-medium text-primary hover:underline block -mx-2 -my-2 px-2 py-2"
          >
            {config.configName}
          </Link>
        );
      },
    },
    {
      accessorKey: "schemaId",
      size: 300,
      header: () => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="-ml-3 h-8 gap-1"
            onClick={() => onSort("schema-id")}
          >
            Schema
            {getSortIcon("schema-id")}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <Filter
                  className={`h-3 w-3 ${columnFilters.schemaId ? "text-primary" : "opacity-50"}`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-3" align="start">
              <div className="space-y-2">
                <div className="text-sm font-medium">Filter by Schema</div>
                <SchemaComboBox
                  value={columnFilters.schemaId}
                  onValueChange={(value) => onColumnFilterChange("schemaId", value)}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ),
      cell: ({ row }) => {
        const schemaId = row.original.schemaId;
        return (
          <span className="text-muted-foreground" title={schemaId}>
            {schemaIdToPath(schemaId)}
          </span>
        );
      },
    },
    {
      accessorKey: "version",
      size: 100,
      header: () => <span className="text-muted-foreground">Version</span>,
      cell: ({ row }) => (
        <span className="font-mono text-sm">v{row.original.version}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      size: 140,
      header: () => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 gap-1"
          onClick={() => onSort("created-at")}
        >
          Created
          {getSortIcon("created-at")}
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        const shortDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const fullDateTime = date.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-default">
                  {shortDate}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {fullDateTime}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "createdBy",
      size: 140,
      header: () => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="-ml-3 h-8 gap-1"
            onClick={() => onSort("created-by")}
          >
            Creator
            {getSortIcon("created-by")}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <Filter
                  className={`h-3 w-3 ${columnFilters.createdBy ? "text-primary" : "opacity-50"}`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-3" align="start">
              <div className="space-y-2">
                <div className="text-sm font-medium">Filter by Creator</div>
                <Input
                  placeholder="Enter creator name..."
                  value={columnFilters.createdBy ?? ""}
                  onChange={(e) =>
                    onColumnFilterChange("createdBy", e.target.value || undefined)
                  }
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.createdBy}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const config = row.original;
        return (
          <RowActions
            configName={config.configName}
            schemaId={config.schemaId}
            currentVersion={config.version}
          />
        );
      },
      size: 48,
    },
  ];
}

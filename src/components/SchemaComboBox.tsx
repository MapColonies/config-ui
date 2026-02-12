import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { $api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { flattenSchemaTree } from "@/lib/schemaUtils";

type SchemaComboBoxProps = {
  value?: string;
  onValueChange: (value: string | undefined) => void;
};

export function SchemaComboBox({ value, onValueChange }: SchemaComboBoxProps) {
  const [open, setOpen] = useState(false);

  const { data: schemaTree, isLoading } = $api.useQuery("get", "/schema/tree");

  const schemas = useMemo(() => {
    if (!schemaTree) return [];
    return flattenSchemaTree(schemaTree);
  }, [schemaTree]);

  const selectedSchema = schemas.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            "Loading schemas..."
          ) : selectedSchema ? (
            <span className="truncate">{selectedSchema.path}</span>
          ) : (
            "Select schema..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search schemas..." />
          <CommandList>
            <CommandEmpty>No schema found.</CommandEmpty>
            <CommandGroup>
              {schemas.map((schema) => (
                <CommandItem
                  key={schema.id}
                  value={schema.path}
                  onSelect={() => {
                    onValueChange(value === schema.id ? undefined : schema.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === schema.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {schema.path}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

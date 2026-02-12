import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { $api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { flattenSchemaTree } from "@/lib/schemaUtils";

export type SelectedConfig = {
  schemaId: string;
  configName: string;
  version: number;
};

type ConfigSelectorProps = {
  value?: SelectedConfig;
  onChange: (config: SelectedConfig | undefined) => void;
  label?: string;
  disabled?: boolean;
};

export function ConfigSelector({
  value,
  onChange,
  label = "Select Config",
  disabled = false,
}: ConfigSelectorProps) {
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [configNameOpen, setConfigNameOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  const [selectedSchemaId, setSelectedSchemaId] = useState<string | undefined>(
    value?.schemaId,
  );
  const [selectedConfigName, setSelectedConfigName] = useState<
    string | undefined
  >(value?.configName);
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(
    value?.version,
  );

  // Sync internal state with external value
  useEffect(() => {
    setSelectedSchemaId(value?.schemaId);
    setSelectedConfigName(value?.configName);
    setSelectedVersion(value?.version);
  }, [value]);

  // Fetch schema tree
  const { data: schemaTree, isLoading: isLoadingSchemas } = $api.useQuery(
    "get",
    "/schema/tree",
  );

  const schemas = useMemo(() => {
    if (!schemaTree) return [];
    return flattenSchemaTree(schemaTree);
  }, [schemaTree]);

  // Fetch configs for selected schema
  const { data: configsData, isLoading: isLoadingConfigs } = $api.useQuery(
    "get",
    "/config",
    {
      params: {
        query: {
          schema_id: selectedSchemaId,
          limit: 100,
        },
      },
      queryKey: ["configs", selectedSchemaId],
    },
    {
      enabled: !!selectedSchemaId,
    },
  );

  // Extract unique config names from configs
  const configNames = useMemo(() => {
    if (!configsData?.configs) return [];
    const uniqueNames = new Set(configsData.configs.map((c) => c.configName));
    return Array.from(uniqueNames).sort();
  }, [configsData]);

  // Fetch versions for selected schema + config name
  const { data: versionsData, isLoading: isLoadingVersions } = $api.useQuery(
    "get",
    "/config",
    {
      params: {
        query: {
          schema_id: selectedSchemaId,
          config_name: selectedConfigName,
          limit: 100,
        },
      },
      queryKey: ["config-versions", selectedSchemaId, selectedConfigName],
    },
    {
      enabled: !!selectedSchemaId && !!selectedConfigName,
    },
  );

  const versions = useMemo(() => {
    if (!versionsData?.configs) return [];
    return versionsData.configs.sort((a, b) => b.version - a.version);
  }, [versionsData]);

  // Auto-select latest version when versions load (if not already set)
  useEffect(() => {
    if (!selectedVersion && versions.length > 0) {
      const latestConfig = versions.find((v) => v.isLatest);
      if (latestConfig) {
        setSelectedVersion(latestConfig.version);
        // Notify parent immediately
        if (selectedSchemaId && selectedConfigName) {
          onChange({
            schemaId: selectedSchemaId,
            configName: selectedConfigName,
            version: latestConfig.version,
          });
        }
      }
    }
  }, [versions, selectedVersion, selectedSchemaId, selectedConfigName, onChange]);

  // Handle schema selection
  const handleSchemaChange = (schemaId: string | undefined) => {
    setSelectedSchemaId(schemaId);
    // Only clear dependent fields, don't notify parent yet
    setSelectedConfigName(undefined);
    setSelectedVersion(undefined);
    setSchemaOpen(false);
  };

  // Handle config name selection
  const handleConfigNameChange = (configName: string | undefined) => {
    setSelectedConfigName(configName);
    // Only clear version, don't notify parent yet
    setSelectedVersion(undefined);
    setConfigNameOpen(false);
  };

  // Handle version selection
  const handleVersionChange = (version: number | undefined) => {
    setSelectedVersion(version);
    setVersionOpen(false);

    if (selectedSchemaId && selectedConfigName && version !== undefined) {
      onChange({
        schemaId: selectedSchemaId,
        configName: selectedConfigName,
        version,
      });
    } else {
      onChange(undefined);
    }
  };

  const selectedSchema = schemas.find((s) => s.id === selectedSchemaId);

  // Check if any selection exists
  const hasSelection =
    selectedSchemaId || selectedConfigName || selectedVersion !== undefined;

  // Handle clear all selections
  const handleClear = () => {
    setSelectedSchemaId(undefined);
    setSelectedConfigName(undefined);
    setSelectedVersion(undefined);
    onChange(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hasSelection && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Step 1: Schema Selector */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Schema</Label>
        <Popover modal={false} open={schemaOpen} onOpenChange={setSchemaOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={schemaOpen}
              className="w-full justify-between"
              disabled={disabled || isLoadingSchemas}
            >
              {isLoadingSchemas ? (
                "Loading schemas..."
              ) : selectedSchema ? (
                <span className="truncate">{selectedSchema.path}</span>
              ) : (
                "Select schema..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0"
            onWheel={(e) => e.stopPropagation()}
          >
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
                        handleSchemaChange(
                          selectedSchemaId === schema.id
                            ? undefined
                            : schema.id,
                        );
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSchemaId === schema.id
                            ? "opacity-100"
                            : "opacity-0",
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
      </div>

      {/* Step 2: Config Name Selector */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Config Name</Label>
        <Popover
          modal={false}
          open={configNameOpen}
          onOpenChange={setConfigNameOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={configNameOpen}
              className="w-full justify-between"
              disabled={disabled || !selectedSchemaId || isLoadingConfigs}
            >
              {!selectedSchemaId ? (
                "Select schema first..."
              ) : isLoadingConfigs ? (
                "Loading configs..."
              ) : selectedConfigName ? (
                <span className="truncate">{selectedConfigName}</span>
              ) : (
                "Select config..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0"
            onWheel={(e) => e.stopPropagation()}
          >
            <Command>
              <CommandInput placeholder="Search configs..." />
              <CommandList>
                <CommandEmpty>No config found.</CommandEmpty>
                <CommandGroup>
                  {configNames.map((name) => (
                    <CommandItem
                      key={name}
                      value={name}
                      onSelect={() => {
                        handleConfigNameChange(
                          selectedConfigName === name ? undefined : name,
                        );
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedConfigName === name
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Step 3: Version Selector */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Version</Label>
        <Popover modal={false} open={versionOpen} onOpenChange={setVersionOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={versionOpen}
              className="w-full justify-between"
              disabled={disabled || !selectedConfigName || isLoadingVersions}
            >
              {!selectedConfigName ? (
                "Select config first..."
              ) : isLoadingVersions ? (
                "Loading versions..."
              ) : selectedVersion !== undefined ? (
                <span className="truncate">v{selectedVersion}</span>
              ) : (
                "Select version..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0"
            onWheel={(e) => e.stopPropagation()}
          >
            <Command>
              <CommandInput placeholder="Search versions..." />
              <CommandList>
                <CommandEmpty>No version found.</CommandEmpty>
                <CommandGroup>
                  {versions.map((config) => (
                    <CommandItem
                      key={config.version}
                      value={`v${config.version}`}
                      onSelect={() => {
                        handleVersionChange(
                          selectedVersion === config.version
                            ? undefined
                            : config.version,
                        );
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedVersion === config.version
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span>v{config.version}</span>
                      {config.isLatest && (
                        <Badge variant="secondary" className="ml-2">
                          Latest
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MoreVertical, Eye, Plus, History, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { $api } from "@/lib/api";
import { prepareWizardNavigation } from "@/lib/wizard-navigation";

type RowActionsProps = {
  configName: string;
  schemaId: string;
  currentVersion: number;
};

export function RowActions({
  configName,
  schemaId,
  currentVersion,
}: RowActionsProps) {
  const navigate = useNavigate();
  const [versionsOpen, setVersionsOpen] = useState(false);

  // Only one version if currentVersion is 1
  const hasMultipleVersions = currentVersion > 1;

  // Lazy-fetch versions only when submenu is opened
  const { data, isLoading } = $api.useQuery(
    "get",
    "/config",
    {
      params: {
        query: {
          config_name: configName,
          schema_id: schemaId,
          sort: ["version:desc"],
          limit: 100,
        },
      },
    },
    {
      enabled: versionsOpen && hasMultipleVersions,
    }
  );

  const versions = data?.configs ?? [];

  const handleView = () => {
    navigate({
      to: "/config/$name/$version",
      params: { name: configName, version: String(currentVersion) },
      search: { schemaId },
    });
  };

  const handleNewVersion = () => {
    navigate(
      prepareWizardNavigation({
        mode: "edit",
        configName,
        schemaId,
      })
    );
  };

  const handleVersionSelect = (version: number) => {
    navigate({
      to: "/config/$name/$version",
      params: { name: configName, version: String(version) },
      search: { schemaId },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleNewVersion}>
          <Plus className="mr-2 h-4 w-4" />
          New Version
        </DropdownMenuItem>

        {hasMultipleVersions && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub onOpenChange={setVersionsOpen}>
              <DropdownMenuSubTrigger>
                <History className="mr-2 h-4 w-4" />
                Versions
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-[120px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4 px-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : versions.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No versions found
                  </div>
                ) : (
                  versions.map((config) => (
                    <DropdownMenuItem
                      key={config.version}
                      onClick={() => handleVersionSelect(config.version)}
                      className="font-mono"
                    >
                      v{config.version}
                      {config.isLatest && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (latest)
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

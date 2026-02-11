import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { operations } from "@/types/api";

type ConfigFullData =
  operations["getFullConfig"]["responses"]["200"]["content"]["application/json"];

interface ConfigVersionsListProps {
  config: ConfigFullData;
}

export function ConfigVersionsList({ config }: ConfigVersionsListProps) {
  const { versions, version: currentVersion, configName, schemaId } = config;

  if (versions.total === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No version history available</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="border-b px-4 py-3 bg-muted/30">
        <h2 className="font-semibold">Version History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          All versions of <code className="font-mono">{configName}</code> (
          {versions.total} total)
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {versions.all.map((versionInfo, index) => {
            const isCurrent = versionInfo.version === currentVersion;
            const formattedDate = new Date(
              versionInfo.createdAt,
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const formattedTime = new Date(
              versionInfo.createdAt,
            ).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={versionInfo.version}
                className={`relative flex items-start gap-4 pb-4 ${
                  index !== versions.all.length - 1 ? "border-b" : ""
                }`}
              >
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      versionInfo.isLatest
                        ? "bg-green-500 text-white"
                        : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                    }`}
                  >
                    {isCurrent ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : versionInfo.isLatest ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">
                        {versionInfo.version}
                      </span>
                    )}
                  </div>
                  {index !== versions.all.length - 1 && (
                    <div className="h-full w-px bg-border mt-2" />
                  )}
                </div>

                {/* Version content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-semibold">
                      v{versionInfo.version}
                    </span>
                    {versionInfo.isLatest && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                        Latest
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span>
                      {formattedDate} at {formattedTime}
                    </span>
                    <span className="mx-2">•</span>
                    <span>by {versionInfo.createdBy}</span>
                  </div>

                  {versionInfo.hash && (
                    <div className="text-xs text-muted-foreground">
                      Hash:{" "}
                      <code className="bg-muted px-1 rounded font-mono">
                        {versionInfo.hash}
                      </code>
                    </div>
                  )}

                  {isCurrent ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <ArrowRight className="h-4 w-4" />
                      You are viewing this version
                    </div>
                  ) : (
                    <Link
                      to="/config/$name/$version"
                      params={{
                        name: configName,
                        version: String(versionInfo.version),
                      }}
                      search={{ schemaId } as never}
                    >
                      <Button variant="outline" size="sm" className="mt-2">
                        View This Version
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { components } from "@/types/api";

type Config = components["schemas"]["config"];

interface RelatedConfigsListProps {
  configs: Config[];
  schemaId: string;
}

export function RelatedConfigsList({
  configs,
  schemaId,
}: RelatedConfigsListProps) {
  if (configs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          No configurations are currently using this schema
        </p>
      </div>
    );
  }

  return (
    <Card>
      <div className="border-b px-4 py-3 bg-muted/30">
        <h3 className="font-semibold">Configurations Using This Schema</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {configs.length} config{configs.length !== 1 ? "s" : ""} found
        </p>
      </div>
      <div className="divide-y">
        {configs.map((config) => (
          <Link
            key={`${config.configName}-${config.version}`}
            to="/config/$name/$version"
            params={{
              name: config.configName,
              version: config.version.toString(),
            }}
            search={{ schemaId }}
            className="block p-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium group-hover:text-primary transition-colors">
                    {config.configName}
                  </h4>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    v{config.version}
                  </span>
                  {config.isLatest && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    Created {new Date(config.createdAt).toLocaleDateString()}
                  </span>
                  <span>by {config.createdBy}</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/configs")({
  component: ConfigsList,
});

function ConfigsList() {
  return (
    <div className="h-full">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-semibold">Configs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your configuration instances
        </p>
      </div>
      <div className="flex items-center justify-center p-12">
        <div className="rounded-lg border bg-card p-12 text-center max-w-md">
          <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Coming Soon</p>
          <p className="text-sm text-muted-foreground">
            Configuration management features will be implemented in a future
            phase.
          </p>
        </div>
      </div>
    </div>
  );
}

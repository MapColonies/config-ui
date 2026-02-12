import { createFileRoute } from "@tanstack/react-router";
import { WizardShell } from "@/components/wizard/WizardShell";

export type WizardSearch = {
  mode?: "create" | "edit" | "rollback";
  configName?: string;
  schemaId?: string;
  targetVersion?: number;
  fromVersion?: number;
};

export const Route = createFileRoute("/wizard")({
  component: WizardShell,
  validateSearch: (search: Record<string, unknown>): WizardSearch => {
    return {
      mode: (search.mode as "create" | "edit" | "rollback" | undefined) || "create",
      configName: search.configName as string | undefined,
      schemaId: search.schemaId as string | undefined,
      targetVersion: search.targetVersion ? Number(search.targetVersion) : undefined,
      fromVersion: search.fromVersion ? Number(search.fromVersion) : undefined,
    };
  },
});

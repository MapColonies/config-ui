import type { NavigateOptions } from "@tanstack/react-router";
import type { WizardSearch } from "@/routes/wizard";

type WizardMode = "create" | "edit" | "rollback";

interface WizardInitData {
  mode: WizardMode;
  configName?: string;
  schemaId?: string;
  targetVersion?: number;
  fromVersion?: number;
}

/**
 * Prepares wizard navigation with search params
 */
export function prepareWizardNavigation(data: WizardInitData): NavigateOptions {
  const search: WizardSearch = {
    mode: data.mode,
    configName: data.configName,
    schemaId: data.schemaId,
    targetVersion: data.targetVersion,
    fromVersion: data.fromVersion,
  };

  return { to: "/wizard", search };
}

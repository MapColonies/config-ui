import { useNavigate } from "@tanstack/react-router";
import { prepareWizardNavigation } from "@/lib/wizard-navigation";

/**
 * Hook providing actions for config management (create version, rollback)
 */
export function useConfigActions() {
  const navigate = useNavigate();

  const createNewVersion = (configName: string, schemaId: string) => {
    navigate(
      prepareWizardNavigation({
        mode: "edit",
        configName,
        schemaId,
      }),
    );
  };

  const rollback = (
    configName: string,
    schemaId: string,
    version: number,
  ) => {
    navigate(
      prepareWizardNavigation({
        mode: "rollback",
        configName,
        schemaId,
        targetVersion: version,
      }),
    );
  };

  return { createNewVersion, rollback };
}

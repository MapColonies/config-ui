import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { useWizardStore } from "@/stores/wizardStore";
import { $api, api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const configNameSchema = v.object({
  configName: v.pipe(
    v.string(),
    v.nonEmpty("Config name is required"),
    v.regex(
      /^([a-z0-9]+(-[a-z0-9]+)*)$/,
      "Must be lowercase alphanumeric with hyphens",
    ),
    v.maxLength(50, "Config name must be 50 characters or less"),
  ),
});

type ConfigNameForm = v.InferOutput<typeof configNameSchema>;

/**
 * DefineIdentity - Step 2 of wizard
 * Config name input with async validation for conflicts
 */
export function DefineIdentity() {
  const {
    schemaId,
    configName,
    setConfigName,
    setStepValid,
    initializeForEdit,
  } = useWizardStore();
  const navigate = useNavigate();
  const [validationState, setValidationState] = useState<
    "idle" | "checking" | "conflict-exists" | "valid"
  >("idle");
  const [conflictMessage, setConflictMessage] = useState<string>("");
  const [existingConfigData, setExistingConfigData] = useState<{
    configName: string;
    schemaId: string;
  } | null>(null);

  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<ConfigNameForm>({
    resolver: valibotResolver(configNameSchema),
    mode: "onChange",
    defaultValues: {
      configName: configName || "",
    },
  });

  const configNameValue = watch("configName");
  const [debouncedConfigName] = useDebounce(configNameValue, 500);

  // Query for existing configs with the same name
  const { data: existingConfigs, isFetching } = $api.useQuery(
    "get",
    "/config",
    {
      params: {
        query: {
          config_name: debouncedConfigName,
        },
      },
    },
    {
      enabled: !!debouncedConfigName && isValid,
    },
  );

  // Check for conflicts
  useEffect(() => {
    if (!debouncedConfigName || !isValid || !schemaId) {
      setValidationState("idle");
      return;
    }

    if (isFetching) {
      setValidationState("checking");
      return;
    }

    if (
      !existingConfigs ||
      !existingConfigs.configs ||
      existingConfigs.configs.length === 0
    ) {
      setValidationState("valid");
      setConflictMessage("");
      setExistingConfigData(null);
      return;
    }

    // Config with this name already exists
    const existingConfig = existingConfigs.configs[0];
    setExistingConfigData({
      configName: existingConfig.configName,
      schemaId: existingConfig.schemaId,
    });
    setValidationState("conflict-exists");
    setConflictMessage(
      `A config named "${debouncedConfigName}" already exists. To create a new version, use the "Create New Version" button from the config inspector.`,
    );
  }, [debouncedConfigName, existingConfigs, isFetching, isValid, schemaId]);

  // Fetch existing config content when creating a new version (same schema + name)
  // NOTE: This is now removed since we block creating new versions from wizard
  // Users should use "Create New Version" from config inspector instead

  // Update step validity based on validation state and form validity
  useEffect(() => {
    const isStepValid = isValid && validationState === "valid";
    setStepValid(2, isStepValid);
    // Also update store config name when valid
    if (isStepValid && configNameValue) {
      setConfigName(configNameValue);
    }
  }, [isValid, validationState, configNameValue, setStepValid, setConfigName]);

  const handleGoToConfig = () => {
    if (existingConfigData) {
      navigate({
        to: "/config/$name/$version",
        params: {
          name: existingConfigData.configName,
          version: "latest",
        },
        search: {
          schemaId: existingConfigData.schemaId,
        },
      });
    }
  };

  const handleCreateNewVersion = async () => {
    if (existingConfigData) {
      // Fetch the latest version of the config
      const { data, error } = await api.GET("/config/{name}/{version}", {
        params: {
          path: {
            name: existingConfigData.configName,
            version: "latest",
          },
          query: {
            schemaId: existingConfigData.schemaId,
          },
        },
      });

      if (!error && data) {
        const content = JSON.stringify(data.config, null, 2);

        // Initialize the wizard for edit mode directly
        initializeForEdit(
          existingConfigData.configName,
          existingConfigData.schemaId,
          content,
        );
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Choose a unique name for your configuration. This will identify your
            config across all versions.
          </p>
          <p className="text-xs text-muted-foreground">
            Selected schema:{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {schemaId}
            </code>
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="configName" className="text-sm font-medium">
            Config Name
          </label>
          <Input
            id="configName"
            placeholder="my-app-config"
            {...register("configName")}
            className={errors.configName ? "border-destructive" : ""}
          />
          {errors.configName && (
            <p className="text-sm text-destructive">
              {errors.configName.message}
            </p>
          )}

          <div className="min-h-[60px]">
            {validationState === "checking" && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
                <p>Checking for conflicts...</p>
              </div>
            )}

            {validationState === "conflict-exists" && (
              <div className="border border-destructive rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{conflictMessage}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateNewVersion}
                    variant="default"
                    size="sm"
                  >
                    Create New Version
                  </Button>
                  <Button onClick={handleGoToConfig} variant="outline" size="sm">
                    Go to Existing Config
                  </Button>
                </div>
              </div>
            )}

            {validationState === "valid" && (
              <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-500">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Config name is available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

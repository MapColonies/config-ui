import { useState } from "react";
import { ReadOnlyMonacoEditor } from "@/components/ReadOnlyMonacoEditor";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type ViewMode = "raw" | "resolved" | "defaults";

interface ConfigCodeViewerProps {
  rawConfig: object;
  resolvedConfig: object;
  configWithDefaults: object;
}

export function ConfigCodeViewer({
  rawConfig,
  resolvedConfig,
  configWithDefaults,
}: ConfigCodeViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("defaults");

  const getContent = () => {
    switch (viewMode) {
      case "raw":
        return rawConfig;
      case "resolved":
        return resolvedConfig;
      case "defaults":
        return configWithDefaults;
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case "raw":
        return "Viewing raw config with $refs intact (as stored)";
      case "resolved":
        return "Viewing config with all $refs dereferenced";
      case "defaults":
        return "Viewing config with $refs resolved and schema defaults applied (actual runtime values)";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <RadioGroup
          value={viewMode}
          onValueChange={(value: string) => setViewMode(value as ViewMode)}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="raw" id="raw" />
            <Label htmlFor="raw" className="cursor-pointer font-normal">
              Raw (with $refs)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="resolved" id="resolved" />
            <Label htmlFor="resolved" className="cursor-pointer font-normal">
              Resolved ($refs expanded)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="defaults" id="defaults" />
            <Label htmlFor="defaults" className="cursor-pointer font-normal">
              With Defaults (runtime values)
            </Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-muted-foreground">{getDescription()}</p>
      </div>

      <div className="border rounded-lg">
        <ReadOnlyMonacoEditor
          value={JSON.stringify(getContent(), null, 2)}
          language="json"
          height="600px"
        />
      </div>
    </div>
  );
}

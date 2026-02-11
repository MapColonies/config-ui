import { useState } from "react";
import { ReadOnlyMonacoEditor } from "@/components/ReadOnlyMonacoEditor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SchemaCodeViewerProps {
  rawContent: object;
  dereferencedContent: object;
}

export function SchemaCodeViewer({
  rawContent,
  dereferencedContent,
}: SchemaCodeViewerProps) {
  const [showResolved, setShowResolved] = useState(false);

  const content = showResolved ? dereferencedContent : rawContent;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            id="resolve-toggle"
            checked={showResolved}
            onCheckedChange={setShowResolved}
          />
          <Label htmlFor="resolve-toggle" className="cursor-pointer">
            Show Resolved (all $refs inlined)
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {showResolved
            ? "Viewing dereferenced schema"
            : "Viewing raw schema with $refs"}
        </p>
      </div>

      <div className="border rounded-lg">
        <ReadOnlyMonacoEditor
          value={JSON.stringify(content, null, 2)}
          language="json"
          height="600px"
        />
      </div>
    </div>
  );
}

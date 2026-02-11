import { Editor, type EditorProps, type OnMount } from "@monaco-editor/react";
import { Card } from "@/components/ui/card";
import { useCallback } from "react";

/**
 * Props for the ReadOnlyMonacoEditor component.
 * Extends Monaco's EditorProps but enforces read-only configuration.
 */
interface ReadOnlyMonacoEditorProps {
  /** Content to display in the editor */
  value: string;
  /** Language mode for syntax highlighting (e.g., 'json', 'yaml', 'javascript') */
  language: string;
  /** Height of the editor (default: '500px') */
  height?: string;
  /** Loading placeholder to show while Monaco initializes */
  loading?: React.ReactNode;
  /** Additional editor options to override defaults */
  options?: EditorProps["options"];
  /** Whether to auto-format the code on mount (default: false) */
  autoFormat?: boolean;
}

/**
 * ReadOnlyMonacoEditor
 *
 * A read-only Monaco editor component optimized for displaying code/data.
 * Features:
 * - Read-only mode (no editing)
 * - Folding for collapsing sections
 * - Minimap for navigation
 * - Line numbers
 * - Syntax highlighting based on language
 * - No scroll bars beyond last line
 * - Word wrap disabled for clean JSON/YAML display
 *
 * This component uses Monaco bundled into the app (air-gapped mode),
 * configured in src/lib/monaco-config.ts.
 */
export function ReadOnlyMonacoEditor({
  value,
  language,
  height = "500px",
  loading = (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      Loading editor...
    </div>
  ),
  options = {},
  autoFormat = false,
}: ReadOnlyMonacoEditorProps) {
  // Handle editor mount and auto-format if requested
  const handleEditorDidMount: OnMount = useCallback(
    (editor) => {
      if (autoFormat) {
        // Wait a bit for Monaco to fully initialize, then trigger formatter
        setTimeout(() => {
          editor.getAction("editor.action.formatDocument")?.run();
        }, 100);
      }
    },
    [autoFormat],
  );

  return (
    <Card className="overflow-hidden bg-card border">
      <Editor
        height={height}
        language={language}
        value={value}
        loading={loading}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          // Enforce read-only mode
          readOnly: true,
          domReadOnly: true,

          // Visual enhancements
          minimap: { enabled: true },
          lineNumbers: "on",
          folding: true,

          // Disable editing features
          contextmenu: false,
          quickSuggestions: false,

          // Scrolling
          scrollBeyondLastLine: false,

          // Word wrap (disabled for clean JSON/YAML)
          wordWrap: "off",

          // Allow user overrides
          ...options,
        }}
      />
    </Card>
  );
}

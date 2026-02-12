import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { $api, fetchClient } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Editor, type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ValidationErrorPanel } from "./ValidationErrorPanel";
import { ConfigSelectorDialog } from "@/components/ConfigSelectorDialog";
import type { SelectedConfig } from "@/components/ConfigSelector";
import { Button } from "@/components/ui/button";
import { FileInput, WrapText } from "lucide-react";
import {
  validateRefStructure as validateRefStructureNew,
  resolveRefs,
  validateWithSchema,
  type FetchConfigFn,
} from "@/lib/config-resolution";
import { useQueryClient } from "@tanstack/react-query";

// Robust JSON Context Analyzer
// Parses text up to cursor to determine path, current key, and position type.
// This is more resilient than regex or backward scanning because it tracks state.
const analyzeJsonContext = (text: string, cursorOffset: number) => {
  let state: "EXPECT_VALUE" | "EXPECT_KEY" | "EXPECT_COLON" | "EXPECT_COMMA" =
    "EXPECT_VALUE";
  const stack: { type: "object" | "array"; key?: string }[] = [];
  let lastClosedType: "object" | "array" | null = null;
  let currentKey: string | null = null;
  let inString = false;
  let isEscaped = false;
  let stringBuffer = "";

  for (let i = 0; i < cursorOffset; i++) {
    const char = text[i];

    if (inString) {
      if (char === "\\" && !isEscaped) {
        isEscaped = true;
      } else if (char === '"' && !isEscaped) {
        inString = false;
        // End of string
        if (state === "EXPECT_KEY") {
          currentKey = stringBuffer; // Capture the key
          state = "EXPECT_COLON";
        } else if (state === "EXPECT_VALUE") {
          state = "EXPECT_COMMA";
        }
        stringBuffer = "";
      } else {
        isEscaped = false;
        stringBuffer += char;
      }
      continue;
    }

    if (/\s/.test(char)) continue;

    if (char === "{") {
      if (state === "EXPECT_VALUE") {
        stack.push({ type: "object", key: currentKey || undefined });
        state = "EXPECT_KEY";
        currentKey = null;
        lastClosedType = null;
      }
    } else if (char === "}") {
      if (
        state === "EXPECT_COMMA" ||
        state === "EXPECT_VALUE" ||
        state === "EXPECT_KEY"
      ) {
        lastClosedType = "object";
        if (stack.length > 0) {
          stack.pop();
          state = "EXPECT_COMMA";
        } else {
          // Closing root object
          state = "EXPECT_COMMA";
        }
      }
    } else if (char === "[") {
      if (state === "EXPECT_VALUE") {
        stack.push({ type: "array", key: currentKey || undefined });
        state = "EXPECT_VALUE";
        currentKey = null;
        lastClosedType = null;
      }
    } else if (char === "]") {
      if (state === "EXPECT_COMMA" || state === "EXPECT_VALUE") {
        lastClosedType = "array";
        if (stack.length > 0) {
          stack.pop();
          state = "EXPECT_COMMA";
        }
      }
    } else if (char === ":") {
      if (state === "EXPECT_COLON") {
        state = "EXPECT_VALUE";
      }
    } else if (char === ",") {
      if (state === "EXPECT_COMMA" || state === "EXPECT_VALUE") {
        const parent = stack[stack.length - 1];
        if (parent && parent.type === "object") {
          state = "EXPECT_KEY";
          currentKey = null;
        } else if (parent && parent.type === "array") state = "EXPECT_VALUE";
        else if (stack.length === 0) {
          if (lastClosedType === "object") {
            state = "EXPECT_KEY";
            currentKey = null;
          } else if (lastClosedType === "array") {
            state = "EXPECT_VALUE";
          }
        }
      }
    } else if (char === '"') {
      if (state === "EXPECT_KEY" || state === "EXPECT_VALUE") {
        inString = true;
        stringBuffer = "";
      }
    }
  }

  // Construct path from stack
  const path = stack
    .map((item) => item.key)
    .filter((k) => k !== undefined) as string[];

  // Determine position type
  let positionType: "key" | "value" | "unknown" = "unknown";
  if (inString) {
    // If we are inside a string, check what we were expecting
    if (
      state === "EXPECT_KEY" ||
      (state === "EXPECT_COLON" && currentKey === null)
    )
      positionType = "key";
    else if (state === "EXPECT_VALUE") positionType = "value";
  } else {
    if (state === "EXPECT_KEY") positionType = "key";
    else if (state === "EXPECT_VALUE") positionType = "value";
  }

  return {
    path,
    currentKey,
    positionType,
    insideQuotes: inString,
    stringBuffer, // Captures partial text typed inside quotes
  };
};

// Helper to patch schema to allow $ref objects everywhere
// This enables Monaco autocomplete for both schema properties AND $ref objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const patchSchemaForRefs = (schema: any): any => {
  if (!schema || typeof schema !== "object") return schema;

  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map(patchSchemaForRefs);
  }

  // 1. Recursively patch children first (creating new objects to avoid mutation)
  const patched = { ...schema };

  if (patched.properties) {
    patched.properties = Object.fromEntries(
      Object.entries(patched.properties).map(([k, v]) => [
        k,
        patchSchemaForRefs(v),
      ]),
    );
  }

  if (patched.items) {
    patched.items = patchSchemaForRefs(patched.items);
  }

  if (patched.definitions) {
    patched.definitions = Object.fromEntries(
      Object.entries(patched.definitions).map(([k, v]) => [
        k,
        patchSchemaForRefs(v),
      ]),
    );
  }

  if (patched.$defs) {
    patched.$defs = Object.fromEntries(
      Object.entries(patched.$defs).map(([k, v]) => [k, patchSchemaForRefs(v)]),
    );
  }

  // 2. If this is an object definition, wrap it in oneOf to allow $ref
  // We only do this if it's explicitly an object or has properties
  if (patched.type === "object" || patched.properties) {
    return {
      oneOf: [
        patched,
        {
          type: "object",
          properties: {
            $ref: {
              type: "object",
              properties: {
                configName: { type: "string" },
                version: { type: ["string", "number"] },
                schemaId: { type: "string" },
              },
              required: ["configName", "version", "schemaId"],
              additionalProperties: false,
              description: "Reference to another configuration",
            },
          },
          required: ["$ref"],
        },
      ],
    };
  }

  return patched;
};

/**
 * AuthorContent - Step 3 of wizard
 * Intelligent Monaco editor with:
 * - Schema validation
 * - $ref autocomplete and snippets
 * - $ref hover preview
 * - $ref validation
 */
export function AuthorContent() {
  const { schemaId, jsonContent, setJsonContent, setStepValid } =
    useWizardStore();
  const [editorValue, setEditorValue] = useState(jsonContent);
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<editor.IMarker[]>(
    [],
  );
  const [isValidating, setIsValidating] = useState(false);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const queryClient = useQueryClient();
  // Store cursor position to preserve it when dialog opens and editor loses focus
  const savedCursorPositionRef = useRef<{
    lineNumber: number;
    column: number;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Create fetch function for config resolution with React Query caching
  const createFetchConfig = (): FetchConfigFn => {
    return async (ref) => {
      const queryKey = ["config", ref.configName, ref.version, ref.schemaId];

      // Try to get from cache first
      const cached = queryClient.getQueryData(queryKey);
      if (cached) return cached as { config: unknown };

      // Fetch from API
      try {
        const version = ref.version === "latest" || typeof ref.version === "number" ? ref.version : parseInt(ref.version);
        const { data } = await fetchClient.GET("/config/{name}/{version}", {
          params: {
            path: {
              name: ref.configName,
              version: version,
            },
            query: {
              schemaId: ref.schemaId,
              shouldDereference: false, // Get unresolved to resolve ourselves
            },
          },
        });

        if (data) {
          const result = { config: data.config };
          queryClient.setQueryData(queryKey, result);
          return result;
        }

        return null;
      } catch (error) {
        console.error(`Failed to fetch ref ${ref.configName}@${ref.version}:`, error);
        return null;
      }
    };
  };

  // Handler to save cursor position when dialog opens
  const handleDialogOpenChange = (open: boolean) => {
    if (open && editorRef.current) {
      // Save cursor position before opening dialog
      const position = editorRef.current.getPosition();
      if (position) {
        savedCursorPositionRef.current = {
          lineNumber: position.lineNumber,
          column: position.column,
        };
      }
    }
    setIsDialogOpen(open);
  };

  // Handler for inserting existing config content at cursor position
  const handleInsertConfig = async (selectedConfig: SelectedConfig) => {
    console.log("[Insert] Starting insert with config:", selectedConfig);
    console.log(
      "[Insert] Editor ref:",
      !!editorRef.current,
      "Monaco ref:",
      !!monacoRef.current,
    );

    if (!editorRef.current || !monacoRef.current) {
      console.error("[Insert] Editor or Monaco not ready");
      return;
    }

    try {
      // Fetch the config content using type-safe API client
      const { data, error } = await fetchClient.GET("/config", {
        params: {
          query: {
            schema_id: selectedConfig.schemaId,
            config_name: selectedConfig.configName,
            version: selectedConfig.version,
          },
        },
      });

      if (error || !data) {
        console.error("Failed to fetch config:", error);
        return;
      }

      console.log("[Insert] Fetched data:", data);

      if (!data.configs || data.configs.length === 0) {
        console.error("Config not found");
        return;
      }

      const config = data.configs[0];
      const contentToInsert = config.config;

      console.log("[Insert] Content to insert:", contentToInsert);

      if (!contentToInsert || typeof contentToInsert !== "object") {
        console.error("Invalid config content");
        return;
      }

      // Get current editor state
      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) {
        console.error("[Insert] No model found");
        return;
      }

      // Use saved cursor position (from before dialog opened) or current position as fallback
      const position = savedCursorPositionRef.current || editor.getPosition();
      console.log("[Insert] Using position:", position);

      if (!position) {
        console.error("[Insert] No position available");
        return;
      }

      // Convert content to formatted JSON string
      const jsonString = JSON.stringify(contentToInsert, null, 2);
      console.log("[Insert] JSON string length:", jsonString.length);

      // Get Monaco instance for Range constructor
      const monaco = monacoRef.current;

      // Insert at cursor position using executeEdits (preserves undo stack)
      console.log("[Insert] Inserting at position:", position);
      editor.executeEdits("insert-config", [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column,
          ),
          text: jsonString,
          forceMoveMarkers: true,
        },
      ]);

      // Move cursor to end of inserted content
      const lines = jsonString.split("\n");
      const lastLineLength = lines[lines.length - 1].length;
      const newPosition = {
        lineNumber: position.lineNumber + lines.length - 1,
        column:
          lines.length === 1
            ? position.column + lastLineLength
            : lastLineLength + 1,
      };

      console.log("[Insert] New cursor position:", newPosition);

      // Set cursor position and format
      editor.setPosition(newPosition);
      editor.focus();

      // Format the document
      editor
        .getAction("editor.action.formatDocument")
        ?.run()
        .catch((e) => console.error("Format error:", e));

      console.log("[Insert] Insert complete!");
    } catch (error) {
      console.error("Error inserting config:", error);
    }
  };

  // Handler for formatting the editor content
  const handleFormatClick = () => {
    if (!editorRef.current) {
      console.error("[Format] Editor not ready");
      return;
    }

    try {
      console.log("[Format] Triggering format document action");
      editorRef.current
        .getAction("editor.action.formatDocument")
        ?.run()
        .then(() => {
          console.log("[Format] Format complete");
          editorRef.current?.focus();
        })
        .catch((e) => {
          console.error("[Format] Format error:", e);
        });
    } catch (error) {
      console.error("[Format] Error formatting:", error);
    }
  };

  // Fetch schema for validation
  const { data: schemaData, isLoading: isLoadingSchema } = $api.useQuery(
    "get",
    "/schema",
    {
      params: {
        query: {
          id: schemaId || "",
          shouldDereference: true,
        },
      },
    },
    {
      enabled: !!schemaId,
    },
  );

  // Fetch all config names for autocomplete
  const { data: allConfigs } = $api.useQuery("get", "/config", {
    params: {
      query: {
        limit: 100,
      },
    },
  });

  // Fetch schema tree for schemaId autocomplete
  const { data: schemaTree } = $api.useQuery("get", "/schema/tree");

  useEffect(() => {
    if (
      !monacoRef.current ||
      !editorRef.current ||
      !schemaData ||
      !schemaId ||
      !editorLoaded
    ) {
      return;
    }

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Configure Monaco with patched schema for autocomplete
    // The patched schema allows Monaco to suggest both:
    // 1. Regular schema properties (db, telemetry, etc.)
    // 2. $ref objects with {configName, version, schemaId}
    const model = editor.getModel();
    if (!model) return;

    // Patch schema to enable $ref autocomplete
    // This wraps all object types in oneOf to allow either schema properties OR $ref
    const patchedSchema = patchSchemaForRefs(schemaData);

    // Note: We don't provide schema to Monaco to avoid duplicate autocomplete suggestions
    // Our custom completion provider (registerRefCompletionProvider) handles all autocomplete
    // Monaco only provides JSON syntax validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true, // Keep JSON syntax validation only
      schemas: [], // No schema = no built-in schema-based autocomplete
    });

    // Custom validation: resolve $refs then validate against original schema
    const validateResolvedConfig = async () => {
      const value = model.getValue();
      const customMarkers: editor.IMarkerData[] = [];
      
      setIsValidating(true);
      
      try {
        const parsed = JSON.parse(value);

        // Step 1: Validate $ref structure
        const structureErrors = validateRefStructureNew(parsed);
        for (const err of structureErrors) {
          customMarkers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 100,
            message: `${err.message} at ${err.path}`,
          });
        }

        // Step 2 & 3: Resolve refs and validate against original schema
        if (structureErrors.length === 0 && schemaData) {
          try {
            const fetchConfig = createFetchConfig();
            const { resolved, errors: resolutionErrors } = await resolveRefs(parsed, fetchConfig);
            
            // Add resolution errors
            for (const err of resolutionErrors) {
              customMarkers.push({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 100,
                message: `$ref resolution: ${err.message}${err.path ? ` at ${err.path}` : ""}`,
              });
            }

            // Only validate against schema if resolution succeeded
            if (resolutionErrors.length === 0) {
              const schemaErrors = await validateWithSchema(resolved, schemaData);
              
              // Add schema validation errors
              for (const err of schemaErrors) {
                customMarkers.push({
                  severity: monaco.MarkerSeverity.Error,
                  startLineNumber: 1,
                  startColumn: 1,
                  endLineNumber: 1,
                  endColumn: 100,
                  message: `[Resolved config] ${err.message} at ${err.path}`,
                });
              }
            }
          } catch (error) {
            customMarkers.push({
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 100,
              message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        }
      } catch {
        // JSON parse error - will be caught by Monaco's built-in validation
      } finally {
        setIsValidating(false);
      }

      // Set our custom validation markers
      // Monaco doesn't have schema configured, so it won't generate schema validation markers
      monaco.editor.setModelMarkers(
        model,
        "custom-ref-validation",
        customMarkers,
      );
    };

    // Debounce ref validation
    const timeoutId = setTimeout(validateResolvedConfig, 1000);

    // Listen for validation marker changes
    const checkValidation = () => {
      const markers = monaco.editor.getModelMarkers({ resource: model.uri });

      // Filter for errors and warnings (Monaco reports schema validation as warnings)
      const errors = markers.filter(
        (m) => m.severity === monaco.MarkerSeverity.Error,
      );
      const warnings = markers.filter(
        (m) => m.severity === monaco.MarkerSeverity.Warning,
      );
      const issuesCount = errors.length + warnings.length;

      // Show both errors and warnings in the validation panel
      setValidationErrors([...errors, ...warnings]);

      // Mark step as invalid if validation is in progress OR there are errors/warnings OR JSON is invalid
      // Only mark as valid when validation completes successfully with no issues
      if (isValidating) {
        setStepValid(3, false);
      } else if (isJsonValid && issuesCount === 0) {
        setStepValid(3, true);
      } else {
        setStepValid(3, false);
      }
    };

    // Check validation immediately
    checkValidation();

    // Listen for marker changes (validation updates)
    const markerDisposable = monaco.editor.onDidChangeMarkers(() => {
      checkValidation();
    });

    // Register completion provider with patched schema
    const completionDisposable = registerRefCompletionProvider(
      monaco,
      editor,
      allConfigs,
      schemaTree,
      patchedSchema, // Use patched schema for $ref autocomplete
    );

    // Register hover provider
    const hoverDisposable = registerRefHoverProvider(monaco);

    return () => {
      clearTimeout(timeoutId);
      markerDisposable.dispose();
      completionDisposable.dispose();
      hoverDisposable.dispose();
      monaco.editor.setModelMarkers(model, "custom-ref-validation", []);
    };
  }, [
    schemaData,
    schemaId,
    allConfigs,
    schemaTree,
    editorLoaded,
    isJsonValid,
    isValidating, // Re-check validation when validation state changes
    setStepValid,
    editorValue, // Re-run validation when editor value changes
  ]);

  // Sync editor content to wizard store whenever it changes
  useEffect(() => {
    setJsonContent(editorValue);
  }, [editorValue, setJsonContent]);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorLoaded(true);
  };

  const handleErrorClick = (lineNumber: number) => {
    if (!editorRef.current) return;
    editorRef.current.revealLineInCenter(lineNumber);
    editorRef.current.setPosition({ lineNumber, column: 1 });
    editorRef.current.focus();
  };

  if (isLoadingSchema) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm text-muted-foreground mb-4 shrink-0">
        Author your configuration JSON. The editor provides validation,
        autocomplete, and hover previews for{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">$ref</code>{" "}
        objects.
      </p>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Editor with floating Insert Config button */}
        <div className="flex-1 border rounded-lg overflow-hidden relative min-w-0">
          {/* Action Buttons - positioned in top-right corner */}
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            {/* Format Button */}
            <Button
              variant="outline"
              size="sm"
              className="shadow-md bg-background"
              disabled={!editorRef.current}
              onClick={handleFormatClick}
            >
              <WrapText className="w-4 h-4 mr-2" />
              Format
            </Button>

            {/* Insert Config Button */}
            <ConfigSelectorDialog
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-md bg-background"
                  disabled={!editorRef.current}
                >
                  <FileInput className="w-4 h-4 mr-2" />
                  Insert Config
                </Button>
              }
              title="Insert Existing Config"
              description="Select a config to insert its content at your cursor position in the editor."
              onSelect={handleInsertConfig}
              confirmLabel="Insert at Cursor"
              selectorLabel="Select config to insert"
              open={isDialogOpen}
              onOpenChange={handleDialogOpenChange}
            />
          </div>

          {/* Monaco Editor */}
          <Editor
            height="100%"
            language="json"
            value={editorValue}
            onChange={(value) => {
              setEditorValue(value || "{}");
              // Validate JSON syntax only
              try {
                JSON.parse(value || "{}");
                setIsJsonValid(true);
                // Note: Step validity is determined by Monaco validation markers
                // in the useEffect above, not here
              } catch {
                setIsJsonValid(false);
                setStepValid(3, false); // Invalid JSON syntax always fails
              }
            }}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              folding: true,
              scrollBeyondLastLine: false,
              wordWrap: "off",
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              quickSuggestions: { other: true, comments: false, strings: true },
              suggestOnTriggerCharacters: true,
              fixedOverflowWidgets: true,
              hover: { enabled: true },
            }}
          />
        </div>

        {/* Validation Panel - Side by side on large screens */}
        <div className="w-full lg:w-[400px] lg:h-full shrink-0">
          <ValidationErrorPanel
            errors={validationErrors}
            onErrorClick={handleErrorClick}
            isValidating={isValidating}
          />
        </div>
      </div>
    </div>
  );
}

type SchemaTreeNode = {
  name: string;
  id?: string;
  children?: SchemaTreeNode[];
};

/**
 * Register completion provider for $ref objects
 * Provides snippets and autocomplete for configName, version, and schemaId
 */
function registerRefCompletionProvider(
  monaco: Monaco,
  _editor: editor.IStandaloneCodeEditor,
  allConfigs:
    | {
        configs?: Array<{
          configName: string;
          schemaId: string;
          version: number;
        }>;
      }
    | undefined,
  schemaTree: SchemaTreeNode[] | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemaData: any,
) {
  // Helper to flatten schema tree for suggestions
  const flattenSchemaTree = (
    nodes: SchemaTreeNode[],
    ids: string[] = [],
  ): string[] => {
    nodes.forEach((node) => {
      if (node.id) ids.push(node.id);
      if (node.children) flattenSchemaTree(node.children, ids);
    });
    return ids;
  };

  const schemaIds = schemaTree ? flattenSchemaTree(schemaTree) : [];
  const uniqueVersions =
    allConfigs?.configs
      ?.map((c) => c.version)
      .filter((v, i, arr) => arr.indexOf(v) === i) || [];

  return monaco.languages.registerCompletionItemProvider("json", {
    triggerCharacters: ['"', ":", "{", ",", " "],
    provideCompletionItems: (model, position) => {
      const offset = model.getOffsetAt(position);
      const text = model.getValue();

      // Use our robust analyzer
      const { path, currentKey, positionType, insideQuotes } =
        analyzeJsonContext(text, offset);

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column,
      };

      // Adjust range if inside quotes to replace the content
      if (insideQuotes) {
        // We need to find the start of the string
        let startOffset = offset;
        while (startOffset > 0 && text[startOffset - 1] !== '"') {
          startOffset--;
        }
        const startPos = model.getPositionAt(startOffset);
        range.startColumn = startPos.column;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suggestions: any[] = [];

      if (positionType === "key") {
        let currentSchema = schemaData;

        // Traverse schema based on path
        for (const key of path) {
          if (!currentSchema) break;

          // Unwrap oneOf if present (from our $ref patching)
          if (currentSchema.oneOf && Array.isArray(currentSchema.oneOf)) {
            // Use the first schema in oneOf (the original schema, not the $ref schema)
            currentSchema = currentSchema.oneOf[0];
          }

          if (currentSchema.type === "array" && currentSchema.items) {
            currentSchema = currentSchema.items;
          }

          if (currentSchema.properties && currentSchema.properties[key]) {
            currentSchema = currentSchema.properties[key];
          } else {
            // Path doesn't match schema
            currentSchema = null;
          }
        }

        // Handle array items at the end of path
        if (
          currentSchema &&
          currentSchema.type === "array" &&
          currentSchema.items
        ) {
          currentSchema = currentSchema.items;
        }

        // Unwrap oneOf at the current position
        if (
          currentSchema &&
          currentSchema.oneOf &&
          Array.isArray(currentSchema.oneOf)
        ) {
          currentSchema = currentSchema.oneOf[0];
        }

        // Special case: If we are inside a $ref object, suggest its properties
        if (path.length > 0 && path[path.length - 1] === "$ref") {
          ["configName", "version", "schemaId"].forEach((prop) => {
            const insertText = insideQuotes ? `${prop}": ` : `"${prop}": `;
            suggestions.push({
              label: prop,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText,
              documentation: `Reference property: ${prop}`,
              range,
              filterText: insideQuotes ? prop : undefined, // Only filter if inside quotes
            });
          });
        }

        // 1. Suggest Schema Properties
        if (currentSchema && currentSchema.properties) {
          Object.entries(currentSchema.properties).forEach(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([key, value]: [string, any]) => {
              // If we are inside quotes, don't add quotes to the insert text
              const insertText = insideQuotes ? `${key}": ` : `"${key}": `;

              suggestions.push({
                label: key,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: insertText,
                documentation: value.description || `Type: ${value.type}`,
                detail: value.type,
                range,
                filterText: insideQuotes ? key : undefined, // Only filter if inside quotes
              });
            },
          );
        }

        // 2. Suggest $ref snippet
        const refInsertText = insideQuotes
          ? [
              `$ref": {`,
              `  "configName": "\${1:config-name}",`,
              `  "version": "\${2|latest,${uniqueVersions.join(",")}|}",`,
              `  "schemaId": "\${3|${schemaIds.join(",")}|}"`,
              "}",
            ].join("\n")
          : [
              `"$ref": {`,
              `  "configName": "\${1:config-name}",`,
              `  "version": "\${2|latest,${uniqueVersions.join(",")}|}",`,
              `  "schemaId": "\${3|${schemaIds.join(",")}|}"`,
              "}",
            ].join("\n");

        suggestions.push({
          label: "$ref",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: refInsertText,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Reference to another config",
          detail: "Insert Config Reference",
          range,
          filterText: insideQuotes ? "$ref" : undefined,
        });
      }

      if (positionType === "value") {
        // 1. Suggest $ref object as a value
        suggestions.push({
          label: "Insert $ref",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "{",
            '  "$ref": {',
            `    "configName": "\${1:config-name}",`,
            `    "version": "\${2|latest,${uniqueVersions.join(",")}|}",`,
            `    "schemaId": "\${3|${schemaIds.join(",")}|}"`,
            "  }",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Insert a reference to another config object",
          detail: "Insert $ref Object",
          range,
        });

        // 2. Contextual autocomplete for $ref fields
        if (currentKey) {
          if (currentKey === "configName") {
            allConfigs?.configs?.forEach((config) => {
              suggestions.push({
                label: config.configName,
                kind: monaco.languages.CompletionItemKind.Value,
                insertText: insideQuotes
                  ? config.configName
                  : `"${config.configName}"`,
                documentation: `Schema: ${config.schemaId}`,
                range,
                filterText: insideQuotes ? config.configName : undefined,
              });
            });
          }

          if (currentKey === "version") {
            suggestions.push({
              label: "latest",
              kind: monaco.languages.CompletionItemKind.Value,
              insertText: insideQuotes ? "latest" : '"latest"',
              range,
              filterText: insideQuotes ? "latest" : undefined,
            });
            uniqueVersions.forEach((v) => {
              suggestions.push({
                label: String(v),
                kind: monaco.languages.CompletionItemKind.Value,
                insertText: insideQuotes ? String(v) : `"${v}"`,
                range,
                filterText: insideQuotes ? String(v) : undefined,
              });
            });
          }

          if (currentKey === "schemaId") {
            schemaIds.forEach((id) => {
              suggestions.push({
                label: id,
                kind: monaco.languages.CompletionItemKind.Value,
                insertText: insideQuotes ? id : `"${id}"`,
                range,
                filterText: insideQuotes ? id : undefined,
              });
            });
          }
        }
      }

      console.log(`[Completion] Returning ${suggestions.length} suggestions`);
      return { suggestions, incomplete: true };
    },
  });
}

/**
 * Register hover provider for $ref objects
 * Fetches and displays config metadata when hovering over a $ref
 */
function registerRefHoverProvider(
  monaco: Monaco,
  // _editor: editor.IStandaloneCodeEditor,
) {
  return monaco.languages.registerHoverProvider("json", {
    provideHover: async (model, position) => {
      const offset = model.getOffsetAt(position);
      const text = model.getValue();

      // Use analyzer to check if we are inside a $ref object
      const { path } = analyzeJsonContext(text, offset);

      // Check if we are inside a $ref object (path ends with $ref or contains it?)
      // If structure is { "$ref": { ... } }, path inside is ['$ref'].
      const isInsideRef = path.length > 0 && path[path.length - 1] === "$ref";

      if (!isInsideRef) return null;

      // Find the opening brace of the current object.
      let braceDepth = 0;
      let objectStart = -1;
      for (let i = offset; i >= 0; i--) {
        if (text[i] === "}") braceDepth++;
        else if (text[i] === "{") {
          if (braceDepth === 0) {
            objectStart = i;
            break;
          }
          braceDepth--;
        }
      }

      if (objectStart === -1) return null;

      // Find closing brace
      braceDepth = 0;
      let objectEnd = -1;
      for (let i = offset; i < text.length; i++) {
        if (text[i] === "{") braceDepth++;
        else if (text[i] === "}") {
          if (braceDepth === 0) {
            objectEnd = i;
            break;
          }
          braceDepth--;
        }
      }

      if (objectEnd === -1) return null;

      const objectStr = text.substring(objectStart, objectEnd + 1);

      try {
        const match = objectStr.match(/"configName"\s*:\s*"([^"]+)"/);
        if (!match) return null;

        const configName = match[1];

        // Fetch config metadata using type-safe API client
        const { data, error } = await fetchClient.GET("/config", {
          params: {
            query: {
              config_name: configName,
              limit: 1,
            },
          },
        });

        if (error || !data || !data.configs || data.configs.length === 0) {
          return null;
        }

        const config = data.configs[0];
        return {
          contents: [
            {
              value: [
                `**Config Reference**`,
                "",
                `**Name:** ${config.configName}`,
                `**Version:** ${config.version} ${config.isLatest ? "(latest)" : ""}`,
                `**Schema:** ${config.schemaId}`,
                `**Created:** ${new Date(config.createdAt).toLocaleString()}`,
                `**Created By:** ${config.createdBy}`,
              ].join("\n"),
            },
          ],
        };
      } catch {
        return null;
      }
    },
  });
}

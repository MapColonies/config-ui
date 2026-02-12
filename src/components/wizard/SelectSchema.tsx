import { useState, useEffect } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { $api } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, FileJson } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SchemaTreeNode = {
  name: string;
  id?: string;
  children?: SchemaTreeNode[];
};

/**
 * SelectSchema - Step 1 of wizard
 * Displays hierarchical schema tree for selection
 */
export function SelectSchema() {
  const { schemaId, jsonContent, setSchemaId, setJsonContent, setStepValid, nextStep } = useWizardStore();
  const [selectedId, setSelectedId] = useState<string | null>(schemaId);
  const [filterText, setFilterText] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [pendingSchemaId, setPendingSchemaId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(filterText);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterText]);

  const { data, isLoading, error } = $api.useQuery("get", "/schema/tree");

  const handleSelect = (newSchemaId: string) => {
    // Check if schema is changing and content exists (not empty object)
    const isSchemaChanging = schemaId && schemaId !== newSchemaId;
    const hasContent = jsonContent.trim() !== "{}" && jsonContent.trim() !== "";
    
    if (isSchemaChanging && hasContent) {
      // Show confirmation dialog
      setPendingSchemaId(newSchemaId);
      setShowConfirmDialog(true);
    } else {
      // No confirmation needed - proceed directly
      proceedWithSchemaChange(newSchemaId);
    }
  };

  const proceedWithSchemaChange = (newSchemaId: string) => {
    const isSchemaChanging = schemaId && schemaId !== newSchemaId;
    
    setSelectedId(newSchemaId);
    setSchemaId(newSchemaId);
    
    // Reset content only if schema actually changed
    if (isSchemaChanging) {
      setJsonContent("{}");
    }
    
    setStepValid(1, true);
    nextStep();
  };

  const handleConfirmSchemaChange = () => {
    if (pendingSchemaId) {
      proceedWithSchemaChange(pendingSchemaId);
      setPendingSchemaId(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelSchemaChange = () => {
    setPendingSchemaId(null);
    setShowConfirmDialog(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load schema tree: {error.message}
      </div>
    );
  }

  const matchesFilterRoot = (node: SchemaTreeNode, filter: string): boolean => {
    const checkNode = (
      n: SchemaTreeNode,
      currentPath: string[] = [],
    ): boolean => {
      const nodePath = [...currentPath, n.name].join(" / ").toLowerCase();
      const filterLower = filter.toLowerCase();

      if (nodePath.includes(filterLower)) return true;
      if (n.children) {
        return n.children.some((child) =>
          checkNode(child, [...currentPath, n.name]),
        );
      }
      return false;
    };
    return checkNode(node);
  };

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm text-muted-foreground mb-4 flex-shrink-0">
        Select a schema to define the structure of your configuration.
      </p>

      <div className="space-y-2 flex-shrink-0">
        <Input
          placeholder="Filter schemas..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-md"
        />
        <div className="h-5">
          {debouncedFilter && (
            <p className="text-sm text-muted-foreground">
              {(() => {
                const count =
                  data?.filter((node) =>
                    matchesFilterRoot(node, debouncedFilter),
                  ).length || 0;
                return count === 0
                  ? "No schemas match your filter"
                  : `${count} schema${count === 1 ? "" : "s"} found`;
              })()}
            </p>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4 flex-1 overflow-y-auto mt-4 min-h-0">
        {data?.map((node) => (
          <SchemaTreeItem
            key={node.name}
            node={node}
            onSelect={handleSelect}
            selectedId={selectedId}
            filterText={debouncedFilter}
          />
        ))}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Schema?</DialogTitle>
            <DialogDescription>
              Changing the schema will reset your authored content. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSchemaChange}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSchemaChange}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SchemaTreeItem({
  node,
  onSelect,
  selectedId,
  filterText = "",
  depth = 0,
  parentPath = [],
}: {
  node: SchemaTreeNode;
  onSelect: (id: string) => void;
  selectedId: string | null;
  filterText?: string;
  depth?: number;
  parentPath?: string[];
}) {
  const isLeaf = !!node.id;
  
  // Check if this node or any of its children contain the selected schema
  const containsSelected = (n: SchemaTreeNode): boolean => {
    if (n.id === selectedId) return true;
    if (n.children) {
      return n.children.some((child) => containsSelected(child));
    }
    return false;
  };

  // Auto-open if this node contains the selected schema OR if at root level
  const [isOpen, setIsOpen] = useState(depth === 0 || containsSelected(node));

  // Check if this node or any of its children match the filter
  const matchesFilter = (
    n: SchemaTreeNode,
    currentPath: string[] = [],
  ): boolean => {
    const nodePath = [...currentPath, n.name].join(" / ").toLowerCase();
    const filter = filterText.toLowerCase();

    if (nodePath.includes(filter)) return true;
    if (n.children) {
      const nextPath = [...currentPath, n.name];
      return n.children.some((child) => matchesFilter(child, nextPath));
    }
    return false;
  };

  // Don't render if doesn't match filter
  if (filterText && !matchesFilter(node, parentPath)) {
    return null;
  }

  // Auto-expand when filtering OR when contains selected
  const shouldBeOpen = filterText ? true : isOpen;
  const isSelected = selectedId === node.id;

  if (isLeaf) {
    return (
      <Button
        variant={isSelected ? "default" : "ghost"}
        className="w-full justify-start"
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onClick={() => onSelect(node.id!)}
      >
        <FileJson className="w-4 h-4 mr-2" />
        {node.name}
      </Button>
    );
  }

  return (
    <Collapsible open={shouldBeOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start font-semibold"
          style={{ paddingLeft: `${depth * 1.5}rem` }}
        >
          {shouldBeOpen ? (
            <ChevronDown className="w-4 h-4 mr-2" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-2" />
          )}
          {node.name}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {node.children?.map((child) => (
          <SchemaTreeItem
            key={child.name}
            node={child}
            onSelect={onSelect}
            selectedId={selectedId}
            filterText={filterText}
            depth={depth + 1}
            parentPath={[...parentPath, node.name]}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

import { useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from "reactflow";
import type { Node, Edge, NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import { Card } from "@/components/ui/card";
import { schemaIdToPath } from "@/lib/schemaUtils";
import { getLayoutedElements, GRAPH_LAYOUT_CONFIG } from "@/lib/graph-utils";
import type { components } from "@/types/api";

type SchemaReference = components["schemas"]["schemaReference"];

interface Dependencies {
  parents: SchemaReference[];
  children: SchemaReference[];
}

interface SchemaGraphProps {
  schemaId: string;
  schemaName: string;
  dependencies: Dependencies;
}

interface SchemaNodeData {
  label: string;
  path: string;
  isCurrent: boolean;
}

const { nodeWidth, nodeHeight } = GRAPH_LAYOUT_CONFIG;

// Custom node component with handles for connections
function SchemaNode({ data }: NodeProps<SchemaNodeData>) {
  return (
    <div
      style={{
        backgroundColor: data.isCurrent ? "#3b82f6" : "#10b981",
        color: "#fff",
        border: data.isCurrent ? "2px solid #2563eb" : "2px solid #059669",
        borderRadius: "8px",
        padding: "12px",
        width: nodeWidth,
        height: nodeHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        cursor: data.isCurrent ? "default" : "pointer",
        gap: "4px",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ fontSize: "14px", fontWeight: "600", lineHeight: "1.2" }}>
        {data.label}
      </div>
      <div
        style={{
          fontSize: "11px",
          opacity: 0.8,
          lineHeight: "1.2",
          fontFamily: "monospace",
        }}
      >
        {data.path}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = {
  schemaNode: SchemaNode,
};

/**
 * Recursively traverse the dependency tree and collect all nodes and edges
 */
function traverseDependencyTree(
  schemas: SchemaReference[],
  sourceId: string | null,
  isChild: boolean,
  nodeMap: Map<string, { name: string; path: string }>,
  edges: Array<{ source: string; target: string }>,
  visited: Set<string> = new Set(),
) {
  schemas.forEach((schema) => {
    // Avoid infinite loops
    if (visited.has(schema.id)) return;
    visited.add(schema.id);

    // Add node
    nodeMap.set(schema.id, {
      name: schema.name,
      path: schemaIdToPath(schema.id),
    });

    // Add edge
    if (sourceId) {
      if (isChild) {
        // Current schema -> child (dependency)
        edges.push({ source: sourceId, target: schema.id });
      } else {
        // Parent -> current schema
        edges.push({ source: schema.id, target: sourceId });
      }
    }

    // Recursively process children
    if (schema.children && schema.children.length > 0) {
      traverseDependencyTree(
        schema.children,
        schema.id,
        true,
        nodeMap,
        edges,
        visited,
      );
    }

    // Recursively process parents
    if (schema.parents && schema.parents.length > 0) {
      traverseDependencyTree(
        schema.parents,
        schema.id,
        false,
        nodeMap,
        edges,
        visited,
      );
    }
  });
}

export function SchemaGraph({
  schemaId,
  schemaName,
  dependencies,
}: SchemaGraphProps) {
  const navigate = useNavigate();

  // Build full dependency graph from tree structure
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodeMap = new Map<string, { name: string; path: string }>();
    const edgeList: Array<{ source: string; target: string }> = [];

    // Add current schema
    nodeMap.set(schemaId, {
      name: schemaName,
      path: schemaIdToPath(schemaId),
    });

    // Traverse children (dependencies)
    if (dependencies.children && dependencies.children.length > 0) {
      traverseDependencyTree(
        dependencies.children,
        schemaId,
        true,
        nodeMap,
        edgeList,
      );
    }

    // Traverse parents (dependents)
    if (dependencies.parents && dependencies.parents.length > 0) {
      traverseDependencyTree(
        dependencies.parents,
        schemaId,
        false,
        nodeMap,
        edgeList,
      );
    }

    // Create React Flow nodes
    const nodes: Node<SchemaNodeData>[] = [];
    nodeMap.forEach((data, id) => {
      nodes.push({
        id,
        data: {
          label: data.name,
          path: data.path,
          isCurrent: id === schemaId,
        },
        position: { x: 0, y: 0 },
        type: "schemaNode",
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });

    // Create React Flow edges (deduplicate)
    const edges: Edge[] = [];
    const seenEdges = new Set<string>();
    edgeList.forEach(({ source, target }) => {
      const edgeId = `${source}-${target}`;
      if (!seenEdges.has(edgeId)) {
        seenEdges.add(edgeId);
        edges.push(createEdge(source, target));
      }
    });

    return getLayoutedElements(nodes, edges);
  }, [schemaId, schemaName, dependencies]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes and edges when schemaId changes (when navigating between schemas)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [schemaId, initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Only navigate if it's not the current schema
      if (!node.data.isCurrent) {
        navigate({
          to: "/schema",
          search: { id: node.id, tab: "graph" },
          replace: false,
        });
      }
    },
    [navigate],
  );

  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  return (
    <Card>
      <div className="border-b px-4 py-3 bg-muted/30">
        <h3 className="font-semibold">Dependency Graph</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {totalNodes === 1
            ? "This schema has no dependencies or dependents"
            : `Full dependency tree: ${totalNodes} schemas, ${totalEdges} dependencies (click to navigate)`}
        </p>
      </div>
      <div className="w-full h-[600px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.5}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls showInteractive={false} />
          {totalNodes > 1 && (
            <Panel
              position="bottom-right"
              className="bg-background/80 backdrop-blur-sm border rounded-lg p-3 m-4"
            >
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600" />
                  <span className="text-foreground">Current Schema</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500 border border-green-600" />
                  <span className="text-foreground">
                    Related Schemas (clickable)
                  </span>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </Card>
  );
}

function createEdge(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    type: "default",
    animated: false,
    style: {
      stroke: "#94a3b8",
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#94a3b8",
    },
  };
}

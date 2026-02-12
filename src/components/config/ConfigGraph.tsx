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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getLayoutedElements, GRAPH_LAYOUT_CONFIG } from "@/lib/graph-utils";
import type { operations } from "@/types/api";

type ConfigFullData =
  operations["getFullConfig"]["responses"]["200"]["content"]["application/json"];
type ConfigReference = ConfigFullData["dependencies"]["children"][0];

interface ConfigGraphProps {
  config: ConfigFullData;
}

interface ConfigNodeData {
  label: string;
  version: string;
  isCurrent: boolean;
  schemaId: string;
  configName?: string;
}

const { nodeWidth, nodeHeight } = GRAPH_LAYOUT_CONFIG;

// Custom node component for configs
function ConfigNode({ data }: NodeProps<ConfigNodeData>) {
  const bgColor = data.isCurrent ? "#22c55e" : "#86efac";
  const borderColor = data.isCurrent ? "#16a34a" : "#22c55e";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            style={{
              backgroundColor: bgColor,
              color: "#fff",
              border: `2px solid ${borderColor}`,
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
                opacity: 0.9,
                lineHeight: "1.2",
              }}
            >
              {data.version}
            </div>
            <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-mono max-w-xs break-all">{data.schemaId}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const nodeTypes = {
  configNode: ConfigNode,
};

/**
 * Recursively build nodes and edges from the dependency tree
 */
function buildNodesAndEdges(
  refs: ConfigReference[],
  nodeMap: Map<string, Node<ConfigNodeData>>,
  edgeList: Edge[],
  parentId: string | null,
  isChildEdge: boolean,
  visited: Set<string> = new Set(),
) {
  refs.forEach((ref) => {
    const refId = `${ref.configName}-${Array.isArray(ref.version) ? ref.version[0] : ref.version}`;
    const version = Array.isArray(ref.version) ? ref.version[0] : ref.version;
    
    // Add node if not already in the map
    if (!nodeMap.has(refId)) {
      nodeMap.set(refId, {
        id: refId,
        data: {
          label: ref.configName,
          version: `v${version}${ref.isLatest ? " (Latest)" : ""}`,
          isCurrent: false,
          schemaId: ref.schemaId,
          configName: ref.configName,
        },
        position: { x: 0, y: 0 },
        type: "configNode",
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }
    
    // Add edge from parent to this node (even if node was already added)
    if (parentId) {
      const edgeId = isChildEdge ? `${parentId}-${refId}` : `${refId}-${parentId}`;
      const source = isChildEdge ? parentId : refId;
      const target = isChildEdge ? refId : parentId;
      
      // Check if this specific edge already exists
      const edgeExists = edgeList.some(e => e.id === edgeId);
      if (!edgeExists) {
        edgeList.push({
          id: edgeId,
          source,
          target,
          type: "default",
          animated: false,
          style: {
            stroke: "#86efac",
            strokeWidth: 2,
            strokeDasharray: isChildEdge ? undefined : "3,3",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#86efac",
          },
        });
      }
    }
    
    // Only recurse if we haven't visited this node yet
    if (!visited.has(refId)) {
      visited.add(refId);
      
      // Recursively process children
      if (ref.children && ref.children.length > 0) {
        buildNodesAndEdges(ref.children, nodeMap, edgeList, refId, true, visited);
      }
      
      // Recursively process parents
      if (ref.parents && ref.parents.length > 0) {
        buildNodesAndEdges(ref.parents, nodeMap, edgeList, refId, false, visited);
      }
    }
  });
}

export function ConfigGraph({ config }: ConfigGraphProps) {
  const navigate = useNavigate();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodeMap = new Map<string, Node<ConfigNodeData>>();
    const edgeList: Edge[] = [];

    // Current config node (center)
    const currentId = `${config.configName}-${config.version}`;
    nodeMap.set(currentId, {
      id: currentId,
      data: {
        label: config.configName,
        version: `v${config.version}${config.isLatest ? " (Latest)" : ""}`,
        isCurrent: true,
        schemaId: config.schemaId,
        configName: config.configName,
      },
      position: { x: 0, y: 0 },
      type: "configNode",
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Build child config nodes and edges (recursively preserving hierarchy)
    if (config.dependencies.children && config.dependencies.children.length > 0) {
      buildNodesAndEdges(
        config.dependencies.children,
        nodeMap,
        edgeList,
        currentId,
        true,
      );
    }

    // Build parent config nodes and edges (recursively preserving hierarchy)
    if (config.dependencies.parents && config.dependencies.parents.length > 0) {
      buildNodesAndEdges(
        config.dependencies.parents,
        nodeMap,
        edgeList,
        currentId,
        false,
      );
    }

    const nodes = Array.from(nodeMap.values());
    return getLayoutedElements(nodes, edgeList);
  }, [config]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [config.configName, config.version, initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!node.data.isCurrent && node.data.configName) {
        const version = node.data.version.replace(/^v/, "").split(" ")[0];
        navigate({
          to: "/config/$name/$version",
          params: {
            name: node.data.configName,
            version,
          },
          search: { schemaId: node.data.schemaId } as never,
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
        <h3 className="font-semibold">Configuration Dependency Graph</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {totalNodes === 1
            ? "This config has no dependencies"
            : `${totalNodes} nodes, ${totalEdges} connections (click to navigate)`}
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
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500 border border-green-600" />
                  <span className="text-foreground">Current Config</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-200 border border-green-400" />
                  <span className="text-foreground">Related Configs (clickable)</span>
                </div>
                <div className="border-t pt-2 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-green-200" />
                    <span className="text-foreground">References</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-8 h-0.5 bg-green-200"
                      style={{ backgroundImage: "repeating-linear-gradient(to right, #86efac 0, #86efac 3px, transparent 3px, transparent 6px)" }}
                    />
                    <span className="text-foreground">Referenced by</span>
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </Card>
  );
}

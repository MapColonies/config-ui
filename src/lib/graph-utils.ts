import dagre from "dagre";
import type { Node, Edge } from "reactflow";

/**
 * Shared graph layout configuration
 */
export const GRAPH_LAYOUT_CONFIG = {
  nodeWidth: 250,
  nodeHeight: 80,
  rankdir: "LR", // Left to right
  nodesep: 100, // Horizontal spacing between nodes
  ranksep: 200, // Vertical spacing between ranks
} as const;

/**
 * Create and configure a dagre graph instance
 */
export function createDagreGraph() {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  return graph;
}

/**
 * Apply dagre layout algorithm to nodes and edges
 * Returns layouted nodes with calculated positions
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  config = GRAPH_LAYOUT_CONFIG,
) {
  const dagreGraph = createDagreGraph();

  dagreGraph.setGraph({
    rankdir: config.rankdir,
    nodesep: config.nodesep,
    ranksep: config.ranksep,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - config.nodeWidth / 2,
        y: nodeWithPosition.y - config.nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CustomNode, CustomNodeData } from "@/features/providers/provide-apps/provide-react-flow/nodes";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface FlowDemoPersistedData {
  nodes?: Node[];
  edges?: Edge[];
}

interface FlowDemoProps {
  saveData: (data: { nodes: Node[]; edges: Edge[] }) => Promise<void>;
  loadData: () => Promise<FlowDemoPersistedData | null>;
}

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: "1",
    type: "custom",
    data: { 
      label: "Input Node",
      color: "#10b981",
      icon: "🚀",
      sequence: "1.0",
    },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    type: "custom",
    data: { 
      label: "Default Node",
      color: "#8b5cf6",
      sequence: "2.0",
    },
    position: { x: 100, y: 125 },
  },
  {
    id: "3",
    type: "custom",
    data: { 
      label: "Output Node",
      color: "#f59e0b",
      icon: "✅",
      sequence: "3.0",
    },
    position: { x: 250, y: 250 },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

const getNextSequence = (nodes: Node<CustomNodeData>[]): string => {
  if (nodes.length === 0) {
    return "1.0";
  }
  
  const sequences = nodes
    .map((node) => {
      const sequence = node.data?.sequence;
      if (!sequence) return 0;
      const num = parseFloat(sequence);
      return isNaN(num) ? 0 : num;
    })
    .filter((v) => v > 0);
  
  if (sequences.length === 0) {
    return "1.0";
  }
  
  const maxSequence = Math.max(...sequences);
  return `${Math.floor(maxSequence) + 1}.0`;
};

export function FlowDemoCanvas({ saveData, loadData }: FlowDemoProps) {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const connectingNodeId = useRef<string | null>(null);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const data = await loadData();
        if (data) {
          if (data.nodes) {
            const nodesWithSequence = data.nodes.map((node, index) => {
              if (!node.data?.sequence) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    sequence: `${index + 1}.0`,
                  },
                };
              }
              return node;
            });
            setNodes(nodesWithSequence);
          }
          if (data.edges) setEdges(data.edges);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadSavedData();
  }, [loadData, setNodes, setEdges]);

  useEffect(() => {
    const autoSave = async () => {
      try {
        await saveData({ nodes, edges });
        console.log("Auto saved successfully");
      } catch (error) {
        console.error("Auto save failed:", error);
      }
    };

    const timeoutId = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, saveData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable);

      if ((event.key === "Delete" || event.key === "Backspace") && !isInputFocused) {
        const selectedNodes = nodes.filter((node) => node.selected);
        if (selectedNodes.length > 0) {
          event.preventDefault();
          const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
          
          setNodes((nds) => nds.filter((node) => !selectedNodeIds.has(node.id)));
          setEdges((eds) =>
            eds.filter(
              (edge) =>
                !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target)
            )
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      connectingNodeId.current = null;
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onConnectStart = useCallback((_: React.MouseEvent | React.TouchEvent, { nodeId }: { nodeId: string | null }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingNodeId.current || !reactFlowInstance) return;

      const targetIsPane = (event.target as Element)?.classList.contains("react-flow__pane");
      
      if (targetIsPane) {
        const position = reactFlowInstance.screenToFlowPosition({
          x: event instanceof MouseEvent ? event.clientX : event.touches[0].clientX,
          y: event instanceof MouseEvent ? event.clientY : event.touches[0].clientY,
        });

        const newNode: Node<CustomNodeData> = {
          id: `${Date.now()}`,
          type: "custom",
          data: { 
            label: t("reactFlow.nodeLabel", { number: nodes.length + 1 }) || `Node ${nodes.length + 1}`,
            color: "#8b5cf6",
            sequence: getNextSequence(nodes),
          },
          position,
        };

        setNodes((nds) => [...nds, newNode]);

        const newEdge: Edge = {
          id: `${connectingNodeId.current}-${newNode.id}`,
          source: connectingNodeId.current,
          target: newNode.id,
        };

        setEdges((eds) => addEdge(newEdge, eds));
      }

      connectingNodeId.current = null;
    },
    [reactFlowInstance, nodes, setNodes, setEdges, t]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const addNewNode = useCallback(() => {
    const newNode: Node<CustomNodeData> = {
      id: `${Date.now()}`,
      type: "custom",
      data: { 
        label: t("reactFlow.nodeLabel", { number: nodes.length + 1 }) || `Node ${nodes.length + 1}`,
        color: "#8b5cf6",
        sequence: getNextSequence(nodes),
      },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
    };
    setNodes((nds) => [...nds, newNode]);
    return newNode;
  }, [nodes, setNodes, t]);

  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-4">
          <Button onClick={addNewNode}>{t("reactFlow.addNode")}</Button>
        </Card>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onInit={onInit}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

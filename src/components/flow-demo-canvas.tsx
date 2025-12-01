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
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface FlowDemoPersistedData {
  nodes?: Node[];
  edges?: Edge[];
}

interface FlowDemoProps {
  saveData: (data: { nodes: Node[]; edges: Edge[] }) => Promise<void>;
  loadData: () => Promise<FlowDemoPersistedData | null>;
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Input Node" },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    data: { label: "Default Node" },
    position: { x: 100, y: 125 },
  },
  {
    id: "3",
    type: "output",
    data: { label: "Output Node" },
    position: { x: 250, y: 250 },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

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
          if (data.nodes) setNodes(data.nodes);
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

        const newNode: Node = {
          id: `${Date.now()}`,
          data: { label: t("reactFlow.nodeLabel", { number: nodes.length + 1 }) },
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
    [reactFlowInstance, nodes.length, setNodes, setEdges, t]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  const addNewNode = useCallback(() => {
    const newNode: Node = {
      id: `${Date.now()}`,
      data: { label: t("reactFlow.nodeLabel", { number: nodes.length + 1 }) },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
    };
    setNodes((nds) => [...nds, newNode]);
    return newNode;
  }, [nodes.length, setNodes, t]);

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

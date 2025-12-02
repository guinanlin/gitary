import { Node } from "reactflow";
import { CustomNodeData } from "./custom-node";

export type CustomNodeType = "custom";

export interface FlowCustomNode extends Node<CustomNodeData, CustomNodeType> {
  type: CustomNodeType;
}

export interface FlowNodeData extends CustomNodeData {
  type?: "input" | "output" | "default" | CustomNodeType;
}


export interface ChatMessagePart {
  type: string;
  text?: string;
  toolInvocation?: any;
  [key: string]: any;
}

export interface ChatMessageToolInvocation {
  toolCallId: string;
  toolName: string;
  status: string;
  args: unknown;
  result?: unknown;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts?: ChatMessagePart[];
  toolInvocations?: ChatMessageToolInvocation[];
}

export interface ConversationInfo {
  conversationId: string;
  spaceId: string | null;
  lastUpdated: number;
  messageCount?: number;
}

export interface Conversation {
  messages: ChatMessage[];
  lastUpdated: number;
  conversationId: string;
  spaceId: string | null;
}


import { ChatCacheService } from "@dty/ai-assistant-core";
import { GitaryStorageAdapter } from "./adapters/gitary-storage-adapter";

export const chatCacheService = new ChatCacheService({
  storage: new GitaryStorageAdapter(localStorage),
  storageKeyPrefix: "gitary-chat-conversation-",
  conversationListKey: "gitary-chat-conversation-list",
  maxConversations: 50,
  maxMessagesPerConversation: 500,
});


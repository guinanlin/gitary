import { BehaviorSubject } from "rxjs";
import type { IStorage } from "../interfaces/storage.interface";
import type { ChatMessage, Conversation, ConversationInfo } from "../types/chat-message";

export interface ChatCacheConfig {
  storage: IStorage;
  storageKeyPrefix?: string;
  conversationListKey?: string;
  maxConversations?: number;
  maxMessagesPerConversation?: number;
}

export class ChatCacheService {
  private storage: IStorage;
  private storageKeyPrefix: string;
  private conversationListKey: string;
  private maxConversations: number;
  private maxMessagesPerConversation: number;

  readonly conversations$ = new BehaviorSubject<Map<string, Conversation>>(new Map());
  readonly conversationList$ = new BehaviorSubject<ConversationInfo[]>([]);

  constructor(config: ChatCacheConfig) {
    this.storage = config.storage;
    this.storageKeyPrefix = config.storageKeyPrefix || "ai-chat-conversation-";
    this.conversationListKey = config.conversationListKey || "ai-chat-conversation-list";
    this.maxConversations = config.maxConversations || 50;
    this.maxMessagesPerConversation = config.maxMessagesPerConversation || 500;

    this.loadAllConversations();
  }

  private getStorageKey(conversationId: string): string {
    return `${this.storageKeyPrefix}${conversationId}`;
  }

  private loadAllConversations(): void {
    try {
      const listJson = this.storage.getItem(this.conversationListKey);
      const conversationList: ConversationInfo[] = listJson ? JSON.parse(listJson) : [];

      const conversations = new Map<string, Conversation>();

      for (const item of conversationList) {
        try {
          const key = this.getStorageKey(item.conversationId);
          const data = this.storage.getItem(key);
          if (data) {
            const conversation: Conversation = JSON.parse(data);
            conversations.set(item.conversationId, conversation);
          }
        } catch (error) {
          console.warn(
            `[ChatCacheService] Failed to load conversation for conversationId ${item.conversationId}:`,
            error
          );
        }
      }

      this.conversations$.next(conversations);
      this.conversationList$.next(conversationList);
    } catch (error) {
      console.error("[ChatCacheService] Failed to load conversations:", error);
    }
  }

  private updateConversationList(conversationId: string, spaceId: string | null, lastUpdated: number): void {
    const currentList = this.conversationList$.getValue();
    const existingIndex = currentList.findIndex((item) => item.conversationId === conversationId);

    let newList: ConversationInfo[];
    if (existingIndex >= 0) {
      newList = [...currentList];
      newList[existingIndex] = {
        conversationId,
        spaceId,
        lastUpdated,
        messageCount: this.getMessages(conversationId).length,
      };
    } else {
      newList = [
        ...currentList,
        {
          conversationId,
          spaceId,
          lastUpdated,
          messageCount: 0,
        },
      ];
    }

    newList.sort((a, b) => b.lastUpdated - a.lastUpdated);

    if (newList.length > this.maxConversations) {
      const toRemove = newList.slice(this.maxConversations);
      for (const item of toRemove) {
        this.deleteConversation(item.conversationId);
      }
      newList = newList.slice(0, this.maxConversations);
    }

    this.conversationList$.next(newList);

    try {
      this.storage.setItem(this.conversationListKey, JSON.stringify(newList));
    } catch (error) {
      console.warn("[ChatCacheService] Failed to save conversation list:", error);
    }
  }

  getMessages(conversationId: string): ChatMessage[] {
    const conversations = this.conversations$.getValue();
    const conversation = conversations.get(conversationId);
    return conversation?.messages || [];
  }

  setMessages(conversationId: string, messages: ChatMessage[], spaceId?: string | null): void {
    const limitedMessages = messages.slice(-this.maxMessagesPerConversation);

    const conversations = new Map(this.conversations$.getValue());
    const existingConversation = conversations.get(conversationId);
    const finalSpaceId = spaceId !== undefined ? spaceId : existingConversation?.spaceId ?? null;

    const conversation: Conversation = {
      messages: limitedMessages,
      lastUpdated: Date.now(),
      conversationId,
      spaceId: finalSpaceId,
    };

    conversations.set(conversationId, conversation);
    this.conversations$.next(conversations);

    this.updateConversationList(conversationId, finalSpaceId, conversation.lastUpdated);

    try {
      const key = this.getStorageKey(conversationId);
      this.storage.setItem(key, JSON.stringify(conversation));
    } catch (error) {
      console.warn(`[ChatCacheService] Failed to save conversation for conversationId ${conversationId}:`, error);
      if (error instanceof DOMException && error.code === 22) {
        this.cleanupOldConversations();
      }
    }
  }

  addMessage(conversationId: string, message: ChatMessage, spaceId?: string | null): void {
    const currentMessages = this.getMessages(conversationId);
    this.setMessages(conversationId, [...currentMessages, message], spaceId);
  }

  updateMessage(
    conversationId: string,
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage
  ): void {
    const currentMessages = this.getMessages(conversationId);
    const updatedMessages = currentMessages.map((msg) => (msg.id === messageId ? updater(msg) : msg));
    const conversations = this.conversations$.getValue();
    const existingConversation = conversations.get(conversationId);
    this.setMessages(conversationId, updatedMessages, existingConversation?.spaceId);
  }

  createConversation(conversationId: string, spaceId?: string | null): void {
    const existingMessages = this.getMessages(conversationId);
    if (existingMessages.length === 0) {
      this.setMessages(conversationId, [], spaceId ?? null);
    }
  }

  clearConversation(conversationId: string): void {
    const conversations = this.conversations$.getValue();
    const existingConversation = conversations.get(conversationId);
    this.setMessages(conversationId, [], existingConversation?.spaceId ?? null);
  }

  deleteConversation(conversationId: string): void {
    const conversations = new Map(this.conversations$.getValue());
    conversations.delete(conversationId);
    this.conversations$.next(conversations);

    const list = this.conversationList$.getValue().filter((item) => item.conversationId !== conversationId);
    this.conversationList$.next(list);

    try {
      const key = this.getStorageKey(conversationId);
      this.storage.removeItem(key);
      this.storage.setItem(this.conversationListKey, JSON.stringify(list));
    } catch (error) {
      console.warn(`[ChatCacheService] Failed to delete conversation for conversationId ${conversationId}:`, error);
    }
  }

  getConversationList(spaceId?: string | null): ConversationInfo[] {
    const allList = this.conversationList$.getValue();
    if (spaceId === undefined) {
      return allList;
    }
    return allList.filter((item) => {
      if (spaceId === null) {
        return item.spaceId === null;
      }
      return item.spaceId === spaceId;
    });
  }

  private cleanupOldConversations(): void {
    const list = this.conversationList$.getValue();
    if (list.length <= this.maxConversations) return;

    const toRemove = list.slice(this.maxConversations);
    for (const item of toRemove) {
      this.deleteConversation(item.conversationId);
    }
  }
}


export interface ConversationItem {
  id: string;
  businessName: string;
  businessLogoUrl: string | null;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export interface MessageBubble {
  id: string;
  senderId: string;
  content: string;
  sentAt: Date;
  isRead: boolean;
}

export interface MessageThread {
  conversationId: string;
  businessName: string;
  messages: MessageBubble[];
}

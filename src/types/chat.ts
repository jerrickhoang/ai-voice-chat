export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  isVisible?: boolean;
}

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
} 
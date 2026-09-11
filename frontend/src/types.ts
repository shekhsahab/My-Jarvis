export type VoiceState = 'idle' | 'listening' | 'thinking' | 'executing' | 'speaking' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceStatus {
  state: VoiceState;
  wake_word: string;
  listening: boolean;
}

export interface ChatResponse {
  reply: string;
  status: string;
  intent?: string;
  source?: string;
  tool?: string | null;
}

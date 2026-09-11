import type { ChatMessage, ChatResponse, VoiceStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${url}`, init);
  } catch {
    throw new Error('JARVIS backend is unreachable. Start FastAPI on port 8000 and refresh this page.');
  }
}

export async function getVoiceStatus(): Promise<VoiceStatus> {
  const response = await request('/api/voice-status');
  if (!response.ok) {
    throw new Error('Unable to fetch voice status');
  }
  return response.json();
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const response = await request('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`JARVIS rejected the command (${response.status}).`);
  }

  const data = await response.json();
  return {
    reply: data.reply ?? 'I heard you. I am ready to help.',
    status: data.status ?? 'ok',
    intent: data.intent,
    source: data.source,
    tool: data.tool,
  };
}

export async function fetchConversationHistory(): Promise<ChatMessage[]> {
  return [
    { id: 'welcome', role: 'assistant', content: 'How can I assist you today?' },
  ];
}

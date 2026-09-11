import { useEffect, useRef, useState } from 'react';
import { fetchConversationHistory, getVoiceStatus, sendChatMessage } from '../services/api';
import type { ChatMessage, ChatResponse, VoiceState } from '../types';

const defaultState: VoiceState = 'idle';

function timeGreeting() {
  const hour = new Date().getHours();
  return hour < 5 ? 'good night' : hour < 12 ? 'good morning' : hour < 18 ? 'good afternoon' : hour < 22 ? 'good evening' : 'good night';
}

type SpeechRecognitionResultEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useJarvis(voiceEnabled = true) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<VoiceState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [userName, setUserNameState] = useState(() => window.localStorage.getItem('jarvis.userName') ?? '');
  const userNameRef = useRef(userName);
  const voiceEnabledRef = useRef(voiceEnabled);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const autoListenRef = useRef(false);
  const processingRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const startupTimerRef = useRef<number | null>(null);
  const restartRecognitionRef = useRef<(() => void) | null>(null);
  const submitCommandRef = useRef<(value?: string) => Promise<void>>(() => Promise.resolve());

  const speak = (text: string, onEnd?: () => void) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: text }]);
    setStatus('speaking');
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = onEnd ?? (() => setStatus('idle'));
    utterance.onerror = onEnd ?? (() => setStatus('idle'));
    window.speechSynthesis.speak(utterance);
  };

  const saveUserName = (name: string) => {
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    if (!normalizedName) return false;
    window.localStorage.setItem('jarvis.userName', normalizedName);
    setUserNameState(normalizedName);
    userNameRef.current = normalizedName;
    processingRef.current = true;
    speak(`Yes, ${normalizedName}, ${timeGreeting()}. How can I assist you today?`, () => {
      processingRef.current = false;
      if (voiceEnabledRef.current) restartRecognitionRef.current?.();
    });
    return true;
  };

  const activateVoice = () => {
    voiceEnabledRef.current = true;
    autoListenRef.current = true;
    setError(null);
    restartRecognitionRef.current?.();
  };

  const greetUser = () => {
    const name = userNameRef.current;
    if (!name) return;
    processingRef.current = true;
    speak(`Yes, ${name}, how can I help you?`, () => {
      processingRef.current = false;
      if (autoListenRef.current) restartRecognitionRef.current?.();
    });
  };

  const clearUserName = () => {
    window.localStorage.removeItem('jarvis.userName');
    userNameRef.current = '';
    setUserNameState('');
    autoListenRef.current = false;
    processingRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
    setStatus('idle');
  };

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (!voiceEnabled) {
      autoListenRef.current = false;
      recognitionRef.current?.stop();
      setListening(false);
    }
  }, [voiceEnabled]);

  useEffect(() => {
    const load = async () => {
      try {
        const history = await fetchConversationHistory();
        setMessages(history);

        const voice = await getVoiceStatus();
        setStatus(voice.state || defaultState);
      } catch (err) {
        setError('JARVIS is starting up. Please try again in a moment.');
      }
    };

    load();
  }, []);

  const submitCommand = async (value?: string) => {
    const command = (value ?? input).trim();
    if (!command) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: command,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    processingRef.current = true;
    setStatus('thinking');
    setError(null);

    try {
      const response: ChatResponse = await sendChatMessage(command);
      const reply = response.reply;
      const acknowledged = response.status === 'executed' && !reply.startsWith('Command accepted.');
      const spokenReply = acknowledged ? `Command accepted. ${reply}` : reply;
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: spokenReply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus('speaking');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const finishSpeech = () => {
          processingRef.current = false;
          if (autoListenRef.current) {
            restartRecognitionRef.current?.();
          } else {
            setStatus('idle');
          }
        };
        const speakReply = () => {
          const replyUtterance = new SpeechSynthesisUtterance(reply);
          replyUtterance.onend = finishSpeech;
          replyUtterance.onerror = finishSpeech;
          window.speechSynthesis.speak(replyUtterance);
        };
        const utterance = new SpeechSynthesisUtterance(acknowledged ? 'Command accepted.' : spokenReply);
        utterance.onend = acknowledged ? speakReply : finishSpeech;
        utterance.onerror = acknowledged ? speakReply : finishSpeech;
        window.speechSynthesis.speak(utterance);
      } else {
        processingRef.current = false;
        restartRecognitionRef.current?.();
      }
    } catch (err) {
      processingRef.current = false;
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
      restartRecognitionRef.current?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    submitCommandRef.current = submitCommand;
  }, [submitCommand]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;

    setVoiceSupported(true);
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    const beginRecognition = async () => {
      if (!voiceEnabledRef.current || !userNameRef.current || !autoListenRef.current || processingRef.current || recognitionActiveRef.current) return;
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
        recognition.start();
      } catch {
        autoListenRef.current = false;
        setListening(false);
        setStatus('error');
        setError('Microphone access is required. Allow it for this page and refresh JARVIS.');
      }
    };
    const restart = () => {
      if (!autoListenRef.current || processingRef.current) return;
      if (restartTimerRef.current !== null || recognitionActiveRef.current) return;
      restartTimerRef.current = window.setTimeout(() => {
        restartTimerRef.current = null;
        void beginRecognition();
      }, 180);
    };
    restartRecognitionRef.current = restart;
    recognition.onstart = () => {
      recognitionActiveRef.current = true;
      setListening(true);
      setStatus('listening');
    };
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result?.[0]?.transcript.trim() ?? '';
      const confidence = result?.[0]?.confidence ?? 1;
      if (!transcript || confidence < 0.35) return;
      setTranscript(transcript);
      const normalizedTranscript = transcript.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const wakeOnly = /^(hey\s+)?jarvis$/.test(normalizedTranscript);
      const match = transcript.match(/^\s*jarvis\b[\s,:-]*(.*)/i);
      if (wakeOnly) {
        recognition.stop();
        greetUser();
        return;
      }
      const directCommand = match?.[1]?.trim();
      const command = directCommand || transcript;
      if (!command) {
        setTranscript('VOICE INPUT NOT DETECTED');
        return;
      }
      if (command) {
        processingRef.current = true;
        recognition.stop();
        void submitCommandRef.current(command);
      }
    };
    recognition.onerror = (event) => {
      setTranscript('');
      if (!autoListenRef.current) return;
      const recognitionError = (event as Event & { error?: string }).error;
      if (recognitionError === 'not-allowed' || recognitionError === 'service-not-allowed') {
        autoListenRef.current = false;
        setListening(false);
        setStatus('error');
        setError('Microphone access is blocked. Allow microphone access for this page, then start listening again.');
        return;
      }
      // Silence and browser session timeouts are normal for continuous listening.
      // Keep the UI in LISTENING and quietly open the next session.
      restart();
    };
    recognition.onend = () => {
      recognitionActiveRef.current = false;
      setTranscript('');
      if (autoListenRef.current && !processingRef.current) {
        setListening(true);
        setStatus('listening');
        restart();
      } else {
        setListening(false);
        setStatus((current) => (current === 'listening' ? 'idle' : current));
      }
    };
    recognitionRef.current = recognition;

    // Start the persistent listener when the app opens. Browsers may defer this
    // until microphone permission has been granted by the user.
    autoListenRef.current = Boolean(voiceEnabledRef.current && userNameRef.current);
    startupTimerRef.current = window.setTimeout(() => {
      startupTimerRef.current = null;
      void beginRecognition();
    }, 300);

    return () => {
      autoListenRef.current = false;
      if (startupTimerRef.current !== null) window.clearTimeout(startupTimerRef.current);
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
      recognitionActiveRef.current = false;
      recognition.stop();
      recognitionRef.current = null;
      restartRecognitionRef.current = null;
    };
  }, []);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError('Voice input is not supported in this browser. Use Chrome or Edge.');
      setStatus('error');
      return;
    }

    if (!userNameRef.current) {
      setError('Enter your name first to activate JARVIS voice control.');
      return;
    }

    if (listening) {
      autoListenRef.current = false;
      recognition.stop();
      return;
    }

    autoListenRef.current = true;
    setError(null);
    setTranscript('');
    setListening(true);
    setStatus('listening');
    restartRecognitionRef.current?.();
  };

  return {
    messages,
    input,
    setInput,
    status,
    loading,
    error,
    transcript,
    submitCommand,
    listening,
    voiceSupported,
    toggleListening,
    userName,
    saveUserName,
    greetUser,
    clearUserName,
    activateVoice,
  };
}

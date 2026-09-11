import type { VoiceState } from '../types';

const labelMap: Record<VoiceState, string> = {
  idle: 'IDLE',
  listening: 'LISTENING',
  thinking: 'THINKING',
  executing: 'EXECUTING',
  speaking: 'SPEAKING',
  error: 'ERROR',
};

export function StatusIndicator({ state }: { state: VoiceState }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-3 w-3 rounded-full ${
          state === 'error'
            ? 'bg-red-400'
            : state === 'listening' || state === 'speaking'
              ? 'bg-emerald-400'
              : state === 'thinking' || state === 'executing'
                ? 'bg-amber-400'
                : 'bg-sky-400'
        }`}
      />
      <span className="text-[10px] uppercase tracking-[0.28em] text-slate-300">{labelMap[state]}</span>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

const stages = [
  { title: 'INITIALIZING J.A.R.V.I.S...', log: 'BOOT SEQUENCE STARTED' },
  { title: 'POWER SYSTEM: ONLINE', log: 'LOADING CORE MODULES' },
  { title: 'AI CORE ACTIVATING', log: 'INITIALIZING NEURAL ENGINE' },
  { title: 'VOICE SYSTEM CALIBRATING', log: 'CALIBRATING AUDIO INPUT' },
  { title: 'COMMAND ENGINE CONNECTING', log: 'INITIALIZING COMMAND PROCESSOR' },
  { title: 'SECURITY LAYER ACTIVE', log: 'SECURITY PROTOCOL ACTIVE' },
  { title: 'FINAL SYNCHRONIZATION', log: 'SYNCHRONIZING SYSTEM INTERFACE' },
  { title: 'SYNCHRONIZATION COMPLETE', log: 'ALL SYSTEMS NOMINAL' },
  { title: 'J.A.R.V.I.S ONLINE', log: 'SYSTEM READY' },
];

const moduleNames = ['CORE SYSTEM', 'NEURAL ENGINE', 'VOICE MODULE', 'COMMAND MODULE', 'SECURITY LAYER'];
const terminalLead = ['POWER BUS CHECK', 'MEMORY GRID MAPPED', 'OPTICAL ARRAY CALIBRATED', 'AUDIO CHANNEL RESERVED', 'LOCAL TOOLS DISCOVERED', 'NETWORK HANDSHAKE VERIFIED'];

function percentage(stage: number, index: number) {
  return Math.min(100, Math.max(0, (stage - index * 1.25 + 1) * 32));
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [stage, setStage] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/assets/Aoudio/initializing.mp3');
    audio.preload = 'auto';
    audio.volume = 0.9;
    audioRef.current = audio;
    void audio.play().catch(() => undefined);

    const timer = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, stages.length - 1));
    }, 610);
    const complete = window.setTimeout(onComplete, 610 * stages.length + 720);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(complete);
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const resumeAudio = () => {
      const audio = audioRef.current;
      if (!audio || !audio.paused) return;
      void audio.play().catch(() => undefined);
    };
    const handleInteraction = () => {
      resumeAudio();
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('pointerdown', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const progress = Math.round((stage / (stages.length - 1)) * 100);
  const visibleLogs = [...terminalLead.slice(0, Math.min(stage + 1, terminalLead.length)), ...stages.slice(0, stage + 1).map(({ log }) => log)].slice(-7);

  return (
    <div className={`boot-screen boot-stage-${stage}`} role="status" aria-live="polite">
      <div className="boot-particles" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => <i key={index} style={{ '--particle-angle': `${index * 13}deg`, '--particle-distance': `${80 + (index % 7) * 25}px`, '--particle-delay': `${(index % 9) * -0.4}s` } as CSSProperties} />)}
      </div>
      <div className="boot-header"><span>J.A.R.V.I.S / ADVANCED SYSTEMS</span><b>SECURE BOOT // 0x{(stage + 1).toString(16).padStart(2, '0').toUpperCase()}</b></div>
      <div className="boot-layout">
        <section className="boot-terminal boot-panel">
          <div className="boot-panel-title">SYSTEM TERMINAL <b>LIVE</b></div>
          <div className="boot-terminal-body">
            <div className="boot-terminal-intro">&gt; CONNECTING TO JARVIS KERNEL</div>
            {visibleLogs.map((log, index) => <div className="boot-log" key={`${log}-${index}`}><b>&gt;</b> {log}<span>[OK]</span></div>)}
            <div className="boot-cursor">&gt; _</div>
          </div>
        </section>

        <section className="boot-reactor" aria-label="JARVIS core initialization">
          <div className="boot-reactor-label">{stages[stage].title}</div>
          <div className="boot-core">
            <div className="boot-radial-lines" />
            <div className="boot-ring boot-ring-outer" />
            <div className="boot-ring boot-ring-segmented" />
            <div className="boot-ring boot-ring-inner" />
            <div className="boot-ring boot-ring-scan" />
            <div className="boot-core-light"><strong>{progress}%</strong><span>CORE SYNC</span></div>
            <div className="boot-core-beam" />
          </div>
          <div className="boot-reactor-caption"><span>J.A.R.V.I.S</span><b>{stage === stages.length - 1 ? 'SYSTEM ONLINE' : 'INITIALIZING'}</b></div>
          <div className="boot-voice"><span>VOICE SYSTEM / {stage >= 3 ? 'ONLINE' : 'CALIBRATING'}</span><div>{[1, 3, 5, 2, 7, 4, 6, 2, 5, 3, 1].map((height, index) => <i key={index} style={{ height: `${height * 3}px`, animationDelay: `${index * 70}ms` }} />)}</div></div>
        </section>

        <section className="boot-modules boot-panel">
          <div className="boot-panel-title">CORE MODULES <b>{progress}%</b></div>
          <div className="boot-module-list">{moduleNames.map((name, index) => { const value = Math.round(percentage(stage, index)); return <div className="boot-module" key={name}><div><span>{name}</span><b>{value}%</b></div><i><em style={{ width: `${value}%` }} /></i></div>; })}</div>
          <div className="boot-telemetry"><span>CPU <b>{12 + (stage * 3) % 9}%</b></span><span>MEM <b>{28 + (stage * 2) % 11}%</b></span><span>POWER <b>OPTIMAL</b></span><span>NETWORK <b className="telemetry-live">CONNECTED</b></span></div>
        </section>
      </div>
      <div className="boot-footer">
        <div className="boot-timeline">{['CORE', 'AI ENGINE', 'VOICE', 'COMMAND', 'ONLINE'].map((label, index) => <div className={stage >= index * 2 ? 'is-active' : ''} key={label}><i /><span>{label}</span></div>)}</div>
        <div className="boot-progress"><i style={{ width: `${progress}%` }} /></div>
        <span className="boot-footer-status">{stages[stage].log} <b>{progress}%</b></span>
      </div>
    </div>
  );
}

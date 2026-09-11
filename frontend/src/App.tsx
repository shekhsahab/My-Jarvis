import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useJarvis } from './hooks/useJarvis';
import type { VoiceState } from './types';
import { BootSequence } from './components/BootSequence';

const quickCommands = [
  ['▶', 'Open YouTube', 'Open YouTube'],
  ['◉', 'Open Google', 'Open Google'],
  ['◖', 'Increase volume', 'Increase the system volume'],
  ['◗', 'Decrease volume', 'Decrease the system volume'],
  ['▣', 'Mute volume', 'Mute volume'],
  ['◷', 'What time is it?', 'What time is it?'],
];

const stateLabel: Record<VoiceState, string> = {
  idle: 'JARVIS READY',
  listening: 'LISTENING...',
  thinking: 'THINKING...',
  executing: 'EXECUTING...',
  speaking: 'SPEAKING...',
  error: 'COMMAND FAILED',
};

function Core({ state, listening, onListen }: { state: VoiceState; listening: boolean; onListen: () => void }) {
  return (
    <div className={`jarvis-core core-${state}`}>
      <div className="core-orbit orbit-one" />
      <div className="core-orbit orbit-two" />
      <div className="core-orbit orbit-three" />
      <div className="core-scan" />
      <div className="core-center">
        <button className="core-mic" type="button" onClick={onListen} aria-label={listening ? 'Stop listening' : 'Start listening'}>
          {listening ? '■' : '♩'}
        </button>
        <div className="core-bars" aria-hidden="true">
          {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((height, index) => <i key={index} style={{ height: `${height * 7}px` }} />)}
        </div>
      </div>
      <div className="core-readout">{stateLabel[state]}</div>
      <div className="core-subtitle">{state === 'listening' ? 'Speak your command' : 'Listen · Understand · Execute'}</div>
    </div>
  );
}

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`hud-panel ${className}`}><div className="panel-title">{title}</div>{children}</section>;
}

const App = () => {
  const [clock, setClock] = useState(new Date());
  const [booting, setBooting] = useState(true);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [nameDraft, setNameDraft] = useState(() => window.localStorage.getItem('jarvis.userName') ?? '');
  const [nameError, setNameError] = useState('');
  const { messages, input, setInput, status, loading, error, transcript, submitCommand, listening, voiceSupported, toggleListening, userName, saveUserName, clearUserName, activateVoice } = useJarvis(!booting && identityConfirmed);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const runQuickCommand = (command: string) => { void submitCommand(command); };
  const recentMessages = messages.slice(-6).reverse();
  const initializeIdentity = () => {
    if (!saveUserName(nameDraft)) {
      setNameError('Please enter your name first.');
      return;
    }
    setIdentityConfirmed(true);
    activateVoice();
  };

  return (
    <div className="jarvis-shell">
      {booting && <BootSequence onComplete={() => setBooting(false)} />}
      {!booting && !identityConfirmed && <div className="name-screen" role="dialog" aria-modal="true" aria-labelledby="identity-title">
        <div className="identity-grid" aria-hidden="true" />
        <div className="identity-scan" aria-hidden="true" />
        <div className="identity-particles" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>
        <div className="name-panel">
          <div className="identity-topline"><span>J.A.R.V.I.S // IDENTITY PROTOCOL</span><b>SECURE CHANNEL</b></div>
          <div className="name-orb"><span>◉</span><i /></div>
          <div className="boot-kicker">PERSONAL ASSISTANT INITIALIZATION</div>
          <h1 id="identity-title">IDENTIFY YOURSELF</h1>
          <p className="identity-lead">Your profile is not initialized. Enter your name to establish a secure assistant link.</p>
          <div className="identity-status"><span><i /> CORE ONLINE</span><span><i /> VOICE READY</span><span><i /> PROFILE REQUIRED</span></div>
          <form onSubmit={(event) => { event.preventDefault(); initializeIdentity(); }}>
            <label htmlFor="user-name">OPERATOR NAME</label>
            <input id="user-name" required autoFocus value={nameDraft} onChange={(event) => { setNameDraft(event.target.value); setNameError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Enter your name, then press Enter..." aria-label="Your name. Press Enter to continue." />
            {nameError && <small role="alert">{nameError}</small>}
          </form>
          <div className="identity-footer"><span>NO NAME / NO ACCESS</span><b>PRESS ENTER TO INITIALIZE</b></div>
        </div>
      </div>}
      <header className="hud-header">
        <div className="brand-mark"><div className="brand-core">◉</div><div><strong>JARVIS</strong><span>AI DESKTOP ASSISTANT</span></div></div>
        <div className="header-motto">LISTEN <b>•</b> UNDERSTAND <b>•</b> EXECUTE</div>
        <div className="header-status"><strong>{clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong><span>{clock.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span><i className={listening ? 'live-dot' : ''}>●</i><span>{listening ? 'MIC LIVE' : 'MIC READY'}</span></div>
      </header>

      <main className={`hud-grid ${!identityConfirmed ? 'is-locked' : ''}`}>
        <aside className="left-rail">
          <Panel title="SYSTEM STATUS">
            {[['◈', 'JARVIS', 'ONLINE', 'ok'], ['♩', 'MICROPHONE', listening ? 'LISTENING' : 'READY', listening ? 'active' : 'ok'], ['▦', 'AI ENGINE', status === 'thinking' ? 'PROCESSING' : 'READY', status === 'thinking' ? 'warn' : 'ok'], ['⚙', 'TOOLS', 'CONNECTED', 'ok'], ['◌', 'INTERNET', 'CONNECTED', 'ok']].map(([icon, label, value, tone]) => <div className="status-row" key={label}><b>{icon}</b><span>{label}</span><em className={tone}>{value}</em></div>)}
          </Panel>
          <Panel title="QUICK COMMANDS" className="quick-panel">
            <div className="quick-grid">{quickCommands.map(([icon, label, command]) => <button key={label} type="button" onClick={() => runQuickCommand(command)} disabled={loading}><b>{icon}</b><span>{label}</span></button>)}</div>
          </Panel>
        </aside>

        <section className="core-stage">
          <div className="stage-label">PERSONAL AI COMMAND CENTER <span>● LIVE</span></div>
          <Core state={status} listening={listening} onListen={toggleListening} />
          <div className="stage-caption">{transcript || (error ? error : 'Ready for your next command')}</div>
        </section>

        <aside className="right-rail">
          <Panel title="JARVIS ASSISTANT" className="assistant-panel"><div className="assistant-avatar">◉</div><div><h2>JARVIS</h2><p>{userName ? `Assigned to ${userName}` : 'Your personal AI assistant'}</p><q>How can I help you today?</q><button className="identity-button" type="button" onClick={() => { clearUserName(); setNameDraft(''); setIdentityConfirmed(false); }}>CHANGE NAME</button></div></Panel>
          <Panel title="COMMAND HISTORY" className="history-panel">
            {recentMessages.length === 0 && <div className="empty-history">No commands yet</div>}
            {recentMessages.map((message) => <div className={`history-item ${message.role}`} key={message.id}><span>{message.role === 'user' ? 'YOU' : 'JARVIS'}</span><p>{message.content}</p>{message.role === 'assistant' && <em>✓ COMPLETE</em>}</div>)}
          </Panel>
        </aside>
      </main>

      <form className="voice-console" onSubmit={(event) => { event.preventDefault(); void submitCommand(); }}>
        <div className="console-wave">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 35}ms` }} />)}</div>
        <button className={`console-mic ${listening ? 'is-listening' : ''}`} type="button" onClick={toggleListening} aria-label={listening ? 'Stop listening' : 'Start listening'}>{listening ? '■' : '♩'}</button>
        <div className="console-input"><span>{listening ? 'LISTENING...' : stateLabel[status]}</span><input aria-label="Command input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Speak or type a command..." /></div>
        <button className="console-send" type="submit" disabled={loading || !input.trim()} aria-label="Send command">↗</button>
      </form>

      <footer className="hud-footer"><span>◉ Voice Control</span><span>◈ AI Assistant</span><span>⊞ Windows Tools</span><span>◎ Browser Tools</span><span>⚙ System Info</span><b>A SMARTER TOMORROW,<br />STARTS WITH YOUR VOICE</b></footer>
      {!voiceSupported && <div className="browser-note">Voice recognition is unavailable in this browser. Chrome or Edge is recommended.</div>}
      {voiceSupported && error?.includes('permanent listening') && <div className="browser-note">Allow microphone access once, then JARVIS will keep listening automatically.</div>}
    </div>
  );
};

export default App;

'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatBubble, ChatShell, ChatInput } from './room-pieces';
import { AI_DISCLAIMER_SHORT } from '@/lib/legal';

type Msg = { role: 'user' | 'assistant'; content: string };

const GREETING =
  "Morning! I know today's workout inside out — sets, tempos, Lyla's cues. Ask me anything about scaling, form, or swaps.";

export function CoachChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [offline, setOffline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [msgs, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    const history: Msg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(history);
    setStreaming(true);

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12) }),
      });

      if (res.status === 503) {
        setOffline(true);
        setMsgs((m) => [
          ...m,
          {
            role: 'assistant',
            content: "Coach is napping right now (the AI key isn't set up yet). Message Lyla directly — she's faster than any robot anyway.",
          },
        ]);
        return;
      }
      if (!res.ok || !res.body) {
        setMsgs((m) => [...m, { role: 'assistant', content: 'Dropped the connection — hit me again in a second.' }]);
        return;
      }

      setMsgs((m) => [...m, { role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: 'Dropped the connection — hit me again in a second.' }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <ChatShell
      header={
        <>
          ASK COACH — KNOWS TODAY&apos;S WOD
          {offline && <span className="ml-1 text-coral">· OFFLINE</span>}
        </>
      }
      input={<ChatInput value={input} onChange={setInput} onSend={send} disabled={streaming} />}
      disclaimer={AI_DISCLAIMER_SHORT.toUpperCase()}
    >
      <ChatBubble who="coach">{GREETING}</ChatBubble>
      {msgs.map((m, i) => (
        <ChatBubble key={i} who={m.role === 'user' ? 'you' : 'coach'}>
          {m.content || '…'}
        </ChatBubble>
      ))}
      <div ref={bottomRef} />
    </ChatShell>
  );
}

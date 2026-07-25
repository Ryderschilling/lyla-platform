'use client';

import { useEffect, useRef, useState } from 'react';
import { getMyThread, sendClubMessage, type ThreadMessage } from '@/lib/actions/club-actions';
import { ChatBubble, ChatInput } from './room-pieces';

export function MessagesThread({ initial }: { initial: ThreadMessage[] }) {
  const [msgs, setMsgs] = useState<ThreadMessage[]>(initial);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const count = useRef(initial.length);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const fresh = await getMyThread();
        setMsgs(fresh);
        if (fresh.length > count.current) {
          count.current = fresh.length;
          bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      } catch {
        /* next poll will retry */
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    const res = await sendClubMessage(text);
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? 'Message slipped — try again.');
      return;
    }
    setInput('');
    const fresh = await getMyThread();
    setMsgs(fresh);
    count.current = fresh.length;
    setTimeout(() => bottomRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
  };

  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-2xl border border-night-line bg-night-card">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {msgs.length === 0 && (
          <div className="m-auto max-w-[30ch] text-center">
            <p className="font-display text-lg italic text-night-sub">Say hey — she answers between workouts and cookie batches.</p>
          </div>
        )}
        {msgs.map((m) => (
          <ChatBubble key={m.id} who={m.mine ? 'you' : 'coach'}>
            {m.body}
          </ChatBubble>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-night-line p-3">
        <ChatInput value={input} onChange={setInput} onSend={send} disabled={sending} placeholder="Write to Lyla…" />
        {error && <p className="mt-2 px-2 text-[12px] text-coral">{error}</p>}
      </div>
    </div>
  );
}

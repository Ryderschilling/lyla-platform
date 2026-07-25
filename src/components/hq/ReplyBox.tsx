'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { replyToClient } from '@/lib/actions/hq-actions';

export function ReplyBox({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const res = await replyToClient(clientId, body);
    setSending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setText('');
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center gap-2 rounded-full border border-line bg-shell py-1 pl-4 pr-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={sending}
          placeholder="Reply as Lyla…"
          className="w-full bg-transparent text-[13px] text-ink outline-none disabled:opacity-50"
          aria-label="Reply"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending}
          aria-label="Send reply"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-[13px] text-card transition-colors hover:bg-corald disabled:opacity-50"
        >
          ↑
        </button>
      </div>
      {error && <p className="mt-2 px-2 text-[12px] text-corald">{error}</p>}
    </div>
  );
}

import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { getMyThread } from '@/lib/actions/club-actions';
import { MessagesThread } from '@/components/club/MessagesThread';

export const metadata: Metadata = { title: 'Message Lyla' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  await requireUser();
  const initial = await getMyThread();
  return (
    <div className="mx-auto flex h-[calc(100vh-56px-53px)] max-w-2xl flex-col p-5 md:p-7 lg:h-[calc(100vh-56px)]">
      
      <h1 className="mt-2 font-display text-3xl font-normal text-night-text">Message Lyla</h1>
      <MessagesThread initial={initial} />
    </div>
  );
}

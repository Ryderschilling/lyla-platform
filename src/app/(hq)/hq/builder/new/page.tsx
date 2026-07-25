import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { nextDropDefault } from '@/lib/dates';
import { BuilderForm } from '@/components/hq/BuilderForm';

export const metadata: Metadata = { title: 'New workout' };
export const dynamic = 'force-dynamic';

export default async function NewWorkoutPage({ searchParams }: { searchParams: { date?: string } }) {
  await requireAdmin();
  const def = nextDropDefault();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? '') ? searchParams.date! : def.date;
  const time = def.time;
  return (
    <BuilderForm
      initial={{
        id: undefined,
        title: '',
        subtitle: '',
        coachNote: '',
        date,
        time,
        published: true,
        timer: { mode: 'emom', rounds: 5, intervalSec: 60, label: '' },
        movements: [{ groupLabel: 'SUPERSET A — REST 1:00', name: '', detail: '', mediaUrl: '', mediaType: null }],
      }}
    />
  );
}

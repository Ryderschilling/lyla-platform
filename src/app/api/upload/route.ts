import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

const ALLOWED = new Set(['.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Admin-only media upload for the workout builder.
 * Stores under /public/uploads and returns a public URL.
 * (Storage seam: swap this handler's write for blob storage when deploying serverless.)
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_big', max: '50MB' }, { status: 413 });

  const ext = extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) return NextResponse.json({ error: 'bad_type' }, { status: 415 });

  const dir = join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  const mediaType = ['.mp4', '.webm', '.mov'].includes(ext) ? 'video' : 'image';
  return NextResponse.json({ url: `/uploads/${name}`, mediaType });
}

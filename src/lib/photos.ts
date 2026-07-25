import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Named photo-slot manifest. Lyla's batch drops into /public/photos with these
 * exact names and every page picks them up with ZERO code changes.
 * Missing file -> styled placeholder (sandbar block, mono slot name, right aspect).
 */
const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const VID_EXT = ['.mp4', '.webm', '.mov'];
const DIR = () => join(process.cwd(), 'public', 'photos');

function findFile(base: string, exts: string[]): string | null {
  for (const ext of exts) {
    if (existsSync(join(DIR(), base + ext))) return `/photos/${base}${ext}`;
  }
  return null;
}

export type PhotoManifest = Record<string, string | null>;
export type ReelSlot = { slot: string; src: string | null; poster: string | null };

export const PHOTO_SLOTS = [
  'hero-main',
  'about-01', 'about-02', 'about-03',
  'club-01', 'club-02', 'club-03', 'club-04',
  'locker-01', 'locker-02', 'locker-03', 'locker-04', 'locker-05', 'locker-06',
] as const;

export function getPhotoManifest(): PhotoManifest {
  const m: PhotoManifest = {};
  for (const slot of PHOTO_SLOTS) m[slot] = findFile(slot, IMG_EXT);
  return m;
}

export function getReels(count = 20): ReelSlot[] {
  const reels: ReelSlot[] = [];
  for (let i = 1; i <= count; i++) {
    const slot = `reel-${String(i).padStart(2, '0')}`;
    reels.push({ slot, src: findFile(slot, VID_EXT), poster: findFile(`${slot}-poster`, IMG_EXT) });
  }
  return reels;
}

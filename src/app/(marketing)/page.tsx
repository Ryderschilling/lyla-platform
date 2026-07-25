import { getPhotoManifest, getReels } from '@/lib/photos';
import { HomeClient } from '@/components/marketing/HomeClient';

export default function HomePage() {
  const photos = getPhotoManifest();
  const reels = getReels(3);
  return <HomeClient photos={photos} reels={reels} />;
}

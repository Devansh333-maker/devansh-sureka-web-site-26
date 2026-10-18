import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Character lab',
  robots: { index: false, follow: false },
};

const CharacterLab = dynamic(() => import('@/components/character/CharacterLab').then((m) => m.CharacterLab));

export default function CharacterLabPage() {
  return <CharacterLab />;
}

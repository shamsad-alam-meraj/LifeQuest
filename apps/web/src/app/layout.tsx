import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource-variable/inter';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '../components/PwaRegister';

export const metadata: Metadata = {
  title: { default: 'LifeQuest — Turn real life into an adventure', template: '%s · LifeQuest' },
  description: 'LifeQuest is an open-source, AI-powered game that turns your real-world goals into quests, skills and achievements. Free, private, local-first.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
  openGraph: { type: 'website', title: 'LifeQuest — Turn real life into an adventure', description: 'AI-generated quests for your real goals. Level up skills, keep streaks, unlock achievements.' },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#070b24', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}

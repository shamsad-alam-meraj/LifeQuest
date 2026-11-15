import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource-variable/inter';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '../components/PwaRegister';
import { AUTHOR, DESCRIPTION, KEYWORDS, PORTFOLIO, SITE_NAME, SITE_URL, TITLE } from '../lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s · ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: KEYWORDS,
  authors: [{ name: AUTHOR, url: PORTFOLIO }],
  creator: AUTHOR,
  category: 'lifestyle',
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icons/192', sizes: '192x192', type: 'image/png' }], apple: '/apple-icon' },
  // og:image / twitter:image come from app/opengraph-image.tsx and app/twitter-image.tsx
  openGraph: { type: 'website', siteName: SITE_NAME, title: TITLE, description: DESCRIPTION, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  formatDetection: { telephone: false, email: false, address: false },
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

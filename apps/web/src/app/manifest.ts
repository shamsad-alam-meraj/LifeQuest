import type { MetadataRoute } from 'next';
import { DESCRIPTION, SITE_NAME } from '../lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: `${SITE_NAME}: real life, levelled up`,
    short_name: SITE_NAME,
    description: DESCRIPTION,
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070b24',
    theme_color: '#070b24',
    lang: 'en',
    categories: ['games', 'lifestyle', 'productivity'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'My quests', url: '/app/adventures' },
      { name: 'Journey', url: '/app/journey' },
    ],
  };
}

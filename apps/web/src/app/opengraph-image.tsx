import { ImageResponse } from 'next/og';
import { SITE_NAME } from '../lib/site';

export const alt = 'LifeQuest: turn real life into an adventure';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** 1200x630 share card used for Open Graph (Facebook, LinkedIn, WhatsApp, Slack, Discord) and X/Twitter. */
export default function OpenGraphImage() {
  const chip = (t: string) => <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', fontSize: 26, color: '#e7e5ff' }}>{t}</div>;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', color: '#ffffff', background: 'radial-gradient(ellipse at 85% 0%, #5b2fd1 0%, rgba(91,47,209,0) 55%), radial-gradient(ellipse at 0% 100%, #1d4ed8 0%, rgba(29,78,216,0) 50%), #070b24' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ display: 'flex', width: 84, height: 84, borderRadius: 22, background: 'linear-gradient(135deg, #8b5cf6, #2563eb)', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="54" height="54" viewBox="0 0 64 64"><path d="M32 6l7 16 17 2-13 12 4 17-15-9-15 9 4-17L8 24l17-2z" fill="#fbbf24" /></svg>
          </div>
          <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, letterSpacing: 2, color: '#fbbf24' }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>Turn real life into an adventure.</div>
          <div style={{ display: 'flex', fontSize: 34, color: '#b4b3dc', maxWidth: 900 }}>AI-crafted quests for your real goals. Level up skills, keep streaks, join guilds.</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>{chip('Free')}{chip('Open source')}{chip('Private')}{chip('Works on any device')}</div>
      </div>
    ),
    size,
  );
}

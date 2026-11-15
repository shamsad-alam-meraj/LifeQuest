'use client';

import { useId } from 'react';

/** Original mascot: "Ember" the fox. Pure SVG. `gear` is the equipped map (slot -> item id). */
export function Fox({ size = 120, cheer = false, gear = {} }: { size?: number; cheer?: boolean; gear?: Record<string, string> }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="-6 -22 132 142" role="img" aria-label="Ember the fox" className={`drop-shadow-[0_10px_18px_rgba(0,0,0,.5)] ${cheer ? 'animate-hop' : 'animate-bob'}`}>
      <defs>
        <linearGradient id={`fx${uid}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffa24a" /><stop offset="1" stopColor="#f26a1b" /></linearGradient>
        <radialGradient id={`au${uid}`}><stop offset="0.5" stopColor={gear.aura === 'starlight' ? '#a855f7' : '#fbbf24'} stopOpacity="0.55" /><stop offset="1" stopColor={gear.aura === 'starlight' ? '#a855f7' : '#fbbf24'} stopOpacity="0" /></radialGradient>
      </defs>
      {gear.aura && <circle cx="60" cy="62" r="68" fill={`url(#au${uid})`} />}
      {gear.aura === 'starlight' && [[8, 6], [112, 14], [4, 80], [116, 84], [60, -14]].map(([x, y], i) => <path key={i} d={`M${x} ${y! - 5}l1.800 3.200 3.200 1.800-3.200 1.800L${x} ${y! + 5}l-1.800-3.200-3.200-1.800 3.200-1.800z`} fill="#fde68a" />)}
      <path d="M96 78c18-4 22-28 8-40 2 14-6 22-20 26z" fill={`url(#fx${uid})`} />
      <path d="M100 56c4 6 3 12-2 16" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M22 18l22 16-4 20zM98 18L76 34l4 20z" fill={`url(#fx${uid})`} />
      <path d="M27 26l12 9-2 10zM93 26L81 35l2 10z" fill="#3b1a0e" />
      <ellipse cx="60" cy="64" rx="40" ry="34" fill={`url(#fx${uid})`} />
      <path d="M20 70c10 22 30 30 40 30s30-8 40-30c-8 8-22 12-40 12S28 78 20 70z" fill="#fff6e8" />
      <ellipse cx="44" cy="62" rx="6" ry="7.5" fill="#1a1033" /><ellipse cx="76" cy="62" rx="6" ry="7.5" fill="#1a1033" />
      <circle cx="46" cy="59" r="2.2" fill="#fff" /><circle cx="78" cy="59" r="2.2" fill="#fff" />
      <path d="M55 75q5 4 10 0" stroke="#3b1a0e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="60" cy="72" rx="4" ry="3" fill="#2a1208" />
      <circle cx="32" cy="74" r="5" fill="#ff7a8a" opacity=".45" /><circle cx="88" cy="74" r="5" fill="#ff7a8a" opacity=".45" />
      {gear.neck === 'scarf' && <g><path d="M30 90q30 18 60 0l3 9q-33 18-66 0z" fill="#e11d48" /><path d="M82 96l8 16-9 2-4-14z" fill="#be123c" /></g>}
      {gear.face === 'glasses' && <g fill="rgba(255,255,255,.14)" stroke="#2a1208" strokeWidth="2.5"><circle cx="44" cy="62" r="11" /><circle cx="76" cy="62" r="11" /><path d="M55 62h10" fill="none" /></g>}
      {gear.head === 'wizard' && <g><path d="M26 36L62 -18 94 36z" fill="#6d28d9" /><ellipse cx="60" cy="36" rx="40" ry="7" fill="#4c1d95" /><path d="M62 4l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#fde68a" /></g>}
      {gear.head === 'crown' && <path d="M34 30L38 4l14 14 8-18 8 18 14-14 4 26z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />}
    </svg>
  );
}

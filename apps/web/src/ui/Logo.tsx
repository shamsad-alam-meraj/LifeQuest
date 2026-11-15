'use client';

export function Logo({ size = 28, hideText = false }: { size?: number; hideText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-wide">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8b5cf6" /><stop offset="1" stopColor="#2563eb" /></linearGradient></defs>
        <rect width="64" height="64" rx="16" fill="url(#lg)" />
        <path d="M32 10l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2z" fill="#fbbf24" />
      </svg>
      {hideText ? <span className="sr-only">LifeQuest</span> : <span>LifeQuest</span>}
    </span>
  );
}

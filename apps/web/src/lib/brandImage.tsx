/** The LifeQuest mark for generated images (ImageResponse). `inset` keeps it inside a maskable-icon safe zone. */
export function BrandMark({ size, inset = 0 }: { size: number; inset?: number }) {
  const inner = size - inset * 2;
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6, #2563eb)' }}>
      <svg width={inner * 0.62} height={inner * 0.62} viewBox="0 0 64 64">
        <path d="M32 6l7 16 17 2-13 12 4 17-15-9-15 9 4-17L8 24l17-2z" fill="#fbbf24" />
      </svg>
    </div>
  );
}

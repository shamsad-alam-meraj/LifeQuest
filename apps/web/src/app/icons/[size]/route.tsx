import { ImageResponse } from 'next/og';
import { BrandMark } from '../../../lib/brandImage';

const SIZES = new Set(['192', '512']);

/** PNG app icons for the web manifest (/icons/192, /icons/512). Full-bleed with the mark inset so it is also maskable-safe. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 });
  const px = Number(size);
  return new ImageResponse(<BrandMark size={px} inset={Math.round(px * 0.1)} />, { width: px, height: px, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
}

import { isIP } from 'node:net';

/**
 * Best-effort client IP. On Vercel the platform sets/overwrites these headers, so they can be trusted there.
 * If you self-host without a reverse proxy that overwrites them, a client could spoof its IP.
 */
export function getClientIp(h: Pick<Headers, 'get'>): string | null {
  const raw = h.get('x-vercel-forwarded-for') ?? h.get('x-forwarded-for') ?? h.get('x-real-ip');
  let ip = raw?.split(',')[0]?.trim() ?? '';
  const bracket = /^\[([^\]]+)\](?::\d+)?$/.exec(ip); // [::1]:1234
  if (bracket) ip = bracket[1]!;
  else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(':')); // 1.2.3.4:5678
  return isIP(ip) ? ip : null;
}

/** Trim a user agent to something storable. */
export const cleanUserAgent = (ua: string | null | undefined): string | null => (ua ? ua.slice(0, 300) : null);

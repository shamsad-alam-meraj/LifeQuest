/** Only allow same-site relative redirects (blocks open-redirect via ?next=https://evil.com or //evil.com). */
export function safeNextPath(next: string | null | undefined, fallback = '/app'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || /[\r\n]/.test(next)) return fallback;
  return next;
}

export type LinkError = 'link' | 'browser' | 'unavailable';
export const LINK_ERRORS: Record<LinkError, string> = {
  link: 'That sign-in link is invalid or has expired. Request a new code below.',
  browser: 'Please open the sign-in link in the same browser where you requested it, or enter the code from the email instead.',
  unavailable: 'Sign-in is temporarily unavailable. Please try again later.',
};

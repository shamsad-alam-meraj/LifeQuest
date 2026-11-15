'use client';

import type { AnchorHTMLAttributes } from 'react';

/**
 * Link between tabs of the in-app shell. The shell renders every tab on the client, so switching is just a URL change:
 * history.pushState is picked up by Next's usePathname without any server round trip.
 * Do not use for links that leave the shell (use next/link).
 */
export default function AppLink({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return;
        e.preventDefault();
        if (window.location.pathname !== href) window.history.pushState(null, '', href);
        window.scrollTo({ top: 0 });
      }}
    />
  );
}

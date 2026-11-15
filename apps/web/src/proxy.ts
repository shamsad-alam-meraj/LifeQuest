import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from './lib/supabase';

/**
 * 1. Rescues sign-in links that land on the wrong page: if Supabase's Site URL points at `/` (or the link opens /login)
 *    the token arrives as ?code= / ?token_hash=. Forward those to /auth/confirm so the user is still signed in.
 * 2. Keeps the Supabase session cookie fresh on app requests.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if ((pathname === '/' || pathname === '/login') && (searchParams.has('code') || searchParams.has('token_hash'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/confirm';
    return NextResponse.redirect(url);
  }
  if (pathname === '/') return NextResponse.next(); // landing page: no session work needed

  const cfg = supabaseConfig();
  if (!cfg) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getClaims(); // refreshes the session if needed
  return response;
}

export const config = { matcher: ['/', '/app/:path*', '/login'] };

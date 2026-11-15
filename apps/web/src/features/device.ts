import { useEffect, useRef, useState } from 'react';

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** "Add to home screen" support (Chromium). `canInstall` is false once installed or when unsupported. */
export function useInstall() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); };
    const done = () => setEvt(null);
    window.addEventListener('beforeinstallprompt', on);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done); };
  }, []);
  return { canInstall: !!evt, install: async () => { await evt?.prompt(); setEvt(null); } };
}

export const notificationsSupported = () => typeof Notification !== 'undefined';

async function show(title: string, body: string) {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) return reg.showNotification(title, { body, icon: './icon.svg', tag: 'lifequest-reminder' });
  new Notification(title, { body, icon: './icon.svg' });
}

/**
 * Daily reminder while the app (or installed PWA) is open. True background push needs a server,
 * so this is a gentle in-session nudge, skipped if you already played today.
 */
export function useReminder(time: string | undefined, doneToday: boolean) {
  const done = useRef(doneToday);
  done.current = doneToday;
  const perm = notificationsSupported() ? Notification.permission : 'denied';
  useEffect(() => {
    if (!time || perm !== 'granted') return;
    const [h, m] = time.split(':').map(Number);
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const next = new Date(); next.setHours(h ?? 18, m ?? 0, 0, 0);
      if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
      t = setTimeout(() => { if (!done.current) void show('Your quest awaits ⚔️', 'A small real-world step keeps your streak alive.'); schedule(); }, next.getTime() - Date.now());
    };
    schedule();
    return () => clearTimeout(t);
  }, [time, perm]);
}

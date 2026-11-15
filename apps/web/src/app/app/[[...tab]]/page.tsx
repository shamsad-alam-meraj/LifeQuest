import { notFound } from 'next/navigation';

const TABS = new Set(['', 'adventures', 'journey', 'journal', 'guild', 'trophies', 'settings']);

/** The UI for every tab lives in AppShell (client side); this page only rejects unknown URLs. */
export default async function AppPage({ params }: { params: Promise<{ tab?: string[] }> }) {
  const { tab = [] } = await params;
  if (tab.length > 1 || !TABS.has(tab[0] ?? '')) notFound();
  return null;
}

export interface ShareData { name: string; title: string; level: number; xp: number; streak: number; quests: number; skills: { name: string; xp: number }[] }

/** Renders a 1200x630 progress card (PNG) entirely on-device. */
export async function renderShareCard(d: ShareData): Promise<Blob> {
  try { await Promise.all([document.fonts.load('700 56px Cinzel'), document.fonts.load('500 28px "Inter Variable"')]); } catch { /* fall back to system fonts */ }
  const c = document.createElement('canvas'); c.width = 1200; c.height = 630;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 1200, 630); bg.addColorStop(0, '#2a1a6e'); bg.addColorStop(1, '#070b24');
  g.fillStyle = bg; g.fillRect(0, 0, 1200, 630);
  const glow = g.createRadialGradient(950, 80, 20, 950, 80, 500); glow.addColorStop(0, 'rgba(168,85,247,.45)'); glow.addColorStop(1, 'rgba(168,85,247,0)');
  g.fillStyle = glow; g.fillRect(0, 0, 1200, 630);
  const display = '"Cinzel", Georgia, serif', body = '"Inter Variable", system-ui, sans-serif';
  g.fillStyle = '#fbbf24'; g.font = `700 30px ${display}`; g.fillText('⚔  LIFEQUEST', 64, 84);
  g.fillStyle = '#f1f0ff'; g.font = `700 64px ${display}`; g.fillText(d.name.slice(0, 22), 64, 190);
  g.fillStyle = '#b4b3dc'; g.font = `500 28px ${body}`; g.fillText(`${d.title} · Level ${d.level}`, 64, 238);
  const stats: [string, string][] = [[String(d.xp), 'Total XP'], [`${d.streak}d`, 'Streak'], [String(d.quests), 'Quests done']];
  stats.forEach(([v, l], i) => {
    const x = 64 + i * 250;
    g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(x, 290, 226, 120, 20); g.fill();
    g.fillStyle = '#fbbf24'; g.font = `700 52px ${display}`; g.fillText(v, x + 24, 358);
    g.fillStyle = '#b4b3dc'; g.font = `500 22px ${body}`; g.fillText(l, x + 24, 392);
  });
  const top = [...d.skills].sort((a, b) => b.xp - a.xp).slice(0, 3); const max = Math.max(1, ...top.map((s) => s.xp));
  top.forEach((s, i) => {
    const y = 450 + i * 52;
    g.fillStyle = '#f1f0ff'; g.font = `600 24px ${body}`; g.fillText(s.name.slice(0, 18), 64, y + 22);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.roundRect(300, y + 4, 520, 20, 10); g.fill();
    g.fillStyle = '#fbbf24'; g.beginPath(); g.roundRect(300, y + 4, Math.max(20, (s.xp / max) * 520), 20, 10); g.fill();
    g.fillStyle = '#b4b3dc'; g.font = `500 20px ${body}`; g.fillText(`${s.xp} XP`, 840, y + 22);
  });
  g.fillStyle = '#7f7eb0'; g.font = `500 20px ${body}`; g.textAlign = 'right'; g.fillText('Real life, levelled up.', 1136, 590);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not render card'))), 'image/png'));
}

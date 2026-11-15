import { levelFromXp, streakDays, titleForLevel, totalXp, type GameState, type Quest } from '@lifequest/core';
import { downloadBlob } from './csv';

/** jsPDF's built-in fonts are Latin-1 only: replace emoji / other scripts so the text never turns into garbage. */
const latin = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '?').replace(/\?{2,}/g, '?');

/** Builds the PDF report. jsPDF is loaded on demand so it never weighs down the main bundle. */
export async function downloadPdf(state: GameState, quests: Quest[] = state.quests, title = 'LifeQuest Report', name = 'lifequest-report.pdf') {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48;
  let y = M;
  const ensure = (h: number) => { if (y + h > H - M) { doc.addPage(); y = M; } };
  const text = (s: string, size = 10, bold = false, color: [number, number, number] = [30, 30, 50], indent = 0) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...color);
    for (const line of doc.splitTextToSize(latin(s), W - 2 * M - indent) as string[]) { ensure(size + 4); doc.text(line, M + indent, y); y += size + 4; }
  };

  const xp = totalXp(state), level = levelFromXp(xp);
  doc.setFillColor(36, 24, 100).rect(0, 0, W, 86, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(251, 191, 36).text('LifeQuest', M, 42);
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(235, 233, 255).text(latin(`${title}  |  ${new Date().toISOString().slice(0, 10)}`), M, 64);
  y = 120;

  text(state.profile?.name ?? 'Adventurer', 18, true);
  y += 2;
  text(`${titleForLevel(level)}  |  Level ${level}  |  ${xp} XP  |  ${streakDays(state)}-day streak  |  ${state.quests.filter((q) => q.status === 'completed').length} quests completed`, 10, false, [90, 90, 120]);
  y += 12;

  text('Skills', 14, true); y += 2;
  const skills = [...state.skills].sort((a, b) => b.xp - a.xp);
  if (!skills.length) text('No skills yet.', 10, false, [120, 120, 140]);
  const max = Math.max(1, ...skills.map((k) => k.xp));
  for (const k of skills) {
    ensure(18);
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(30, 30, 50).text(latin(`${k.name}  (Lv ${levelFromXp(k.xp)})`), M, y);
    doc.setFillColor(230, 230, 240).roundedRect(M + 190, y - 8, 220, 8, 4, 4, 'F');
    doc.setFillColor(245, 158, 11).roundedRect(M + 190, y - 8, Math.max(6, (k.xp / max) * 220), 8, 4, 4, 'F');
    doc.text(`${k.xp} XP`, M + 420, y);
    y += 18;
  }
  y += 12;

  text('Quest journal', 14, true); y += 4;
  const list = [...quests].filter((q) => q.status === 'completed').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  if (!list.length) text('No completed quests yet.', 10, false, [120, 120, 140]);
  for (const q of list) {
    ensure(46);
    text(`${q.completedAt?.slice(0, 10) ?? ''}  -  ${q.title}`, 11, true);
    text(`${state.skills.find((k) => k.id === q.skillId)?.name ?? ''}  |  ${q.difficulty}  |  +${q.xp} XP`, 9, false, [110, 110, 140], 0);
    text(q.action, 10, false, [60, 60, 80]);
    if (q.reflection) text(`"${q.reflection}"`, 10, false, [100, 70, 160], 10);
    y += 8;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(150, 150, 170).text(`LifeQuest  |  page ${i} of ${pages}`, W / 2, H - 24, { align: 'center' }); }
  downloadBlob(doc.output('blob'), name);
}

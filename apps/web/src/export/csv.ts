import type { GameState, Quest } from '@lifequest/core';

export const QUEST_HEADER = ['Date completed', 'Title', 'Type', 'Skill', 'Difficulty', 'XP', 'Status', 'Action', 'Reflection'];

/** Neutralise spreadsheet formula injection: user text starting with = + - @ would execute in Excel/Sheets. */
const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

export function toCsv(rows: string[][]): string {
  const cell = (v: string) => `"${safe(v).replace(/"/g, '""')}"`;
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'; // BOM so Excel reads UTF-8
}

export function questRows(state: GameState, quests: Quest[] = state.quests): string[][] {
  const skill = (id: string) => state.skills.find((k) => k.id === id)?.name ?? '';
  // completed quests first (newest first), then the rest by creation date
  const sorted = [...quests].sort((a, b) => Number(!!b.completedAt) - Number(!!a.completedAt) || (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt));
  return [QUEST_HEADER, ...sorted.map((q) => [q.completedAt?.slice(0, 10) ?? '', q.title, q.kind ?? 'normal', skill(q.skillId), q.difficulty, String(q.xp), q.status, q.action, q.reflection ?? ''])];
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadCsv = (state: GameState, quests?: Quest[], name = 'lifequest-quests.csv') =>
  downloadBlob(new Blob([toCsv(questRows(state, quests))], { type: 'text/csv;charset=utf-8' }), name);

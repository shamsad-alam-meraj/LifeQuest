import { describe, expect, it, vi } from 'vitest';
import { addAdventure, completeQuest, createProfile, emptyState, fallbackAdventure } from '@lifequest/core';

const saved: Blob[] = [];
vi.mock('./csv', () => ({ downloadBlob: (b: Blob) => { saved.push(b); } }));

describe('pdf export', () => {
  it('works with no data at all (no profile, skills or quests)', async () => {
    const { downloadPdf } = await import('./pdf');
    await expect(downloadPdf(emptyState())).resolves.toBeUndefined();
    expect(saved.at(-1)!.size).toBeGreaterThan(500);
  });
  it('works for a profile with no quests', async () => {
    const { downloadPdf } = await import('./pdf');
    await expect(downloadPdf(createProfile(emptyState(), { name: 'T', interests: [], goals: [], dailyQuestLimit: 3 }))).resolves.toBeUndefined();
  });
  it('handles emoji, long text and many pages', async () => {
    const { downloadPdf } = await import('./pdf');
    let s = addAdventure(createProfile(emptyState(), { name: 'Zoë 🦊', interests: [], goals: [], dailyQuestLimit: 99 }), 'g', fallbackAdventure('g'));
    for (let i = 0; i < 5; i++) { const r = completeQuest(s, s.quests[i]!.id, 'x '.repeat(400) + '🎉 日本語', new Date(`2026-03-0${i + 1}T10:00:00Z`)); if (!r.ok) throw new Error(r.reason); s = r.state; }
    await expect(downloadPdf(s)).resolves.toBeUndefined();
  });
});

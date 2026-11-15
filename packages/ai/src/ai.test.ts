import { describe, expect, it } from 'vitest';
import { generateAdventure, generateQuest, parseAdventure, systemPrompt } from './index';

const good = { title: 'T', premise: 'P', quests: [{ title: 'a', story: 's', action: 'x', skill: 'Run', difficulty: 'easy' }] };
const input = { goal: 'run a 5k', interests: ['running'], existingSkills: [], recentCompleted: [] };
const resp = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });

describe('parseAdventure', () => {
  it('handles fenced JSON with chatter', () => {
    expect(parseAdventure('Sure!\n```json\n' + JSON.stringify(good) + '\n```').title).toBe('T');
  });
  it('rejects invalid shapes', () => {
    expect(() => parseAdventure('{"title":"x"}')).toThrow();
    expect(() => parseAdventure('nope')).toThrow();
  });
});

describe('generateAdventure', () => {
  it('uses fallback without a key', async () => {
    expect((await generateAdventure(input, null)).source).toBe('fallback');
  });
  it('parses an OpenAI-style response', async () => {
    const r = await generateAdventure(input, { provider: 'groq', apiKey: 'k' }, resp({ choices: [{ message: { content: JSON.stringify(good) } }] }));
    expect(r.source).toBe('ai');
  });
  it('parses a Gemini response', async () => {
    const r = await generateAdventure(input, { provider: 'gemini', apiKey: 'k' }, resp({ candidates: [{ content: { parts: [{ text: JSON.stringify(good) }] } }] }));
    expect(r.source).toBe('ai');
  });
  it('falls back with an error on auth failure', async () => {
    const r = await generateAdventure(input, { provider: 'groq', apiKey: 'bad' }, resp({ error: 'no' }, 401));
    expect(r.source).toBe('fallback');
    expect(r.error).toMatch(/401/);
  });
});

describe('generateQuest', () => {
  it('returns the first quest from an AI response', async () => {
    const r = await generateQuest('daily', input, { provider: 'groq', apiKey: 'k' }, resp({ choices: [{ message: { content: JSON.stringify(good) } }] }));
    expect(r.source).toBe('ai'); expect(r.quest.title).toBe('a');
  });
  it('falls back offline and on errors, never throwing', async () => {
    expect((await generateQuest('boss', input, null)).source).toBe('fallback');
    const r = await generateQuest('reroll', input, { provider: 'groq', apiKey: 'k' }, resp({}, 500));
    expect(r.source).toBe('fallback'); expect(r.error).toMatch(/500/);
  });
  it('asks for exactly the requested count', () => {
    expect(systemPrompt(1)).toContain('exactly 1 quest.');
    expect(systemPrompt(5)).toContain('exactly 5 quests');
  });
});

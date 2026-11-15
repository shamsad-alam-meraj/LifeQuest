import type { Skill } from './types';

let counter = 0;
export const newId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ICONS = ['🧠', '💪', '🎨', '🗣️', '🌱', '🔧', '📚', '🎵', '🧭', '💼'];

export function ensureSkill(skills: Skill[], name: string): { skills: Skill[]; skill: Skill } {
  const id = slug(name) || 'general';
  const found = skills.find((k) => k.id === id);
  if (found) return { skills, skill: found };
  const skill: Skill = { id, name: name.trim() || 'General', icon: ICONS[skills.length % ICONS.length]!, xp: 0 };
  return { skills: [...skills, skill], skill };
}

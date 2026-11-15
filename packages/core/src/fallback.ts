import type { AdventureDraft, QuestDraft } from './types';

/** Offline, no-AI adventure generator so the app always works. */
export function fallbackAdventure(goal: string, interests: string[] = []): AdventureDraft {
  const g = goal.trim() || 'a better life';
  const skill = interests[0] ?? 'Discipline';
  return {
    title: `The Road to ${g.charAt(0).toUpperCase()}${g.slice(1)}`,
    premise: `A path opens before you. Each real step toward "${g}" brings the world into focus.`,
    quests: [
      { title: 'Scout the Terrain', story: 'Every journey starts with a map.', action: `Spend 15 minutes writing down what "${g}" concretely looks like and what the first obstacle is.`, skill: 'Planning', difficulty: 'easy' },
      { title: 'The First Move', story: 'Momentum beats perfection.', action: `Do the smallest possible action toward "${g}" for 20 minutes, with no distractions.`, skill, difficulty: 'easy' },
      { title: 'Seek a Guide', story: 'No hero walks alone.', action: `Find one person, book or tutorial that can teach you something about "${g}" and take notes.`, skill: 'Learning', difficulty: 'medium' },
      { title: 'Trial of Practice', story: 'Repetition forges skill.', action: `Do a focused 45-minute session on "${g}" and note one thing you got better at.`, skill, difficulty: 'medium' },
      { title: 'Show Your Work', story: 'Deeds become legend when witnessed.', action: `Share something you made or learned about "${g}" with a friend or community.`, skill: 'Communication', difficulty: 'hard' },
    ],
  };
}

const DAILY: QuestDraft[] = [
  { title: 'Morning Stretch', story: 'The body is the first instrument.', action: 'Stretch or walk for 10 minutes before checking your phone.', skill: 'Fitness', difficulty: 'easy' },
  { title: 'Gratitude Journal', story: 'Name the light before you chase it.', action: 'Write three specific things you are grateful for today.', skill: 'Mindfulness', difficulty: 'easy' },
  { title: 'Deep Work Sprint', story: 'Silence the horn; sharpen the blade.', action: 'Do 25 focused minutes on your most important task with notifications off.', skill: 'Focus', difficulty: 'medium' },
  { title: 'Reach Out', story: 'Allies are forged by small messages.', action: 'Message someone you have not spoken to in a while.', skill: 'Communication', difficulty: 'easy' },
  { title: 'Learn One Thing', story: 'A scroll unrolled is a lesson earned.', action: 'Read or watch 20 minutes of something that teaches a skill you want.', skill: 'Learning', difficulty: 'medium' },
  { title: 'Tidy the Camp', story: 'A clear camp, a clear mind.', action: 'Spend 15 minutes tidying one space you use every day.', skill: 'Discipline', difficulty: 'easy' },
];

const BOSS: QuestDraft[] = [
  { title: 'The Long Trek', story: 'Some roads are walked, not scrolled.', action: 'Go on a 60+ minute walk, run or ride outdoors with no podcast and no phone calls.', skill: 'Fitness', difficulty: 'hard' },
  { title: 'Ship Something', story: 'Finished beats perfect.', action: 'Finish and share one small project you have been putting off.', skill: 'Creativity', difficulty: 'epic' },
  { title: 'The Hard Conversation', story: 'The dragon is only silence.', action: 'Have the conversation you have been avoiding, calmly and kindly.', skill: 'Communication', difficulty: 'hard' },
  { title: 'Teach It Forward', story: 'Mastery is proven by the telling.', action: 'Teach someone something you know, for at least 30 minutes.', skill: 'Learning', difficulty: 'hard' },
];

/** Offline daily/boss quest. `rng` is injectable for tests. */
export function fallbackQuest(kind: 'daily' | 'boss', rng: () => number = Math.random): QuestDraft {
  const pool = kind === 'daily' ? DAILY : BOSS;
  return pool[Math.floor(rng() * pool.length)]!;
}

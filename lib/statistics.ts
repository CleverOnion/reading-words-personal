import { progressFromAnswers } from './study.ts';

export type StatisticsAttempt = { wordId: string; correct: boolean; at: number; duration: number; rating?:'forgotten'|'fuzzy'|'remembered' };
export type StatisticsSession = { mode: string; status: string; passageId: string | null };
export type StatisticsPassage = { id: string; year: number; text: number; words: readonly { id: string }[] };
export type StatisticsInput = {
  attempts: readonly StatisticsAttempt[];
  sessions: readonly StatisticsSession[];
  passages: readonly StatisticsPassage[];
  days: 7 | 30 | 90;
  now: number;
};

const DAY = 86_400_000;
const SHANGHAI_OFFSET = 8 * 3_600_000;
const dayOf = (timestamp: number) => Math.floor((timestamp + SHANGHAI_OFFSET) / DAY);
const dateOf = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
const rate = (remembered: number, attempts: number) => attempts ? remembered / attempts : null;

/** Rates are fractions; durations are milliseconds. All dates use Asia/Shanghai (UTC+8). */
export function buildStatistics({ attempts, sessions, passages, days, now }: StatisticsInput) {
  const words = new Set(passages.flatMap(passage => passage.words.map(word => word.id)));
  const answers = attempts
    .filter(answer => words.has(answer.wordId) && Number.isFinite(answer.at) && answer.at <= now)
    .map(answer => ({ ...answer, duration: Number.isFinite(answer.duration) ? Math.min(300_000, Math.max(0, answer.duration)) : 0 }))
    .sort((a, b) => a.at - b.at);
  const today = dayOf(now);
  const startDay = today - days + 1;
  const period = answers.filter(answer => dayOf(answer.at) >= startDay);
  const previous = answers.filter(answer => dayOf(answer.at) >= startDay - days && dayOf(answer.at) < startDay);
  const progress = progressFromAnswers(answers);
  const states = Object.values(progress);
  const firstDay = new Map<string, number>();
  const activeDays = new Set<number>();
  for (const answer of answers) {
    const day = dayOf(answer.at);
    if (!firstDay.has(answer.wordId)) firstDay.set(answer.wordId, day);
    activeDays.add(day);
  }
  let longestStreak = 0;
  let run = 0;
  let previousDay = -Infinity;
  for (const day of [...activeDays].sort((a, b) => a - b)) {
    run = day === previousDay + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previousDay = day;
  }
  let currentStreak = 0;
  let cursor = activeDays.has(today) ? today : today - 1;
  while (activeDays.has(cursor--)) currentStreak++;
  const strengthened = states.filter(word => word.streak >= 3);
  const pending = states.filter(word => word.mistakes > 0 && word.streak < 3);
  const recovered = strengthened.filter(word => word.mistakes > 0);
  const remembered = period.filter(answer => answer.correct).length;
  const periodByWord = new Map<string, { attempts: number; remembered: number; mistakes: number }>();
  for (const answer of period) {
    const value = periodByWord.get(answer.wordId) ?? { attempts: 0, remembered: 0, mistakes: 0 };
    value.attempts++;
    value.remembered += Number(answer.correct);
    value.mistakes += Number(!answer.correct);
    periodByWord.set(answer.wordId, value);
  }
  const calendar = Array.from({ length: 84 }, (_, index) => ({ date: dateOf(today - 83 + index), attempts: 0, remembered: 0, forgotten: 0, duration: 0, newWords: 0 }));
  for (const answer of answers) {
    const row = calendar[dayOf(answer.at) - (today - 83)];
    if (!row) continue;
    row.attempts++;
    row.remembered += Number(answer.correct);
    row.forgotten += Number(!answer.correct);
    row.duration += answer.duration;
  }
  for (const day of firstDay.values()) {
    const row = calendar[day - (today - 83)];
    if (row) row.newWords++;
  }
  const rhythm = Array.from({ length: 6 }, (_, index) => {
    const startHour = index * 4;
    const bin = period.filter(answer => Math.floor(new Date(answer.at + SHANGHAI_OFFSET).getUTCHours() / 4) === index);
    return { label: `${String(startHour).padStart(2, '0')}–${String(startHour + 4).padStart(2, '0')}`, startHour, attempts: bin.length, rememberRate: rate(bin.filter(answer => answer.correct).length, bin.length) };
  });
  const readings = passages.map(passage => {
    const ids = [...new Set(passage.words.map(word => word.id))];
    const seen = ids.flatMap(id => progress[id] ? [progress[id]] : []);
    const periodAttempts = ids.reduce((sum, id) => sum + (periodByWord.get(id)?.attempts ?? 0), 0);
    const periodRemembered = ids.reduce((sum, id) => sum + (periodByWord.get(id)?.remembered ?? 0), 0);
    return {
      id: passage.id, year: passage.year, text: passage.text, total: ids.length, seen: seen.length,
      strengthened: seen.filter(word => word.streak >= 3).length,
      pending: seen.filter(word => word.mistakes > 0 && word.streak < 3).length,
      rounds: sessions.filter(session => session.mode === 'passage' && session.status === 'completed' && session.passageId === passage.id).length,
      lastAt: seen.length ? Math.max(...seen.map(word => word.lastAt)) : null,
      periodAttempts, periodRememberRate: rate(periodRemembered, periodAttempts),
    };
  });
  const difficult = pending
    .map(word => ({ wordId: word.wordId, mistakes: periodByWord.get(word.wordId)?.mistakes ?? 0, seen: word.seen, streak: word.streak, lastAt: word.lastAt }))
    .filter(word => word.mistakes > 0)
    .sort((a, b) => b.mistakes - a.mistakes || b.lastAt - a.lastAt)
    .slice(0, 8);
  const comebacks = recovered
    .map(word => ({ wordId: word.wordId, mistakes: word.mistakes, streak: word.streak, lastAt: word.lastAt }))
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, 6);
  const milestones = [
    { id: 'first-word', label: '开始第一个词', target: 1, current: states.length },
    { id: '100-words', label: '遇见 100 个词', target: 100, current: states.length },
    { id: '3-day-streak', label: '连续学习 3 天', target: 3, current: longestStreak },
    { id: '7-day-streak', label: '连续学习 7 天', target: 7, current: longestStreak },
    { id: '10-recovered', label: '重新记住 10 个词', target: 10, current: recovered.length },
  ].map(milestone => ({ ...milestone, achieved: milestone.current >= milestone.target }));
  return {
    days, generatedAt: now,
    summary: {
      attempts: period.length, remembered, forgotten: period.length - remembered,
      rememberRate: rate(remembered, period.length),
      previousRememberRate: rate(previous.filter(answer => answer.correct).length, previous.length),
      previousAttempts: previous.length,
      newWords: [...firstDay.values()].filter(day => day >= startDay).length,
      uniqueWords: periodByWord.size,
      duration: period.reduce((sum, answer) => sum + answer.duration, 0),
      activeDays: new Set(period.map(answer => dayOf(answer.at))).size,
      currentStreak, longestStreak, totalSeen: states.length, totalWords: words.size,
      strengthened: strengthened.length, pending: pending.length,
      due: pending.filter(word => word.dueAt <= now).length, recovered: recovered.length,
    },
    calendar, rhythm, readings, difficult, comebacks, milestones,
  };
}

export type Statistics = ReturnType<typeof buildStatistics>;

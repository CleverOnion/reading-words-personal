import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStatistics, type StatisticsAttempt } from '../lib/statistics.ts';

const now = Date.parse('2026-09-23T12:00:00+08:00');
const at = (date: string) => Date.parse(`${date}+08:00`);
const passages = [{ id: 'p1', year: 2025, text: 1, words: [{ id: 'a' }, { id: 'b' }] }, { id: 'p2', year: 2024, text: 2, words: [{ id: 'c' }] }];
const answer = (wordId: string, correct: boolean, date: string, duration = 1000): StatisticsAttempt => ({ wordId, correct, at: at(date), duration });
const stats = (attempts: StatisticsAttempt[] = [], days: 7 | 30 | 90 = 7) => buildStatistics({ attempts, sessions: [], passages, days, now });

test('empty statistics preserve unknown rates, zero coverage, and all 84 calendar days', () => {
  const result = stats();
  assert.equal(result.summary.rememberRate, null);
  assert.equal(result.summary.previousRememberRate, null);
  assert.equal(result.summary.totalWords, 3);
  assert.equal(result.summary.totalSeen, 0);
  assert.equal(result.summary.currentStreak, 0);
  assert.equal(result.calendar.length, 84);
  assert.equal(result.calendar.at(-1)?.date, '2026-09-23');
  assert.equal(result.readings[0].lastAt, null);
  assert.ok(result.rhythm.every(bin => bin.rememberRate === null));
  assert.ok(result.milestones.every(m => !m.achieved));
});

test('Shanghai midnight defines period, previous period and four-hour bins', () => {
  const result = stats([
    answer('a', true, '2026-09-16T23:59:59'),
    answer('b', false, '2026-09-17T00:00:00'),
    answer('b', false, '2026-09-23T03:59:59'),
    answer('b', false, '2026-09-23T04:00:00'),
  ]);
  assert.equal(result.summary.attempts, 3);
  assert.equal(result.summary.rememberRate, 0);
  assert.equal(result.summary.previousRememberRate, 1);
  assert.equal(result.summary.previousAttempts, 1);
  assert.deepEqual(result.rhythm.map(bin => bin.attempts), [2, 1, 0, 0, 0, 0]);
  assert.equal(result.calendar.find(day => day.date === '2026-09-17')?.attempts, 1);
});

test('repeated answers do not inflate unique coverage or first-ever new words', () => {
  const result = stats([
    answer('a', false, '2026-09-01T10:00:00'),
    answer('a', true, '2026-09-22T10:00:00', -1),
    answer('b', true, '2026-09-22T11:00:00', 500_000),
    answer('b', true, '2026-09-23T10:00:00', 2000),
    answer('unknown', true, '2026-09-23T10:00:00'),
    answer('c', true, '2026-09-23T13:00:00'),
  ]);
  assert.equal(result.summary.attempts, 3);
  assert.equal(result.summary.newWords, 1);
  assert.equal(result.summary.uniqueWords, 2);
  assert.equal(result.summary.totalSeen, 2);
  assert.equal(result.summary.duration, 302_000);
  assert.equal(result.calendar.find(day => day.date === '2026-09-22')?.newWords, 1);
  assert.equal(result.calendar.at(-1)?.newWords, 0);
  assert.equal(stats([], 90).calendar.length, 84);
});

test('streak can end yesterday, gaps reset it, longest remains historical', () => {
  const attempts = ['10', '11', '12', '21', '22'].map(day => answer('a', true, `2026-09-${day}T10:00:00`));
  assert.equal(stats(attempts).summary.currentStreak, 2);
  assert.equal(stats(attempts).summary.longestStreak, 3);
  assert.equal(stats(attempts.slice(0, 3)).summary.currentStreak, 0);
  assert.equal(stats([...attempts, answer('a', true, '2026-09-23T10:00:00')]).summary.currentStreak, 3);
});

test('chronological recovery, later relapse and due state follow shared study rules', () => {
  const attempts = [false, true, true, true].map((correct, i) => answer('a', correct, `2026-09-${18 + i}T10:00:00`));
  const recovered = stats([...attempts].reverse());
  assert.equal(recovered.summary.recovered, 1);
  assert.equal(recovered.summary.strengthened, 1);
  assert.equal(recovered.summary.pending, 0);
  assert.equal(recovered.comebacks[0].wordId, 'a');
  assert.equal(recovered.difficult.length, 0);
  const relapse = stats([...attempts, answer('a', false, '2026-09-23T10:00:00')]);
  assert.equal(relapse.summary.recovered, 0);
  assert.equal(relapse.summary.pending, 1);
  assert.equal(relapse.summary.due, 1);
  assert.deepEqual(relapse.difficult[0], { wordId: 'a', mistakes: 2, seen: 5, streak: 0, lastAt: at('2026-09-23T10:00:00') });
  assert.equal(stats([answer('a', false, '2026-09-22T10:00:00'), answer('a', true, '2026-09-23T10:00:00')]).summary.due, 0);
});

test('reading coverage is all-time and only completed passage sessions count as rounds', () => {
  const result = buildStatistics({ now, days: 7, passages, attempts: [answer('a', true, '2026-09-01T10:00:00'), answer('b', false, '2026-09-23T10:00:00')], sessions: [
    { mode: 'passage', status: 'completed', passageId: 'p1' },
    { mode: 'wrong', status: 'completed', passageId: 'p1' },
    { mode: 'passage', status: 'active', passageId: 'p1' },
  ] });
  assert.equal(result.readings[0].seen, 2);
  assert.equal(result.readings[0].periodAttempts, 1);
  assert.equal(result.readings[0].periodRememberRate, 0);
  assert.equal(result.readings[0].rounds, 1);
  assert.equal(result.readings[1].periodRememberRate, null);
});

test('same-time answers retain input order and source input is not mutated', () => {
  const attempts = [answer('a', true, '2026-09-23T10:00:00'), answer('a', false, '2026-09-23T10:00:00')];
  const snapshot = structuredClone(attempts);
  assert.equal(stats(attempts).difficult[0].streak, 0);
  assert.deepEqual(attempts, snapshot);
});

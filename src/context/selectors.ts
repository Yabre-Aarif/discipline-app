import type { AppState, Daily, Goal } from "./types";
import { addDays, cycleDayFor, dateKey, diffDays, parseDateKey, todayKey, weekdayLetterFR } from "../utils/date";

export function getCycleDay(state: AppState): number {
  if (!state.cycleStartDate) return 1;
  return cycleDayFor(state.cycleStartDate, todayKey());
}

export function getTodayChecks(state: AppState): Record<string, boolean> {
  return state.history[todayKey()] ?? {};
}

export function getDoneCount(state: AppState): { done: number; total: number } {
  const checks = getTodayChecks(state);
  const total = state.dailies.length;
  const done = state.dailies.filter((d) => checks[d.id]).length;
  return { done, total };
}

export function getDailyPct(state: AppState, daily: Daily): number {
  const start = daily.createdDate;
  const end = todayKey();
  const daysActive = Math.max(1, diffDays(start, end) + 1);
  let doneCount = 0;
  for (let i = 0; i < daysActive; i++) {
    const key = dateKey(addDays(parseDateKey(start), i));
    if (state.history[key]?.[daily.id]) doneCount += 1;
  }
  return Math.round((doneCount / daysActive) * 100);
}

export function getDayScore(state: AppState, key: string): number {
  // % of that day's dailies completed. -1 if the day is outside the cycle
  // (before the cycle started, or not reached yet).
  if (!state.cycleStartDate) return -1;
  if (diffDays(state.cycleStartDate, key) < 0) return -1;
  if (diffDays(key, todayKey()) < 0) return -1; // future day
  const dailiesActive = state.dailies.filter((d) => diffDays(d.createdDate, key) >= 0);
  if (dailiesActive.length === 0) return 0;
  const checks = state.history[key] ?? {};
  const done = dailiesActive.filter((d) => checks[d.id]).length;
  return Math.round((done / dailiesActive.length) * 100);
}

export function getWeek(state: AppState): { key: string; letter: string; pct: number; isToday: boolean }[] {
  const today = new Date();
  const out: { key: string; letter: string; pct: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = dateKey(d);
    const score = getDayScore(state, key);
    out.push({ key, letter: weekdayLetterFR(d), pct: Math.max(0, score), isToday: i === 0 });
  }
  return out;
}

export function getWeekAvg(week: { pct: number }[]): number {
  if (week.length === 0) return 0;
  return Math.round(week.reduce((a, b) => a + b.pct, 0) / week.length);
}

export function getStreak(state: AppState): number {
  if (!state.cycleStartDate) return 0;
  let streak = 0;
  let cursor = new Date();
  // Today only counts once fully completed; otherwise start counting from yesterday.
  const todayScore = getDayScore(state, todayKey());
  if (todayScore < 100) {
    cursor = addDays(cursor, -1);
  }
  while (true) {
    const key = dateKey(cursor);
    if (diffDays(state.cycleStartDate, key) < 0) break;
    const score = getDayScore(state, key);
    if (score !== 100) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getCycleTicks(cycleDay: number, count = 25): { filled: boolean }[] {
  const filledCount = Math.round((cycleDay / 100) * count);
  return Array.from({ length: count }, (_, i) => ({ filled: i < filledCount }));
}

export function getCycleCells(state: AppState, cycleDay: number): { key: string; score: number; isToday: boolean }[] {
  if (!state.cycleStartDate) return Array.from({ length: 100 }, (_, i) => ({ key: String(i), score: -1, isToday: false }));
  const start = parseDateKey(state.cycleStartDate);
  return Array.from({ length: 100 }, (_, i) => {
    const key = dateKey(addDays(start, i));
    const dayNum = i + 1;
    const score = dayNum > cycleDay ? -1 : getDayScore(state, key);
    return { key, score, isToday: dayNum === cycleDay };
  });
}

export function getCycleAvg(cells: { score: number }[]): number {
  const past = cells.filter((c) => c.score >= 0);
  if (past.length === 0) return 0;
  return Math.round(past.reduce((a, b) => a + b.score, 0) / past.length);
}

export function goalProgressLabel(goal: Goal, daysLeft: number): string {
  return `${goal.pct}% · J-${Math.max(0, daysLeft)}`;
}

export function getPerfectDaysCount(cells: { score: number }[]): number {
  return cells.filter((c) => c.score === 100).length;
}

export function getLongestStreak(cells: { score: number }[]): number {
  let longest = 0;
  let current = 0;
  for (const c of cells) {
    if (c.score < 0) continue; // outside the cycle so far
    if (c.score === 100) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export function getDailyComparison(state: AppState): { id: string; label: string; pct: number }[] {
  return state.dailies
    .map((d) => ({ id: d.id, label: d.label, pct: getDailyPct(state, d) }))
    .sort((a, b) => b.pct - a.pct);
}

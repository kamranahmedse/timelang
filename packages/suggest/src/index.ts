import { parseDate, ParseOptions } from '@timelang/parse';
import {
  WEEKDAYS,
  MODIFIERS,
  RELATIVE_DAYS,
  RELATIVE_WEEKS,
  RELATIVE_MONTHS,
  RELATIVE_YEARS,
  RELATIVE_QUARTERS,
  QUARTERS,
  TIME_OF_DAY,
  END_OF_PERIODS,
  START_OF_PERIODS,
  SPECIAL_DAYS,
  NOW_EXPRESSIONS,
  LATER_EXPRESSIONS,
  IN_A_EXPRESSIONS,
  TIME_UNITS,
  TIMES,
  DIRECTIONS,
  ALIASES,
  MONTHS,
} from './dictionary';

const DEFAULT_SUGGESTIONS = [
  'tomorrow at 9am',
  'tomorrow at 2pm',
  ...SPECIAL_DAYS,
  ...RELATIVE_WEEKS,
  ...RELATIVE_MONTHS,
  'end of day',
  'end of week',
  'in an hour',
  'in 30 minutes',
  'later today',
  'this morning',
  'today at 12pm',
  'this afternoon',
  'this evening',
];

export interface Suggestion {
  label: string;
  date: Date;
}

export interface TimeSuggestion {
  label: string;
  hour: number;
  minute: number;
  period?: 'am' | 'pm'; // Only present when format is '12h'
}

export type SuggestMode = 'date' | 'datetime' | 'time';
export type SortPreference = 'closest' | 'future' | 'past';

export interface SuggestOptions {
  referenceDate?: Date;
  limit?: number;
  mode?: SuggestMode;
  minDate?: Date;
  maxDate?: Date;
  sortPreference?: SortPreference;
  step?: number; // minute step for time suggestions (default: 15)
}

const TIME_ONLY_UNITS = ['minute', 'hour'];
const DATE_ONLY_UNITS = ['day', 'week', 'month', 'year'];

function convertTo24Hour(hour: number, period?: 'am' | 'pm'): number {
  if (period === 'pm' && hour !== 12) {
    return hour + 12;
  }
  if (period === 'am' && hour === 12) {
    return 0;
  }
  return hour;
}

function getBusinessHourScore(hour: number): number {
  if (hour >= 8 && hour < 18) {
    return 0;
  }
  if (hour >= 6 && hour < 8) {
    return 1;
  }
  if (hour >= 18 && hour < 22) {
    return 2;
  }
  return 3;
}

function isTimeOnlyExpression(candidate: string): boolean {
  const lower = candidate.toLowerCase();

  for (const unit of TIME_ONLY_UNITS) {
    if (lower.includes(unit)) {
      return true;
    }
  }

  if (lower.includes('noon') || lower.includes('midnight')) {
    return true;
  }

  if (lower.includes(' at ')) {
    return true;
  }

  if (lower.includes('morning') || lower.includes('afternoon') || lower.includes('evening')) {
    return true;
  }

  if (lower === 'now' || lower === 'later today') {
    return true;
  }

  if (lower.includes('end of day') || lower === 'eod') {
    return true;
  }

  if (/\d{1,2}\s*[ap]m/i.test(lower)) {
    return true;
  }

  return false;
}

function isDateOnlyExpression(candidate: string): boolean {
  const lower = candidate.toLowerCase();

  for (const unit of DATE_ONLY_UNITS) {
    if (lower.includes(unit)) {
      return true;
    }
  }

  if (WEEKDAYS.some((day) => lower.includes(day))) {
    return true;
  }

  if (lower.includes('yesterday') || lower.includes('today') || lower.includes('tomorrow')) {
    return true;
  }

  if (lower.includes('quarter') || /^q[1-4]$/i.test(lower)) {
    return true;
  }

  if (MONTHS.some((month) => lower.includes(month))) {
    return true;
  }

  return false;
}

function filterCandidatesByMode(candidates: string[], mode: SuggestMode): string[] {
  if (mode === 'datetime') {
    return candidates;
  }

  if (mode === 'date') {
    return candidates.filter((c) => !isTimeOnlyExpression(c));
  }

  if (mode === 'time') {
    return candidates.filter((c) => !isDateOnlyExpression(c));
  }

  return candidates;
}

function generateCandidates(): string[] {
  const candidates: string[] = [];

  candidates.push(...SPECIAL_DAYS);

  candidates.push(...NOW_EXPRESSIONS);

  candidates.push(...RELATIVE_WEEKS);
  candidates.push(...RELATIVE_MONTHS);
  candidates.push(...RELATIVE_YEARS);
  candidates.push(...RELATIVE_QUARTERS);

  candidates.push(...QUARTERS);

  candidates.push(...END_OF_PERIODS);
  candidates.push(...START_OF_PERIODS);

  candidates.push(...LATER_EXPRESSIONS);

  candidates.push(...IN_A_EXPRESSIONS);

  // Bare times for time mode
  candidates.push(...TIMES);

  for (const weekday of WEEKDAYS) {
    for (const time of TIMES) {
      candidates.push(`${weekday} at ${time}`);
    }
  }

  for (let n = 1; n <= 60; n++) {
    for (const unit of TIME_UNITS) {
      const unitLabel = n === 1 ? unit : `${unit}s`;
      for (const direction of DIRECTIONS) {
        candidates.push(`${n} ${unitLabel} ${direction}`);
      }
    }
  }

  for (const day of RELATIVE_DAYS) {
    for (const time of TIMES) {
      candidates.push(`${day} at ${time}`);
      candidates.push(`${time} ${day}`);
    }
  }

  // Time-of-day expressions come after specific times so "tomorrow at 9am" takes precedence over "tomorrow morning"
  for (const day of RELATIVE_DAYS) {
    if (day === 'today') {
      continue;
    }
    for (const timeOfDay of TIME_OF_DAY) {
      candidates.push(`${day} ${timeOfDay}`);
    }
  }

  for (const timeOfDay of TIME_OF_DAY) {
    candidates.push(`this ${timeOfDay}`);
  }

  for (const day of RELATIVE_DAYS) {
    candidates.push(`${day} noon`);
  }

  for (const modifier of MODIFIERS) {
    for (const weekday of WEEKDAYS) {
      candidates.push(`${modifier} ${weekday}`);
    }
  }

  for (let day = 1; day <= 31; day++) {
    for (const month of MONTHS) {
      candidates.push(`${day} ${month}`);
      candidates.push(`${month} ${day}`);
    }
  }

  for (const modifier of MODIFIERS) {
    for (const weekday of WEEKDAYS) {
      for (const time of TIMES) {
        candidates.push(`${modifier} ${weekday} at ${time}`);
      }
    }
  }

  // Add bare expressions at end for date-only mode
  candidates.push(...WEEKDAYS);
  candidates.push(...RELATIVE_DAYS);

  return candidates;
}

function expandAlias(word: string): string {
  const lower = word.toLowerCase();
  return ALIASES[lower] || lower;
}

function matchesInput(candidate: string, input: string): boolean {
  if (!input) {
    return true;
  }

  const candidateLower = candidate.toLowerCase();
  const inputLower = input.toLowerCase();

  if (candidateLower.startsWith(inputLower)) {
    return true;
  }

  const inputWords = inputLower.split(/\s+/).filter(Boolean);
  const candidateWords = candidateLower.split(/\s+/).filter(Boolean);

  if (inputWords.length === 0) {
    return true;
  }

  if (inputWords.length === 1) {
    const inputWord = inputWords[0]!;
    const expanded = expandAlias(inputWord);
    for (const candidateWord of candidateWords) {
      if (candidateWord.startsWith(expanded) || candidateWord.startsWith(inputWord)) {
        return true;
      }
    }
    return false;
  }

  const expandedInput = inputWords.map(expandAlias).join(' ');
  if (candidateLower.startsWith(expandedInput)) {
    return true;
  }

  for (let i = 0; i < inputWords.length; i++) {
    if (i >= candidateWords.length) {
      return false;
    }
    const inputWord = inputWords[i]!;
    const candidateWord = candidateWords[i]!;
    const expandedInputWord = expandAlias(inputWord);
    const isLastInputWord = i === inputWords.length - 1;

    if (isLastInputWord) {
      if (!candidateWord.startsWith(expandedInputWord) && !candidateWord.startsWith(inputWord)) {
        return false;
      }
    } else {
      if (candidateWord !== expandedInputWord && candidateWord !== inputWord) {
        return false;
      }
    }
  }

  return true;
}

export function suggest(input: string, options: SuggestOptions = {}): Suggestion[] {
  const { referenceDate, limit = 5, mode = 'datetime', minDate, maxDate, sortPreference = 'closest' } = options;
  const trimmed = input.trim();
  const parseOpts: ParseOptions = referenceDate ? { referenceDate } : {};
  const refDate = referenceDate || new Date();
  const refTime = refDate.getTime();
  const minTime = minDate?.getTime();
  const maxTime = maxDate?.getTime();

  // Get current day of week to filter out "this [today's weekday]" suggestions
  const currentDayOfWeek = WEEKDAYS[refDate.getUTCDay() === 0 ? 6 : refDate.getUTCDay() - 1];
  const thisTodayPattern = `this ${currentDayOfWeek}`;

  const allCandidates = trimmed ? generateCandidates() : DEFAULT_SUGGESTIONS;
  const candidates = filterCandidatesByMode(allCandidates, mode);
  const suggestions: Suggestion[] = [];
  const seenDates = new Set<number>();

  for (const candidate of candidates) {
    if (!matchesInput(candidate, trimmed)) {
      continue;
    }

    // Skip "this [current weekday]" suggestions (e.g., "this saturday" when today is Saturday)
    if (candidate.toLowerCase().startsWith(thisTodayPattern)) {
      continue;
    }

    const date = parseDate(candidate, parseOpts);
    if (!date) {
      continue;
    }

    const dateTime = date.getTime();

    if (minTime !== undefined && dateTime < minTime) {
      continue;
    }

    if (maxTime !== undefined && dateTime > maxTime) {
      continue;
    }

    if (seenDates.has(dateTime)) {
      continue;
    }

    seenDates.add(dateTime);
    suggestions.push({ label: candidate, date });
  }

  const validSuggestions = suggestions;

  const getDateBusinessHourScore = (date: Date): number => {
    return getBusinessHourScore(date.getUTCHours());
  };

  const getDayTimestamp = (date: Date): number => {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  };

  // Time-of-day expressions for today should not be penalized for being in the past
  const isTimeOfDayToday = (label: string): boolean => {
    const lower = label.toLowerCase();
    return lower === 'this morning' || lower === 'this afternoon' || lower === 'this evening';
  };

  validSuggestions.sort((a, b) => {
    const timeA = a.date.getTime();
    const timeB = b.date.getTime();
    const dayA = getDayTimestamp(a.date);
    const dayB = getDayTimestamp(b.date);

    if (sortPreference === 'future') {
      // Time-of-day expressions for today are always treated as "future" for sorting purposes
      const aIsTimeOfDay = isTimeOfDayToday(a.label);
      const bIsTimeOfDay = isTimeOfDayToday(b.label);
      const aIsFuture = timeA >= refTime || aIsTimeOfDay;
      const bIsFuture = timeB >= refTime || bIsTimeOfDay;
      if (aIsFuture !== bIsFuture) {
        return aIsFuture ? -1 : 1;
      }
      if (aIsFuture) {
        if (dayA !== dayB) {
          return dayA - dayB;
        }
        const scoreA = getDateBusinessHourScore(a.date);
        const scoreB = getDateBusinessHourScore(b.date);
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return timeA - timeB;
      }
      if (dayA !== dayB) {
        return dayB - dayA;
      }
      const scoreA = getDateBusinessHourScore(a.date);
      const scoreB = getDateBusinessHourScore(b.date);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return timeB - timeA;
    }

    if (sortPreference === 'past') {
      // Time-of-day expressions for today are always treated as "past" for sorting purposes
      const aIsTimeOfDay = isTimeOfDayToday(a.label);
      const bIsTimeOfDay = isTimeOfDayToday(b.label);
      const aIsPast = timeA <= refTime || aIsTimeOfDay;
      const bIsPast = timeB <= refTime || bIsTimeOfDay;
      if (aIsPast !== bIsPast) {
        return aIsPast ? -1 : 1;
      }
      if (aIsPast) {
        if (dayA !== dayB) {
          return dayB - dayA;
        }
        const scoreA = getDateBusinessHourScore(a.date);
        const scoreB = getDateBusinessHourScore(b.date);
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return timeB - timeA;
      }
      if (dayA !== dayB) {
        return dayA - dayB;
      }
      const scoreA = getDateBusinessHourScore(a.date);
      const scoreB = getDateBusinessHourScore(b.date);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return timeA - timeB;
    }

    const distA = Math.abs(timeA - refTime);
    const distB = Math.abs(timeB - refTime);
    return distA - distB;
  });

  if (validSuggestions.length === 0 && trimmed) {
    const isAppropriateForMode =
      mode === 'datetime' ||
      (mode === 'date' && !isTimeOnlyExpression(trimmed)) ||
      (mode === 'time' && !isDateOnlyExpression(trimmed));

    if (isAppropriateForMode) {
      const date = parseDate(trimmed, parseOpts);
      if (date) {
        const dateTime = date.getTime();
        const withinBounds =
          (minTime === undefined || dateTime >= minTime) &&
          (maxTime === undefined || dateTime <= maxTime);
        if (withinBounds) {
          return [{ label: trimmed, date }];
        }
      }
    }
  }

  return validSuggestions.slice(0, limit);
}

export type TimeFormat = '12h' | '24h';

export interface SuggestTimeOptions {
  step?: number; // minute step (default: 15)
  limit?: number;
  format?: TimeFormat; // '12h' or '24h' (default: '12h')
}

export function suggestTime(input: string, options: SuggestTimeOptions = {}): TimeSuggestion[] {
  const { step = 15, limit = 10, format = '12h' } = options;
  const trimmed = input.trim().toLowerCase();
  const suggestions: TimeSuggestion[] = [];
  const seen = new Set<string>();

  const createSuggestion = (hour24: number, minute: number): TimeSuggestion => {
    const label = formatTime(hour24, minute, format);
    if (format === '24h') {
      return { label, hour: hour24, minute };
    }
    // 12h format
    const period: 'am' | 'pm' = hour24 < 12 ? 'am' : 'pm';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return { label, hour: hour12, minute, period };
  };

  if (trimmed === '') {
    // Generate default times at step intervals
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        const label = formatTime(h, m, format);
        if (!seen.has(label)) {
          seen.add(label);
          suggestions.push(createSuggestion(h, m));
        }
      }
    }
    // Sort by business hours
    suggestions.sort((a, b) => {
      const h24a = convertTo24Hour(a.hour, a.period);
      const h24b = convertTo24Hour(b.hour, b.period);
      return getBusinessHourScore(h24a) - getBusinessHourScore(h24b);
    });
    return suggestions.slice(0, limit);
  }

  // Parse input - extract digits and period separately
  const parsed = parseTimeInput(trimmed);
  if (!parsed) {
    return [];
  }

  const { hour, minStr, period } = parsed;

  // Determine possible hours based on input
  const hours: number[] = [];

  if (period === 'a') {
    // AM only
    if (hour === 12) {
      hours.push(0);
    } else if (hour <= 12) {
      hours.push(hour);
    }
  } else if (period === 'p') {
    // PM only
    if (hour === 12) {
      hours.push(12);
    } else if (hour <= 11) {
      hours.push(hour + 12);
    }
  } else {
    // Both AM and PM
    if (hour === 12) {
      hours.push(0, 12);
    } else if (hour <= 11) {
      hours.push(hour, hour + 12);
    } else if (hour <= 23) {
      hours.push(hour);
    }
  }

  // Determine minutes based on input
  const minutes: number[] = [];

  if (minStr === '') {
    // No minutes - generate at step intervals
    for (let m = 0; m < 60; m += step) {
      minutes.push(m);
    }
  } else if (minStr.length === 1) {
    // Partial minute like "93" = 9:3x
    const minStart = parseInt(minStr, 10) * 10;
    for (let m = minStart; m < Math.min(minStart + 10, 60); m += step) {
      minutes.push(m);
    }
    // Also include the exact start if not at step
    if (!minutes.includes(minStart) && minStart < 60) {
      minutes.unshift(minStart);
    }
  } else {
    // Full minute
    const min = parseInt(minStr, 10);
    if (min >= 0 && min < 60) {
      minutes.push(min);
    }
  }

  // Generate suggestions
  for (const h of hours) {
    for (const m of minutes.sort((a, b) => a - b)) {
      const label = formatTime(h, m, format);
      if (!seen.has(label)) {
        seen.add(label);
        suggestions.push(createSuggestion(h, m));
      }
    }
  }

  // Sort by business hours (need to convert back to 24h for scoring)
  suggestions.sort((a, b) => {
    const h24a = convertTo24Hour(a.hour, a.period);
    const h24b = convertTo24Hour(b.hour, b.period);
    return getBusinessHourScore(h24a) - getBusinessHourScore(h24b);
  });

  return suggestions.slice(0, limit);
}

interface ParsedTimeInput {
  hour: number;
  minStr: string;
  period: 'a' | 'p' | undefined;
}

function parseTimeInput(input: string): ParsedTimeInput | null {
  // Extract period (a/am/p/pm) from end
  let period: 'a' | 'p' | undefined;
  let rest = input;

  const periodMatch = input.match(/([ap])m?$/i);
  if (periodMatch && periodMatch[1]) {
    period = periodMatch[1].toLowerCase() as 'a' | 'p';
    rest = input.slice(0, -periodMatch[0].length).trim();
  }

  // Handle colon-separated format: "9:30", "10:05"
  if (rest.includes(':')) {
    const parts = rest.split(':');
    const hourPart = parts[0] || '';
    const minPart = parts[1] || '';
    const hour = parseInt(hourPart, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return null;
    }
    return { hour, minStr: minPart, period };
  }

  // Handle digit-only formats: "9", "93", "930", "750", "1030"
  if (!/^\d+$/.test(rest)) {
    return null;
  }

  const digits = rest;

  if (digits.length === 1) {
    // "9" → hour=9
    return { hour: parseInt(digits, 10), minStr: '', period };
  }

  if (digits.length === 2) {
    // "93" → hour=9, min=3x OR "12" → hour=12
    const num = parseInt(digits, 10);
    const firstDigit = parseInt(digits.charAt(0), 10);
    const secondDigit = parseInt(digits.charAt(1), 10);

    // If first digit is 1-9 and second is 0-5, treat as hour + partial minute
    // e.g., "93" = 9:30-39, "15" = 1:50-59
    if (firstDigit >= 1 && firstDigit <= 9 && secondDigit >= 0 && secondDigit <= 5) {
      return { hour: firstDigit, minStr: digits.charAt(1), period };
    }

    // Otherwise treat as hour only if valid (10-23)
    if (num >= 10 && num <= 23) {
      return { hour: num, minStr: '', period };
    }

    // Try as hour + partial minute for cases like "96" = 9:60 (invalid) - still try
    if (firstDigit >= 1 && firstDigit <= 9) {
      return { hour: firstDigit, minStr: digits.charAt(1), period };
    }

    return null;
  }

  if (digits.length === 3) {
    // Try "180" as either:
    // 1. hour=1, min=80 (invalid minute)
    // 2. hour=18, min=0x (valid)
    const hour1 = parseInt(digits.charAt(0), 10);
    const min1 = parseInt(digits.slice(1), 10);
    const hour2 = parseInt(digits.slice(0, 2), 10);
    const min2Str = digits.charAt(2);

    // If first interpretation gives valid minute (< 60), use it
    if (hour1 >= 1 && hour1 <= 9 && min1 < 60) {
      return { hour: hour1, minStr: digits.slice(1), period };
    }

    // Otherwise try second interpretation (2-digit hour + partial minute)
    if (hour2 >= 10 && hour2 <= 23) {
      return { hour: hour2, minStr: min2Str, period };
    }

    // Fallback to first interpretation even with invalid minute (will be filtered later)
    if (hour1 >= 1 && hour1 <= 9) {
      return { hour: hour1, minStr: digits.slice(1), period };
    }

    return null;
  }

  if (digits.length === 4) {
    // "1030" → hour=10, min=30
    const hour = parseInt(digits.slice(0, 2), 10);
    const min = digits.slice(2);
    if (hour < 0 || hour > 23) {
      return null;
    }
    return { hour, minStr: min, period };
  }

  return null;
}

function formatTime(hour: number, minute: number, format: TimeFormat): string {
  const minStr = minute.toString().padStart(2, '0');

  if (format === '24h') {
    const hourStr = hour.toString().padStart(2, '0');
    return `${hourStr}:${minStr}`;
  }

  // 12h format
  const period = hour < 12 ? 'am' : 'pm';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const hourStr = h12.toString().padStart(2, '0');
  return `${hourStr}:${minStr} ${period}`;
}


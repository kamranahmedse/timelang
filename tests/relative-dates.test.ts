import { describe, it, expect } from 'vitest';
import { parse, parseDate, DateResult } from '../src/index';

// Fixed reference date for deterministic tests
// Wednesday, January 15, 2025 at 12:00:00 UTC
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

function expectDate(input: string, expectedDate: Date, options = { referenceDate }) {
  const result = parse(input, options) as DateResult;
  expect(result).not.toBeNull();
  expect(result.type).toBe('date');
  expect(result.date.toISOString()).toBe(expectedDate.toISOString());
  expect(result.title).toBeNull();
}

function expectParseDate(input: string, expectedDate: Date, options = { referenceDate }) {
  const result = parseDate(input, options);
  expect(result).not.toBeNull();
  expect(result?.toISOString()).toBe(expectedDate.toISOString());
}

describe('Relative Date Patterns', () => {
  describe('"X time from now" patterns', () => {
    it('should parse "2 days from now" as a date', () => {
      expectDate('2 days from now', utc(2025, 1, 17, 12, 0));
    });

    it('should parse "1 day from now" as a date', () => {
      expectDate('1 day from now', utc(2025, 1, 16, 12, 0));
    });

    it('should parse "3 weeks from now" as a date', () => {
      expectDate('3 weeks from now', utc(2025, 2, 5, 12, 0));
    });

    it('should parse "1 week from now" as a date', () => {
      expectDate('1 week from now', utc(2025, 1, 22, 12, 0));
    });

    it('should parse "2 months from now" as a date', () => {
      expectDate('2 months from now', utc(2025, 3, 15, 12, 0));
    });

    it('should parse "1 month from now" as a date', () => {
      expectDate('1 month from now', utc(2025, 2, 15, 12, 0));
    });

    it('should parse "1 year from now" as a date', () => {
      expectDate('1 year from now', utc(2026, 1, 15, 12, 0));
    });

    it('should parse "5 years from now" as a date', () => {
      expectDate('5 years from now', utc(2030, 1, 15, 12, 0));
    });

    it('should parse "24 hours from now" as a date', () => {
      expectDate('24 hours from now', utc(2025, 1, 16, 12, 0));
    });
  });

  describe('"X time ago" patterns', () => {
    it('should parse "2 days ago" as a date', () => {
      expectDate('2 days ago', utc(2025, 1, 13, 12, 0));
    });

    it('should parse "1 day ago" as a date', () => {
      expectDate('1 day ago', utc(2025, 1, 14, 12, 0));
    });

    it('should parse "3 weeks ago" as a date', () => {
      expectDate('3 weeks ago', utc(2024, 12, 25, 12, 0));
    });

    it('should parse "1 week ago" as a date', () => {
      expectDate('1 week ago', utc(2025, 1, 8, 12, 0));
    });

    it('should parse "2 months ago" as a date', () => {
      expectDate('2 months ago', utc(2024, 11, 15, 12, 0));
    });

    it('should parse "1 month ago" as a date', () => {
      expectDate('1 month ago', utc(2024, 12, 15, 12, 0));
    });

    it('should parse "1 year ago" as a date', () => {
      expectDate('1 year ago', utc(2024, 1, 15, 12, 0));
    });

    it('should parse "5 years ago" as a date', () => {
      expectDate('5 years ago', utc(2020, 1, 15, 12, 0));
    });

    it('should parse "24 hours ago" as a date', () => {
      expectDate('24 hours ago', utc(2025, 1, 14, 12, 0));
    });
  });

  describe('"in X time" patterns (future dates)', () => {
    it('should parse "in 2 days" as a date', () => {
      expectDate('in 2 days', utc(2025, 1, 17, 12, 0));
    });

    it('should parse "in 1 day" as a date', () => {
      expectDate('in 1 day', utc(2025, 1, 16, 12, 0));
    });

    it('should parse "in 3 weeks" as a date', () => {
      expectDate('in 3 weeks', utc(2025, 2, 5, 12, 0));
    });

    it('should parse "in 1 week" as a date', () => {
      expectDate('in 1 week', utc(2025, 1, 22, 12, 0));
    });

    it('should parse "in 2 months" as a date', () => {
      expectDate('in 2 months', utc(2025, 3, 15, 12, 0));
    });

    it('should parse "in 1 month" as a date', () => {
      expectDate('in 1 month', utc(2025, 2, 15, 12, 0));
    });

    it('should parse "in 1 year" as a date', () => {
      expectDate('in 1 year', utc(2026, 1, 15, 12, 0));
    });

    it('should parse "in 24 hours" as a date', () => {
      expectDate('in 24 hours', utc(2025, 1, 16, 12, 0));
    });

    it('should parse "in an hour" as a date', () => {
      expectDate('in an hour', utc(2025, 1, 15, 13, 0));
    });

    it('should parse "in 30 minutes" as a date', () => {
      expectDate('in 30 minutes', utc(2025, 1, 15, 12, 30));
    });
  });

  describe('"X time from today/tomorrow" patterns', () => {
    it('should parse "2 days from today" as a date', () => {
      expectDate('2 days from today', utc(2025, 1, 17));
    });

    it('should parse "1 week from today" as a date', () => {
      expectDate('1 week from today', utc(2025, 1, 22));
    });

    it('should parse "2 days from tomorrow" as a date', () => {
      expectDate('2 days from tomorrow', utc(2025, 1, 18));
    });

    it('should parse "1 week from tomorrow" as a date', () => {
      expectDate('1 week from tomorrow', utc(2025, 1, 23));
    });

    it('should parse "3 days from yesterday" as a date', () => {
      expectDate('3 days from yesterday', utc(2025, 1, 17));
    });
  });

  describe('Word number patterns', () => {
    it('should parse "a day from now" as a date', () => {
      expectDate('a day from now', utc(2025, 1, 16, 12, 0));
    });

    it('should parse "a week from now" as a date', () => {
      expectDate('a week from now', utc(2025, 1, 22, 12, 0));
    });

    it('should parse "a month from now" as a date', () => {
      expectDate('a month from now', utc(2025, 2, 15, 12, 0));
    });

    it('should parse "a year from now" as a date', () => {
      expectDate('a year from now', utc(2026, 1, 15, 12, 0));
    });

    it('should parse "a day ago" as a date', () => {
      expectDate('a day ago', utc(2025, 1, 14, 12, 0));
    });

    it('should parse "a week ago" as a date', () => {
      expectDate('a week ago', utc(2025, 1, 8, 12, 0));
    });

    it('should parse "a month ago" as a date', () => {
      expectDate('a month ago', utc(2024, 12, 15, 12, 0));
    });

    it('should parse "a year ago" as a date', () => {
      expectDate('a year ago', utc(2024, 1, 15, 12, 0));
    });

    it('should parse "two days from now" as a date', () => {
      expectDate('two days from now', utc(2025, 1, 17, 12, 0));
    });

    it('should parse "three weeks ago" as a date', () => {
      expectDate('three weeks ago', utc(2024, 12, 25, 12, 0));
    });

    it('should parse "in a week" as a date', () => {
      expectDate('in a week', utc(2025, 1, 22, 12, 0));
    });

    it('should parse "in two days" as a date', () => {
      expectDate('in two days', utc(2025, 1, 17, 12, 0));
    });
  });

  describe('Relative dates with times', () => {
    it('should parse "2 days from now at 5pm" as a date with time', () => {
      expectDate('2 days from now at 5pm', utc(2025, 1, 17, 17, 0));
    });

    it('should parse "3 days ago at 10am" as a date with time', () => {
      expectDate('3 days ago at 10am', utc(2025, 1, 12, 10, 0));
    });

    it('should parse "in 2 days at 3pm" as a date with time', () => {
      expectDate('in 2 days at 3pm', utc(2025, 1, 17, 15, 0));
    });

    it('should parse "a week from now at noon" as a date with time', () => {
      expectDate('a week from now at noon', utc(2025, 1, 22, 12, 0));
    });

    it('should parse "1 week ago at midnight" as a date with time', () => {
      expectDate('1 week ago at midnight', utc(2025, 1, 8, 0, 0));
    });

    it('should parse "in 1 month at 9:30" as a date with time', () => {
      expectDate('in 1 month at 9:30', utc(2025, 2, 15, 9, 30));
    });
  });

  describe('parseDate helper for relative dates', () => {
    it('should return date for "2 days from now"', () => {
      expectParseDate('2 days from now', utc(2025, 1, 17, 12, 0));
    });

    it('should return date for "3 days ago"', () => {
      expectParseDate('3 days ago', utc(2025, 1, 12, 12, 0));
    });

    it('should return date for "in 1 week"', () => {
      expectParseDate('in 1 week', utc(2025, 1, 22, 12, 0));
    });

    it('should return date for "a month from now"', () => {
      expectParseDate('a month from now', utc(2025, 2, 15, 12, 0));
    });
  });

  describe('Edge cases', () => {
    it('should parse "0 days from now" as today', () => {
      expectDate('0 days from now', utc(2025, 1, 15, 12, 0));
    });

    it('should parse "0 days ago" as today', () => {
      expectDate('0 days ago', utc(2025, 1, 15, 12, 0));
    });

    it('should parse "100 days from now"', () => {
      // Jan 15 + 100 days = April 25
      expectDate('100 days from now', utc(2025, 4, 25, 12, 0));
    });

    it('should parse "365 days ago"', () => {
      // Jan 15, 2025 - 365 days = Jan 16, 2024 (2024 is a leap year with 366 days)
      expectDate('365 days ago', utc(2024, 1, 16, 12, 0));
    });
  });
});

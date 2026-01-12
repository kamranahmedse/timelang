import { describe, it, expect } from 'vitest';
import { parse, parseSpan, SpanResult } from '../src';

// Fixed the reference date for deterministic tests: Wednesday, January 15, 2025
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

// Duration constants in milliseconds
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;

// Helper to create expected dates in UTC
function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

// Helper to check if result is a span type
function expectSpan(
  input: string,
  expectedStart: Date,
  expectedDuration: number,
  options = { referenceDate }
) {
  const result = parse(input, options) as SpanResult;
  expect(result.type).toBe('span');
  expect(result.start.toISOString()).toBe(expectedStart.toISOString());
  expect(result.duration).toBe(expectedDuration);
  const expectedEnd = new Date(expectedStart.getTime() + expectedDuration);
  expect(result.end.toISOString()).toBe(expectedEnd.toISOString());
  expect(result.title).toBeNull();
}

// Helper with approximate duration matching
function expectSpanApprox(
  input: string,
  expectedStart: Date,
  expectedDuration: number,
  options = { referenceDate },
  tolerance = 0.01
) {
  const result = parse(input, options) as SpanResult;
  expect(result.type).toBe('span');
  expect(result.start.toISOString()).toBe(expectedStart.toISOString());
  const diff = Math.abs(result.duration - expectedDuration);
  const maxDiff = expectedDuration * tolerance;
  expect(diff).toBeLessThanOrEqual(maxDiff);
  expect(result.title).toBeNull();
}

describe('Timespan Parsing (Date + Duration)', () => {
  describe('Basic "for" patterns', () => {
    it('should parse "july 3rd for 10 days"', () => {
      expectSpan('july 3rd for 10 days', utc(2025, 7, 3), 10 * MS_PER_DAY);
    });

    it('should parse "next monday for 2 weeks"', () => {
      expectSpan('next monday for 2 weeks', utc(2025, 1, 20), 2 * MS_PER_WEEK);
    });

    it('should parse "tomorrow for 3 hours"', () => {
      expectSpan('tomorrow for 3 hours', utc(2025, 1, 16), 3 * MS_PER_HOUR);
    });

    it('should parse "march 15th for 1 month"', () => {
      expectSpanApprox('march 15th for 1 month', utc(2025, 3, 15), MS_PER_MONTH);
    });

    it('should parse "january 1st for 1 year"', () => {
      expectSpanApprox('january 1st for 1 year', utc(2025, 1, 1), MS_PER_YEAR);
    });

    it('should parse "feb 14 for 1 day"', () => {
      expectSpan('feb 14 for 1 day', utc(2025, 2, 14), MS_PER_DAY);
    });

    it('should parse "december 25th for 2 weeks"', () => {
      expectSpan('december 25th for 2 weeks', utc(2025, 12, 25), 2 * MS_PER_WEEK);
    });
  });

  describe('"in" patterns', () => {
    it('should parse "in january for two days"', () => {
      // "in january" starts at beginning of January
      expectSpan('in january for two days', utc(2025, 1, 1), 2 * MS_PER_DAY);
    });

    it('should parse "in march for 2 weeks"', () => {
      expectSpan('in march for 2 weeks', utc(2025, 3, 1), 2 * MS_PER_WEEK);
    });

    it('should parse "in Q1 for 30 days"', () => {
      expectSpan('in Q1 for 30 days', utc(2025, 1, 1), 30 * MS_PER_DAY);
    });

    it('should parse "in early january for 1 week"', () => {
      const result = parse('in early january for 1 week', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(MS_PER_WEEK);
    });

    it('should parse "in late march for 5 days"', () => {
      const result = parse('in late march for 5 days', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(5 * MS_PER_DAY);
    });
  });

  describe('"starting" patterns', () => {
    it('should parse "starting march 1 for 2 weeks"', () => {
      expectSpan('starting march 1 for 2 weeks', utc(2025, 3, 1), 2 * MS_PER_WEEK);
    });

    it('should parse "starting tomorrow for 10 days"', () => {
      expectSpan('starting tomorrow for 10 days', utc(2025, 1, 16), 10 * MS_PER_DAY);
    });

    it('should parse "starting next monday for 1 month"', () => {
      expectSpanApprox('starting next monday for 1 month', utc(2025, 1, 20), MS_PER_MONTH);
    });

    it('should parse "starting january 1st for 1 year"', () => {
      expectSpanApprox('starting january 1st for 1 year', utc(2025, 1, 1), MS_PER_YEAR);
    });

    it('should parse "starting feb 1 for 28 days"', () => {
      expectSpan('starting feb 1 for 28 days', utc(2025, 2, 1), 28 * MS_PER_DAY);
    });
  });

  describe('"beginning" patterns', () => {
    it('should parse "beginning march 1 for 2 weeks"', () => {
      expectSpan('beginning march 1 for 2 weeks', utc(2025, 3, 1), 2 * MS_PER_WEEK);
    });

    it('should parse "beginning next week for 10 days"', () => {
      const result = parse('beginning next week for 10 days', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(10 * MS_PER_DAY);
    });

    it('should parse "beginning april 15 for 3 weeks"', () => {
      expectSpan('beginning april 15 for 3 weeks', utc(2025, 4, 15), 3 * MS_PER_WEEK);
    });
  });

  describe('With times', () => {
    it('should parse "tomorrow at 9am for 2 hours"', () => {
      expectSpan('tomorrow at 9am for 2 hours', utc(2025, 1, 16, 9, 0), 2 * MS_PER_HOUR);
    });

    it('should parse "next monday at 10am for 3 hours"', () => {
      expectSpan('next monday at 10am for 3 hours', utc(2025, 1, 20, 10, 0), 3 * MS_PER_HOUR);
    });

    it('should parse "friday at noon for 1 hour"', () => {
      expectSpan('friday at noon for 1 hour', utc(2025, 1, 17, 12, 0), MS_PER_HOUR);
    });

    it('should parse "march 15th at 2pm for 4 hours"', () => {
      expectSpan('march 15th at 2pm for 4 hours', utc(2025, 3, 15, 14, 0), 4 * MS_PER_HOUR);
    });

    it('should parse "jan 20 at 8:30am for 90 minutes"', () => {
      expectSpan('jan 20 at 8:30am for 90 minutes', utc(2025, 1, 20, 8, 30), 90 * 60 * 1000);
    });

    it('should parse "saturday at midnight for 8 hours"', () => {
      expectSpan('saturday at midnight for 8 hours', utc(2025, 1, 18, 0, 0), 8 * MS_PER_HOUR);
    });
  });

  describe('Combined duration formats', () => {
    it('should parse "march 1st for 1 week and 2 days"', () => {
      expectSpan('march 1st for 1 week and 2 days', utc(2025, 3, 1), MS_PER_WEEK + 2 * MS_PER_DAY);
    });

    it('should parse "tomorrow for 2 hours and 30 minutes"', () => {
      expectSpan('tomorrow for 2 hours and 30 minutes', utc(2025, 1, 16), 2 * MS_PER_HOUR + 30 * 60 * 1000);
    });

    it('should parse "jan 15 for 1w 3d"', () => {
      expectSpan('jan 15 for 1w 3d', utc(2025, 1, 15), MS_PER_WEEK + 3 * MS_PER_DAY);
    });

    it('should parse "next friday for 2h 30m"', () => {
      expectSpan('next friday for 2h 30m', utc(2025, 1, 17), 2 * MS_PER_HOUR + 30 * 60 * 1000);
    });

    it('should parse "april 1 for 1 month and 2 weeks"', () => {
      expectSpanApprox('april 1 for 1 month and 2 weeks', utc(2025, 4, 1), MS_PER_MONTH + 2 * MS_PER_WEEK);
    });
  });

  describe('With word number durations', () => {
    it('should parse "march 1 for one week"', () => {
      expectSpan('march 1 for one week', utc(2025, 3, 1), MS_PER_WEEK);
    });

    it('should parse "tomorrow for two days"', () => {
      expectSpan('tomorrow for two days', utc(2025, 1, 16), 2 * MS_PER_DAY);
    });

    it('should parse "next monday for three weeks"', () => {
      expectSpan('next monday for three weeks', utc(2025, 1, 20), 3 * MS_PER_WEEK);
    });

    it('should parse "jan 1 for a month"', () => {
      expectSpanApprox('jan 1 for a month', utc(2025, 1, 1), MS_PER_MONTH);
    });

    it('should parse "february 14 for a week and a half"', () => {
      expectSpan('february 14 for a week and a half', utc(2025, 2, 14), 1.5 * MS_PER_WEEK);
    });
  });

  describe('parseSpan helper function', () => {
    it('should return span object for valid span input', () => {
      const result = parseSpan('march 1 for 2 weeks', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.start.toISOString()).toBe(utc(2025, 3, 1).toISOString());
      expect(result?.duration).toBe(2 * MS_PER_WEEK);
      const expectedEnd = new Date(utc(2025, 3, 1).getTime() + 2 * MS_PER_WEEK);
      expect(result?.end.toISOString()).toBe(expectedEnd.toISOString());
    });

    it('should return null for non-span input (date only)', () => {
      const result = parseSpan('tomorrow', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for non-span input (duration only)', () => {
      const result = parseSpan('2 weeks', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for invalid input', () => {
      const result = parseSpan('not a span', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should parse span with 0 duration', () => {
      expectSpan('tomorrow for 0 days', utc(2025, 1, 16), 0);
    });

    it('should parse span with very long duration', () => {
      expectSpan('jan 1 for 1000 days', utc(2025, 1, 1), 1000 * MS_PER_DAY);
    });

    it('should parse span with fractional duration', () => {
      expectSpan('tomorrow for 1.5 days', utc(2025, 1, 16), 1.5 * MS_PER_DAY);
    });

    it('should parse span crossing month boundary', () => {
      expectSpan('jan 25 for 2 weeks', utc(2025, 1, 25), 2 * MS_PER_WEEK);
      // End date would be Feb 8
    });

    it('should parse span crossing year boundary', () => {
      expectSpan('dec 20 for 3 weeks', utc(2025, 12, 20), 3 * MS_PER_WEEK);
      // End date would be Jan 10, 2026
    });
  });
});

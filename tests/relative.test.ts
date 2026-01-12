import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

// Fixed reference date for deterministic tests: Wednesday, January 15, 2025 at noon UTC
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

// Duration constants in milliseconds
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY; // Approximate

// Helper to create expected dates in UTC
function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

// Helper to check relative duration result (produces span)
function expectRelativeSpan(
  input: string,
  expectedStart: Date,
  expectedEnd: Date,
  options = { referenceDate }
) {
  const result = parse(input, options);
  expect(result).not.toBeNull();
  expect(result?.type).toBe('span');
  if (result?.type === 'span') {
    expect(result.start.toISOString()).toBe(expectedStart.toISOString());
    expect(result.end.toISOString()).toBe(expectedEnd.toISOString());
    // Verify duration = end - start
    const expectedDuration = expectedEnd.getTime() - expectedStart.getTime();
    expect(result.duration).toBe(expectedDuration);
    expect(result.title).toBeNull();
  }
}

// Helper that just checks the result is a span with correct duration
function expectRelativeDuration(
  input: string,
  expectedDuration: number,
  direction: 'past' | 'future',
  options = { referenceDate }
) {
  const result = parse(input, options);
  expect(result).not.toBeNull();
  expect(result?.type).toBe('span');
  if (result?.type === 'span') {
    expect(result.duration).toBe(expectedDuration);
    expect(result.title).toBeNull();

    if (direction === 'past') {
      // End should be around reference date
      expect(result.end.getTime()).toBeLessThanOrEqual(referenceDate.getTime() + MS_PER_DAY);
      // Start should be before end
      expect(result.start.getTime()).toBeLessThan(result.end.getTime());
    } else {
      // Start should be around reference date
      expect(result.start.getTime()).toBeGreaterThanOrEqual(referenceDate.getTime() - MS_PER_DAY);
      // End should be after start
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    }
  }
}

describe('Relative Duration Parsing', () => {
  describe('"last/past" patterns', () => {
    it('should parse "last 30 days"', () => {
      expectRelativeDuration('last 30 days', 30 * MS_PER_DAY, 'past');
    });

    it('should parse "last 7 days"', () => {
      expectRelativeDuration('last 7 days', 7 * MS_PER_DAY, 'past');
    });

    it('should parse "last 2 weeks"', () => {
      expectRelativeDuration('last 2 weeks', 2 * MS_PER_WEEK, 'past');
    });

    it('should parse "last 3 months"', () => {
      const result = parse('last 3 months', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        // Approximate check for 3 months
        expect(result.duration).toBeGreaterThanOrEqual(85 * MS_PER_DAY);
        expect(result.duration).toBeLessThanOrEqual(95 * MS_PER_DAY);
      }
    });

    it('should parse "last year"', () => {
      const result = parse('last year', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        // Approximate check for 1 year
        expect(result.duration).toBeGreaterThanOrEqual(360 * MS_PER_DAY);
        expect(result.duration).toBeLessThanOrEqual(370 * MS_PER_DAY);
      }
    });

    it('should parse "past 30 days"', () => {
      expectRelativeDuration('past 30 days', 30 * MS_PER_DAY, 'past');
    });

    it('should parse "past 2 weeks"', () => {
      expectRelativeDuration('past 2 weeks', 2 * MS_PER_WEEK, 'past');
    });

    it('should parse "past 3 months"', () => {
      const result = parse('past 3 months', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "past year"', () => {
      const result = parse('past year', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "previous 7 days"', () => {
      expectRelativeDuration('previous 7 days', 7 * MS_PER_DAY, 'past');
    });

    it('should parse "previous 2 weeks"', () => {
      expectRelativeDuration('previous 2 weeks', 2 * MS_PER_WEEK, 'past');
    });

    it('should parse "previous month"', () => {
      const result = parse('previous month', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });
  });

  describe('"next" patterns', () => {
    it('should parse "next 30 days"', () => {
      expectRelativeDuration('next 30 days', 30 * MS_PER_DAY, 'future');
    });

    it('should parse "next 7 days"', () => {
      expectRelativeDuration('next 7 days', 7 * MS_PER_DAY, 'future');
    });

    it('should parse "next 2 weeks"', () => {
      expectRelativeDuration('next 2 weeks', 2 * MS_PER_WEEK, 'future');
    });

    it('should parse "next 3 months"', () => {
      const result = parse('next 3 months', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.duration).toBeGreaterThanOrEqual(85 * MS_PER_DAY);
        expect(result.duration).toBeLessThanOrEqual(95 * MS_PER_DAY);
      }
    });

    it('should parse "next year"', () => {
      const result = parse('next year', { referenceDate });
      expect(result).not.toBeNull();
      // This could be date (start of next year) or span (the next 365 days)
      // Based on context, we'll accept either
    });

    it('should parse "coming 2 weeks"', () => {
      expectRelativeDuration('coming 2 weeks', 2 * MS_PER_WEEK, 'future');
    });

    it('should parse "coming 3 months"', () => {
      const result = parse('coming 3 months', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "upcoming week"', () => {
      expectRelativeDuration('upcoming week', MS_PER_WEEK, 'future');
    });

    it('should parse "upcoming 2 months"', () => {
      const result = parse('upcoming 2 months', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });
  });

  describe('"within" patterns', () => {
    it('should parse "within 30 days"', () => {
      expectRelativeDuration('within 30 days', 30 * MS_PER_DAY, 'future');
    });

    it('should parse "within 2 weeks"', () => {
      expectRelativeDuration('within 2 weeks', 2 * MS_PER_WEEK, 'future');
    });

    it('should parse "within the next month"', () => {
      const result = parse('within the next month', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "within the next 3 months"', () => {
      const result = parse('within the next 3 months', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "within the past week"', () => {
      expectRelativeDuration('within the past week', MS_PER_WEEK, 'past');
    });
  });

  describe('"over the" patterns', () => {
    it('should parse "over the next 2 weeks"', () => {
      expectRelativeDuration('over the next 2 weeks', 2 * MS_PER_WEEK, 'future');
    });

    it('should parse "over the past 30 days"', () => {
      expectRelativeDuration('over the past 30 days', 30 * MS_PER_DAY, 'past');
    });

    it('should parse "over the last month"', () => {
      const result = parse('over the last month', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "over the coming weeks"', () => {
      const result = parse('over the coming weeks', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });
  });

  describe('"in the last/next" patterns', () => {
    it('should parse "in the last 30 days"', () => {
      expectRelativeDuration('in the last 30 days', 30 * MS_PER_DAY, 'past');
    });

    it('should parse "in the next 2 weeks"', () => {
      expectRelativeDuration('in the next 2 weeks', 2 * MS_PER_WEEK, 'future');
    });

    it('should parse "in the past month"', () => {
      const result = parse('in the past month', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "in the coming weeks"', () => {
      const result = parse('in the coming weeks', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });
  });

  describe('Specific date verification', () => {
    // These tests verify exact start/end dates for some common cases

    it('should parse "last 7 days" with correct dates', () => {
      // Reference: Jan 15, 2025
      // Last 7 days: Jan 8-15
      expectRelativeSpan(
        'last 7 days',
        utc(2025, 1, 8, 12, 0),
        utc(2025, 1, 15, 12, 0)
      );
    });

    it('should parse "next 7 days" with correct dates', () => {
      // Reference: Jan 15, 2025
      // Next 7 days: Jan 15-22
      expectRelativeSpan(
        'next 7 days',
        utc(2025, 1, 15, 12, 0),
        utc(2025, 1, 22, 12, 0)
      );
    });

    it('should parse "last 2 weeks" with correct dates', () => {
      // Reference: Jan 15, 2025
      // Last 2 weeks: Jan 1-15
      expectRelativeSpan(
        'last 2 weeks',
        utc(2025, 1, 1, 12, 0),
        utc(2025, 1, 15, 12, 0)
      );
    });

    it('should parse "next 2 weeks" with correct dates', () => {
      // Reference: Jan 15, 2025
      // Next 2 weeks: Jan 15-29
      expectRelativeSpan(
        'next 2 weeks',
        utc(2025, 1, 15, 12, 0),
        utc(2025, 1, 29, 12, 0)
      );
    });
  });

  describe('Edge cases', () => {
    it('should parse "last 1 day"', () => {
      expectRelativeDuration('last 1 day', MS_PER_DAY, 'past');
    });

    it('should parse "next 1 day"', () => {
      expectRelativeDuration('next 1 day', MS_PER_DAY, 'future');
    });

    it('should parse "last 100 days"', () => {
      expectRelativeDuration('last 100 days', 100 * MS_PER_DAY, 'past');
    });

    it('should parse "next 100 days"', () => {
      expectRelativeDuration('next 100 days', 100 * MS_PER_DAY, 'future');
    });

    it('should parse "past 24 hours"', () => {
      expectRelativeDuration('past 24 hours', 24 * 60 * 60 * 1000, 'past');
    });

    it('should parse "next 48 hours"', () => {
      expectRelativeDuration('next 48 hours', 48 * 60 * 60 * 1000, 'future');
    });
  });

  describe('Word numbers', () => {
    it('should parse "last two weeks"', () => {
      expectRelativeDuration('last two weeks', 2 * MS_PER_WEEK, 'past');
    });

    it('should parse "next three days"', () => {
      expectRelativeDuration('next three days', 3 * MS_PER_DAY, 'future');
    });

    it('should parse "past five days"', () => {
      expectRelativeDuration('past five days', 5 * MS_PER_DAY, 'past');
    });

    it('should parse "coming four weeks"', () => {
      expectRelativeDuration('coming four weeks', 4 * MS_PER_WEEK, 'future');
    });
  });
});

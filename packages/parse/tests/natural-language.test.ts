import {describe, expect, it} from 'vitest';
import {DateResult, parse, SpanResult} from '../src';

// Fixed reference date for deterministic tests
// Wednesday, January 15, 2025 at 12:00:00 UTC
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

function expectDate(input: string, expectedDate: Date, options = { referenceDate }) {
  const result = parse(input, options) as DateResult;
  expect(result).not.toBeNull();
  expect(result.type).toBe('date');
  expect(result.date.toISOString()).toBe(expectedDate.toISOString());
}

function expectSpan(input: string, expectedStart: Date, expectedEnd: Date, options = { referenceDate }) {
  const result = parse(input, options) as SpanResult;
  expect(result).not.toBeNull();
  expect(result.type).toBe('span');
  expect(result.start.toISOString()).toBe(expectedStart.toISOString());
  expect(result.end.toISOString()).toBe(expectedEnd.toISOString());
}

describe('Natural Language Date Patterns', () => {
  describe('Tonight/Last Night patterns', () => {
    it('should parse "tonight"', () => {
      // Tonight is the evening of the reference date
      const result = parse('tonight', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.start.getUTCDate()).toBe(15);
      expect(result.start.getUTCHours()).toBeGreaterThanOrEqual(18);
    });

    it('should parse "last night"', () => {
      // Last night is the evening before the reference date
      const result = parse('last night', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.start.getUTCDate()).toBe(14);
    });

    it('should parse "tomorrow night"', () => {
      const result = parse('tomorrow night', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.start.getUTCDate()).toBe(16);
    });
  });

  describe('Weekend patterns', () => {
    // Reference: Wednesday Jan 15, 2025
    // This weekend: Sat Jan 18 - Sun Jan 19
    // Next weekend: Sat Jan 25 - Sun Jan 26
    // Last weekend: Sat Jan 11 - Sun Jan 12

    it('should parse "this weekend"', () => {
      expectSpan('this weekend', utc(2025, 1, 18), utc(2025, 1, 19, 23, 59));
    });

    it('should parse "next weekend"', () => {
      expectSpan('next weekend', utc(2025, 1, 25), utc(2025, 1, 26, 23, 59));
    });

    it('should parse "last weekend"', () => {
      expectSpan('last weekend', utc(2025, 1, 11), utc(2025, 1, 12, 23, 59));
    });

    it('should parse "the weekend"', () => {
      // Should default to this weekend
      expectSpan('the weekend', utc(2025, 1, 18), utc(2025, 1, 19, 23, 59));
    });
  });

  describe('"The Xth" patterns (day of month without month name)', () => {
    // Reference: Jan 15, 2025
    // "the 15th" - today or next occurrence
    // "the 20th" - this month (Jan 20)
    // "the 10th" - next month (Feb 10) since it already passed
    // "the 1st" - next month (Feb 1)

    it('should parse "the 15th" as today when reference is the 15th', () => {
      expectDate('the 15th', utc(2025, 1, 15));
    });

    it('should parse "the 20th" as this month when not yet passed', () => {
      expectDate('the 20th', utc(2025, 1, 20));
    });

    it('should parse "the 10th" as next month when already passed', () => {
      expectDate('the 10th', utc(2025, 2, 10));
    });

    it('should parse "the 1st" as next month when already passed', () => {
      expectDate('the 1st', utc(2025, 2, 1));
    });

    it('should parse "on the 25th"', () => {
      expectDate('on the 25th', utc(2025, 1, 25));
    });

    it('should parse "the 31st" finding next valid occurrence', () => {
      // Jan 31 hasn't passed, so Jan 31
      expectDate('the 31st', utc(2025, 1, 31));
    });
  });

  describe('Ordinal weekday of month patterns', () => {
    // Reference: Jan 15, 2025 (Wednesday)

    it('should parse "first Monday of January"', () => {
      expectDate('first Monday of January', utc(2025, 1, 6));
    });

    it('should parse "first Monday of February"', () => {
      expectDate('first Monday of February', utc(2025, 2, 3));
    });

    it('should parse "second Tuesday of January"', () => {
      expectDate('second Tuesday of January', utc(2025, 1, 14));
    });

    it('should parse "third Thursday of November"', () => {
      // Thanksgiving!
      expectDate('third Thursday of November', utc(2025, 11, 20));
    });

    it('should parse "last Friday of January"', () => {
      expectDate('last Friday of January', utc(2025, 1, 31));
    });

    it('should parse "last Friday of the month"', () => {
      // Current month is January
      expectDate('last Friday of the month', utc(2025, 1, 31));
    });

    it('should parse "first Monday of the month"', () => {
      expectDate('first Monday of the month', utc(2025, 1, 6));
    });

    it('should parse "first Monday of March"', () => {
      expectDate('first Monday of March', utc(2025, 3, 3));
    });

    it('should parse "last day of the month"', () => {
      expectDate('last day of the month', utc(2025, 1, 31));
    });

    it('should parse "last day of February"', () => {
      expectDate('last day of February', utc(2025, 2, 28));
    });

    it('should parse "first day of next month"', () => {
      expectDate('first day of next month', utc(2025, 2, 1));
    });
  });

  describe('"X before/after date" patterns', () => {
    it('should parse "2 days before Friday"', () => {
      // Next Friday is Jan 17, 2 days before is Jan 15
      expectDate('2 days before Friday', utc(2025, 1, 15));
    });

    it('should parse "a week after Monday"', () => {
      // Next Monday is Jan 20, a week after is Jan 27
      expectDate('a week after Monday', utc(2025, 1, 27));
    });

    it('should parse "3 days before March 15"', () => {
      expectDate('3 days before March 15', utc(2025, 3, 12));
    });

    it('should parse "1 week after March 15"', () => {
      expectDate('1 week after March 15', utc(2025, 3, 22));
    });

    it('should parse "the day before tomorrow"', () => {
      // Tomorrow is Jan 16, day before is Jan 15 (today)
      expectDate('the day before tomorrow', utc(2025, 1, 15));
    });

    it('should parse "the day after yesterday"', () => {
      // Yesterday is Jan 14, day after is Jan 15 (today)
      expectDate('the day after yesterday', utc(2025, 1, 15));
    });

    it('should parse "2 days after tomorrow"', () => {
      expectDate('2 days after tomorrow', utc(2025, 1, 18));
    });

    it('should parse "a month before March 15"', () => {
      expectDate('a month before March 15', utc(2025, 2, 15));
    });
  });

  describe('Time expressions (quarter past, half past, etc.)', () => {
    it('should parse "quarter past 3"', () => {
      expectDate('quarter past 3', utc(2025, 1, 15, 3, 15));
    });

    it('should parse "quarter past 3pm"', () => {
      expectDate('quarter past 3pm', utc(2025, 1, 15, 15, 15));
    });

    it('should parse "half past 4"', () => {
      expectDate('half past 4', utc(2025, 1, 15, 4, 30));
    });

    it('should parse "half past 10pm"', () => {
      expectDate('half past 10pm', utc(2025, 1, 15, 22, 30));
    });

    it('should parse "quarter to 5"', () => {
      expectDate('quarter to 5', utc(2025, 1, 15, 4, 45));
    });

    it('should parse "quarter to 5pm"', () => {
      expectDate('quarter to 5pm', utc(2025, 1, 15, 16, 45));
    });

    it('should parse "10 to noon"', () => {
      expectDate('10 to noon', utc(2025, 1, 15, 11, 50));
    });

    it('should parse "5 past 3"', () => {
      expectDate('5 past 3', utc(2025, 1, 15, 3, 5));
    });

    it('should parse "20 past 3pm"', () => {
      expectDate('20 past 3pm', utc(2025, 1, 15, 15, 20));
    });

    it('should parse "10 to midnight"', () => {
      expectDate('10 to midnight', utc(2025, 1, 15, 23, 50));
    });

    it('should parse "tomorrow half past 9"', () => {
      expectDate('tomorrow half past 9', utc(2025, 1, 16, 9, 30));
    });
  });

  describe('Later/earlier patterns', () => {
    it('should parse "later today"', () => {
      const result = parse('later today', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      // Later today should be from reference time to end of day
      expect(result.start.getUTCDate()).toBe(15);
    });

    it('should parse "earlier today"', () => {
      const result = parse('earlier today', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.start.getUTCDate()).toBe(15);
    });

    it('should parse "later this week"', () => {
      const result = parse('later this week', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      // Should be from reference to end of week
    });

    it('should parse "earlier this week"', () => {
      const result = parse('earlier this week', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
    });

    it('should parse "later this month"', () => {
      const result = parse('later this month', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
    });
  });

  describe('Week number patterns', () => {
    it('should parse "week 1"', () => {
      // Week 1 of current year
      const result = parse('week 1', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.type).toBe('span');
    });

    it('should parse "week 12"', () => {
      const result = parse('week 12', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.type).toBe('span');
    });

    it('should parse "week 12 2025"', () => {
      const result = parse('week 12 2025', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.type).toBe('span');
    });

    it('should parse "the week of March 15"', () => {
      const result = parse('the week of March 15', { referenceDate }) as SpanResult;
      expect(result).not.toBeNull();
      expect(result.type).toBe('span');
    });
  });

  describe('Business day patterns', () => {
    // Reference: Wednesday Jan 15, 2025

    it('should parse "next business day"', () => {
      // Next business day from Wed Jan 15 is Thu Jan 16
      expectDate('next business day', utc(2025, 1, 16));
    });

    it('should parse "in 5 business days"', () => {
      // Wed + 5 business days = Wed Jan 22
      expectDate('in 5 business days', utc(2025, 1, 22));
    });

    it('should parse "2 business days ago"', () => {
      // Wed - 2 business days = Mon Jan 13
      expectDate('2 business days ago', utc(2025, 1, 13));
    });

    it('should parse "next business day" on Friday', () => {
      // Friday Jan 17 -> next business day is Monday Jan 20
      const fridayRef = new Date('2025-01-17T12:00:00.000Z');
      expectDate('next business day', utc(2025, 1, 20), { referenceDate: fridayRef });
    });

    it('should parse "in 1 business day" on Friday', () => {
      // Friday Jan 17 -> 1 business day is Monday Jan 20
      const fridayRef = new Date('2025-01-17T12:00:00.000Z');
      expectDate('in 1 business day', utc(2025, 1, 20), { referenceDate: fridayRef });
    });
  });

  describe('EOD/COB patterns', () => {
    it('should parse "EOD"', () => {
      expectDate('EOD', utc(2025, 1, 15, 23, 59));
    });

    it('should parse "COB"', () => {
      // Close of business, typically 5pm or 6pm
      expectDate('COB', utc(2025, 1, 15, 17, 0));
    });

    it('should parse "EOD Friday"', () => {
      expectDate('EOD Friday', utc(2025, 1, 17, 23, 59));
    });

    it('should parse "COB Monday"', () => {
      expectDate('COB Monday', utc(2025, 1, 20, 17, 0));
    });

    it('should parse "end of day tomorrow"', () => {
      expectDate('end of day tomorrow', utc(2025, 1, 16, 23, 59));
    });

    it('should parse "close of business Friday"', () => {
      expectDate('close of business Friday', utc(2025, 1, 17, 17, 0));
    });
  });

  describe('Fortnight patterns', () => {
    it('should parse "a fortnight from now"', () => {
      expectDate('a fortnight from now', utc(2025, 1, 29, 12, 0));
    });

    it('should parse "in a fortnight"', () => {
      expectDate('in a fortnight', utc(2025, 1, 29, 12, 0));
    });

    it('should parse "a fortnight ago"', () => {
      expectDate('a fortnight ago', utc(2025, 1, 1, 12, 0));
    });

    it('should parse "2 fortnights from now"', () => {
      expectDate('2 fortnights from now', utc(2025, 2, 12, 12, 0));
    });
  });

  describe('Noon/Midnight with dates', () => {
    it('should parse "noon tomorrow"', () => {
      expectDate('noon tomorrow', utc(2025, 1, 16, 12, 0));
    });

    it('should parse "midnight tonight"', () => {
      // Midnight tonight could be start of today or end of today
      // Typically means end of today / start of tomorrow
      const result = parse('midnight tonight', { referenceDate });
      expect(result).not.toBeNull();
    });

    it('should parse "noon on Friday"', () => {
      expectDate('noon on Friday', utc(2025, 1, 17, 12, 0));
    });

    it('should parse "midnight on Saturday"', () => {
      expectDate('midnight on Saturday', utc(2025, 1, 18, 0, 0));
    });

    it('should parse "friday noon"', () => {
      expectDate('friday noon', utc(2025, 1, 17, 12, 0));
    });

    it('should parse "friday midnight"', () => {
      expectDate('friday midnight', utc(2025, 1, 17, 0, 0));
    });

    it('should parse "tomorrow noon"', () => {
      expectDate('tomorrow noon', utc(2025, 1, 16, 12, 0));
    });

    it('should parse "next monday noon"', () => {
      expectDate('next monday noon', utc(2025, 1, 20, 12, 0));
    });
  });
});

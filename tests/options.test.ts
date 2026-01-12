import { describe, it, expect } from 'vitest';
import { parse, DateResult, FuzzyResult } from '../src/index';

function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

describe('Parse Options', () => {
  describe('referenceDate option', () => {
    it('should parse "next friday" with referenceDate of 2025-01-01 (Wednesday)', () => {
      const ref = new Date('2025-01-01T12:00:00.000Z'); // Wednesday
      const result = parse('next friday', { referenceDate: ref }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.toISOString()).toBe(utc(2025, 1, 3).toISOString());
    });

    it('should parse "next friday" with referenceDate of 2025-06-15 (Sunday)', () => {
      const ref = new Date('2025-06-15T12:00:00.000Z'); // Sunday
      const result = parse('next friday', { referenceDate: ref }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.toISOString()).toBe(utc(2025, 6, 20).toISOString());
    });

    it('should parse "last month" with referenceDate of 2025-03-01', () => {
      const ref = new Date('2025-03-01T12:00:00.000Z');
      const result = parse('last month', { referenceDate: ref }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCMonth()).toBe(1); // February (0-indexed)
    });

    it('should parse "Q1" with referenceDate of 2025-06-01 as next Q1', () => {
      const ref = new Date('2025-06-01T12:00:00.000Z'); // In Q2
      const result = parse('Q1', { referenceDate: ref }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCFullYear()).toBe(2026);
    });

    it('should parse "january" with referenceDate of 2025-11-15 as next January', () => {
      const ref = new Date('2025-11-15T12:00:00.000Z');
      const result = parse('january 1', { referenceDate: ref }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCFullYear()).toBe(2026);
      expect(result.date.getUTCMonth()).toBe(0);
    });

    it('should parse "tomorrow" with different reference dates', () => {
      const ref1 = new Date('2025-01-15T12:00:00.000Z');
      const ref2 = new Date('2025-06-20T12:00:00.000Z');

      const result1 = parse('tomorrow', { referenceDate: ref1 }) as DateResult;
      const result2 = parse('tomorrow', { referenceDate: ref2 }) as DateResult;

      expect(result1.type).toBe('date');
      expect(result2.type).toBe('date');
      expect(result1.date.toISOString()).toBe(utc(2025, 1, 16).toISOString());
      expect(result2.date.toISOString()).toBe(utc(2025, 6, 21).toISOString());
    });

    it('should parse "end of month" with different reference dates', () => {
      const refJan = new Date('2025-01-15T12:00:00.000Z');
      const refFeb = new Date('2025-02-10T12:00:00.000Z');

      const result1 = parse('end of month', { referenceDate: refJan }) as DateResult;
      const result2 = parse('end of month', { referenceDate: refFeb }) as DateResult;

      expect(result1.type).toBe('date');
      expect(result2.type).toBe('date');
      expect(result1.date.getUTCDate()).toBe(31); // Jan 31
      expect(result2.date.getUTCDate()).toBe(28); // Feb 28 (non-leap year)
    });
  });

  describe('fiscalYearStart option', () => {
    const ref = new Date('2025-01-15T12:00:00.000Z');

    it('should parse "Q1" with fiscal year starting in january (default)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'january' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(0); // January
      expect(result.end.getUTCMonth()).toBe(2); // March
    });

    it('should parse "Q1" with fiscal year starting in april (UK style)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(3); // April
      expect(result.end.getUTCMonth()).toBe(5); // June
    });

    it('should parse "Q1" with fiscal year starting in july (Australian style)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'july' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(6); // July
      expect(result.end.getUTCMonth()).toBe(8); // September
    });

    it('should parse "Q1" with fiscal year starting in october (US federal style)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'october' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(9); // October
      expect(result.end.getUTCMonth()).toBe(11); // December
    });

    it('should parse "first quarter" with different fiscal year starts', () => {
      const resultJan = parse('first quarter', { referenceDate: ref, fiscalYearStart: 'january' }) as FuzzyResult;
      const resultApr = parse('first quarter', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;

      expect(resultJan.type).toBe('fuzzy');
      expect(resultApr.type).toBe('fuzzy');
      expect(resultJan.start.getUTCMonth()).toBe(0); // January
      expect(resultApr.start.getUTCMonth()).toBe(3); // April
    });

    it('should parse "Q2" with fiscal year starting in april', () => {
      const result = parse('Q2', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(6); // July
      expect(result.end.getUTCMonth()).toBe(8); // September
    });

    it('should parse "Q3" with fiscal year starting in april', () => {
      const result = parse('Q3', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(9); // October
      expect(result.end.getUTCMonth()).toBe(11); // December
    });

    it('should parse "Q4" with fiscal year starting in april', () => {
      const result = parse('Q4', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(0); // January
      expect(result.end.getUTCMonth()).toBe(2); // March
    });

    it('should parse "H1" with fiscal year starting in april', () => {
      const result = parse('H1', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(3); // April
      expect(result.end.getUTCMonth()).toBe(8); // September
    });

    it('should parse "H2" with fiscal year starting in april', () => {
      const result = parse('H2', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(9); // October
    });
  });

  describe('weekStartsOn option', () => {
    const ref = new Date('2025-01-15T12:00:00.000Z'); // Wednesday

    it('should parse "next week" with week starting on sunday', () => {
      const result = parse('next week', { referenceDate: ref, weekStartsOn: 'sunday' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCDay()).toBe(0); // Sunday
      expect(result.date.getUTCDate()).toBe(19);
    });

    it('should parse "next week" with week starting on monday', () => {
      const result = parse('next week', { referenceDate: ref, weekStartsOn: 'monday' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCDay()).toBe(1); // Monday
      expect(result.date.getUTCDate()).toBe(20);
    });

    it('should parse "beginning of week" with week starting on sunday', () => {
      const result = parse('beginning of week', { referenceDate: ref, weekStartsOn: 'sunday' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCDay()).toBe(0);
      expect(result.date.getUTCDate()).toBe(12);
    });

    it('should parse "beginning of week" with week starting on monday', () => {
      const result = parse('beginning of week', { referenceDate: ref, weekStartsOn: 'monday' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCDay()).toBe(1);
      expect(result.date.getUTCDate()).toBe(13);
    });

    it('should parse "end of week" with week starting on sunday', () => {
      const result = parse('end of week', { referenceDate: ref, weekStartsOn: 'sunday' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCDay()).toBe(6);
      expect(result.date.getUTCDate()).toBe(18);
    });

    it('should parse "end of week" with week starting on monday', () => {
      const result = parse('end of week', { referenceDate: ref, weekStartsOn: 'monday' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCDay()).toBe(0);
      expect(result.date.getUTCDate()).toBe(19);
    });

    it('should parse "this week" with different week starts', () => {
      const resultSun = parse('this week', { referenceDate: ref, weekStartsOn: 'sunday' }) as DateResult;
      const resultMon = parse('this week', { referenceDate: ref, weekStartsOn: 'monday' }) as DateResult;

      expect(resultSun.type).toBe('date');
      expect(resultMon.type).toBe('date');
    });
  });

  describe('dateFormat option', () => {
    const ref = new Date('2025-01-15T12:00:00.000Z');

    it('should parse "01/02/2025" with dateFormat: us as January 2nd', () => {
      const result = parse('01/02/2025', { referenceDate: ref, dateFormat: 'us' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCMonth()).toBe(0); // January
      expect(result.date.getUTCDate()).toBe(2);
    });

    it('should parse "01/02/2025" with dateFormat: intl as February 1st', () => {
      const result = parse('01/02/2025', { referenceDate: ref, dateFormat: 'intl' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCMonth()).toBe(1); // February
      expect(result.date.getUTCDate()).toBe(1);
    });

    it('should parse "13/02/2025" with dateFormat: us as February 13th (unambiguous)', () => {
      const result = parse('13/02/2025', { referenceDate: ref, dateFormat: 'us' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCMonth()).toBe(1); // February
      expect(result.date.getUTCDate()).toBe(13);
    });

    it('should parse "13/02/2025" with dateFormat: intl as February 13th', () => {
      const result = parse('13/02/2025', { referenceDate: ref, dateFormat: 'intl' }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCMonth()).toBe(1); // February
      expect(result.date.getUTCDate()).toBe(13);
    });

    it('should parse "01/02/2025" with dateFormat: auto as ambiguous', () => {
      const result = parse('01/02/2025', { referenceDate: ref, dateFormat: 'auto' });
      // Could be null (ambiguous) or pick one interpretation
      // Implementation decision - just verify it doesn't crash
    });

    it('should parse "2025-01-02" regardless of dateFormat as January 2nd (ISO)', () => {
      const result1 = parse('2025-01-02', { referenceDate: ref, dateFormat: 'us' }) as DateResult;
      const result2 = parse('2025-01-02', { referenceDate: ref, dateFormat: 'intl' }) as DateResult;

      expect(result1.type).toBe('date');
      expect(result2.type).toBe('date');
      expect(result1.date.getUTCMonth()).toBe(0);
      expect(result1.date.getUTCDate()).toBe(2);
      expect(result2.date.getUTCMonth()).toBe(0);
      expect(result2.date.getUTCDate()).toBe(2);
    });

    it('should parse "2025/01/02" as January 2nd (ISO-like)', () => {
      const result = parse('2025/01/02', { referenceDate: ref }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCMonth()).toBe(0);
      expect(result.date.getUTCDate()).toBe(2);
    });
  });

  describe('Combined options', () => {
    it('should handle referenceDate + fiscalYearStart together', () => {
      const ref = new Date('2025-02-01T12:00:00.000Z');
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(3); // April
    });

    it('should handle referenceDate + weekStartsOn together', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('next week', { referenceDate: ref, weekStartsOn: 'monday' }) as DateResult;
      expect(result.type).toBe('date');
    });

    it('should handle all options combined', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('Q1', {
        referenceDate: ref,
        fiscalYearStart: 'april',
        weekStartsOn: 'monday',
        dateFormat: 'intl'
      }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
    });
  });

  describe('Default values', () => {
    it('should use current date as default referenceDate', () => {
      const now = new Date();
      const result = parse('tomorrow') as DateResult;

      expect(result.type).toBe('date');
      const expectedTomorrow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1
      ));
      expect(result.date.toISOString()).toBe(expectedTomorrow.toISOString());
    });

    it('should use january as default fiscalYearStart', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('Q1', { referenceDate: ref }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(0);
    });

    it('should use sunday as default weekStartsOn', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('beginning of week', { referenceDate: ref }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCDay()).toBe(0);
    });

    it('should use intl as default dateFormat', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('01/02/2025', { referenceDate: ref }) as DateResult;
      expect(result.type).toBe('date');
      expect(result.date.getUTCMonth()).toBe(1); // February
      expect(result.date.getUTCDate()).toBe(1);
    });
  });
});

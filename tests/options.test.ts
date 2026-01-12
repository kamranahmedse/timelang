import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

// Helper to create dates in UTC
function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

describe('Parse Options', () => {
  describe('referenceDate option', () => {
    it('should parse "next friday" with referenceDate of 2025-01-01 (Wednesday)', () => {
      const ref = new Date('2025-01-01T12:00:00.000Z'); // Wednesday
      const result = parse('next friday', { referenceDate: ref });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      if (result?.type === 'date') {
        // Next Friday after Jan 1 (Wed) is Jan 3
        expect(result.date.toISOString()).toBe(utc(2025, 1, 3).toISOString());
      }
    });

    it('should parse "next friday" with referenceDate of 2025-06-15 (Sunday)', () => {
      const ref = new Date('2025-06-15T12:00:00.000Z'); // Sunday
      const result = parse('next friday', { referenceDate: ref });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
      if (result?.type === 'date') {
        // Next Friday after Jun 15 (Sun) is Jun 20
        expect(result.date.toISOString()).toBe(utc(2025, 6, 20).toISOString());
      }
    });

    it('should parse "last month" with referenceDate of 2025-03-01', () => {
      const ref = new Date('2025-03-01T12:00:00.000Z');
      const result = parse('last month', { referenceDate: ref });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Last month from March is February
        expect(result.date.getUTCMonth()).toBe(1); // February (0-indexed)
      }
    });

    it('should parse "Q1" with referenceDate of 2025-06-01 as next Q1', () => {
      const ref = new Date('2025-06-01T12:00:00.000Z'); // In Q2
      const result = parse('Q1', { referenceDate: ref });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q1 after June should be Q1 2026 (next occurrence)
        expect(result.start.getUTCFullYear()).toBe(2026);
      }
    });

    it('should parse "january" with referenceDate of 2025-11-15 as next January', () => {
      const ref = new Date('2025-11-15T12:00:00.000Z');
      const result = parse('january 1', { referenceDate: ref });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // January after November 2025 should be January 2026
        expect(result.date.getUTCFullYear()).toBe(2026);
        expect(result.date.getUTCMonth()).toBe(0);
      }
    });

    it('should parse "tomorrow" with different reference dates', () => {
      const ref1 = new Date('2025-01-15T12:00:00.000Z');
      const ref2 = new Date('2025-06-20T12:00:00.000Z');

      const result1 = parse('tomorrow', { referenceDate: ref1 });
      const result2 = parse('tomorrow', { referenceDate: ref2 });

      expect(result1?.type).toBe('date');
      expect(result2?.type).toBe('date');

      if (result1?.type === 'date' && result2?.type === 'date') {
        expect(result1.date.toISOString()).toBe(utc(2025, 1, 16).toISOString());
        expect(result2.date.toISOString()).toBe(utc(2025, 6, 21).toISOString());
      }
    });

    it('should parse "end of month" with different reference dates', () => {
      const refJan = new Date('2025-01-15T12:00:00.000Z');
      const refFeb = new Date('2025-02-10T12:00:00.000Z');

      const result1 = parse('end of month', { referenceDate: refJan });
      const result2 = parse('end of month', { referenceDate: refFeb });

      if (result1?.type === 'date' && result2?.type === 'date') {
        expect(result1.date.getUTCDate()).toBe(31); // Jan 31
        expect(result2.date.getUTCDate()).toBe(28); // Feb 28 (non-leap year)
      }
    });
  });

  describe('fiscalYearStart option', () => {
    const ref = new Date('2025-01-15T12:00:00.000Z');

    it('should parse "Q1" with fiscal year starting in january (default)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'january' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q1 with January fiscal year = Jan 1 - Mar 31
        expect(result.start.getUTCMonth()).toBe(0); // January
        expect(result.end.getUTCMonth()).toBe(2); // March
      }
    });

    it('should parse "Q1" with fiscal year starting in april (UK style)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'april' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q1 with April fiscal year = Apr 1 - Jun 30
        expect(result.start.getUTCMonth()).toBe(3); // April
        expect(result.end.getUTCMonth()).toBe(5); // June
      }
    });

    it('should parse "Q1" with fiscal year starting in july (Australian style)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'july' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q1 with July fiscal year = Jul 1 - Sep 30
        expect(result.start.getUTCMonth()).toBe(6); // July
        expect(result.end.getUTCMonth()).toBe(8); // September
      }
    });

    it('should parse "Q1" with fiscal year starting in october (US federal style)', () => {
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'october' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q1 with October fiscal year = Oct 1 - Dec 31
        expect(result.start.getUTCMonth()).toBe(9); // October
        expect(result.end.getUTCMonth()).toBe(11); // December
      }
    });

    it('should parse "first quarter" with different fiscal year starts', () => {
      const resultJan = parse('first quarter', { referenceDate: ref, fiscalYearStart: 'january' });
      const resultApr = parse('first quarter', { referenceDate: ref, fiscalYearStart: 'april' });

      if (resultJan?.type === 'fuzzy' && resultApr?.type === 'fuzzy') {
        expect(resultJan.start.getUTCMonth()).toBe(0); // January
        expect(resultApr.start.getUTCMonth()).toBe(3); // April
      }
    });

    it('should parse "Q2" with fiscal year starting in april', () => {
      const result = parse('Q2', { referenceDate: ref, fiscalYearStart: 'april' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q2 with April fiscal year = Jul 1 - Sep 30
        expect(result.start.getUTCMonth()).toBe(6); // July
        expect(result.end.getUTCMonth()).toBe(8); // September
      }
    });

    it('should parse "Q3" with fiscal year starting in april', () => {
      const result = parse('Q3', { referenceDate: ref, fiscalYearStart: 'april' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q3 with April fiscal year = Oct 1 - Dec 31
        expect(result.start.getUTCMonth()).toBe(9); // October
        expect(result.end.getUTCMonth()).toBe(11); // December
      }
    });

    it('should parse "Q4" with fiscal year starting in april', () => {
      const result = parse('Q4', { referenceDate: ref, fiscalYearStart: 'april' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // Q4 with April fiscal year = Jan 1 - Mar 31
        expect(result.start.getUTCMonth()).toBe(0); // January
        expect(result.end.getUTCMonth()).toBe(2); // March
      }
    });

    it('should parse "H1" with fiscal year starting in april', () => {
      const result = parse('H1', { referenceDate: ref, fiscalYearStart: 'april' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // H1 with April fiscal year = Apr 1 - Sep 30
        expect(result.start.getUTCMonth()).toBe(3); // April
        expect(result.end.getUTCMonth()).toBe(8); // September
      }
    });

    it('should parse "H2" with fiscal year starting in april', () => {
      const result = parse('H2', { referenceDate: ref, fiscalYearStart: 'april' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // H2 with April fiscal year = Oct 1 - Mar 31
        expect(result.start.getUTCMonth()).toBe(9); // October
      }
    });
  });

  describe('weekStartsOn option', () => {
    const ref = new Date('2025-01-15T12:00:00.000Z'); // Wednesday

    it('should parse "next week" with week starting on sunday', () => {
      const result = parse('next week', { referenceDate: ref, weekStartsOn: 'sunday' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Next week starts on Sunday Jan 19
        expect(result.date.getUTCDay()).toBe(0); // Sunday
        expect(result.date.getUTCDate()).toBe(19);
      }
    });

    it('should parse "next week" with week starting on monday', () => {
      const result = parse('next week', { referenceDate: ref, weekStartsOn: 'monday' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Next week starts on Monday Jan 20
        expect(result.date.getUTCDay()).toBe(1); // Monday
        expect(result.date.getUTCDate()).toBe(20);
      }
    });

    it('should parse "beginning of week" with week starting on sunday', () => {
      const result = parse('beginning of week', { referenceDate: ref, weekStartsOn: 'sunday' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Beginning of current week (Sunday Jan 12)
        expect(result.date.getUTCDay()).toBe(0);
        expect(result.date.getUTCDate()).toBe(12);
      }
    });

    it('should parse "beginning of week" with week starting on monday', () => {
      const result = parse('beginning of week', { referenceDate: ref, weekStartsOn: 'monday' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Beginning of current week (Monday Jan 13)
        expect(result.date.getUTCDay()).toBe(1);
        expect(result.date.getUTCDate()).toBe(13);
      }
    });

    it('should parse "end of week" with week starting on sunday', () => {
      const result = parse('end of week', { referenceDate: ref, weekStartsOn: 'sunday' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // End of current week (Saturday Jan 18)
        expect(result.date.getUTCDay()).toBe(6);
        expect(result.date.getUTCDate()).toBe(18);
      }
    });

    it('should parse "end of week" with week starting on monday', () => {
      const result = parse('end of week', { referenceDate: ref, weekStartsOn: 'monday' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // End of current week (Sunday Jan 19)
        expect(result.date.getUTCDay()).toBe(0);
        expect(result.date.getUTCDate()).toBe(19);
      }
    });

    it('should parse "this week" with different week starts', () => {
      const resultSun = parse('this week', { referenceDate: ref, weekStartsOn: 'sunday' });
      const resultMon = parse('this week', { referenceDate: ref, weekStartsOn: 'monday' });

      expect(resultSun).not.toBeNull();
      expect(resultMon).not.toBeNull();
    });
  });

  describe('dateFormat option', () => {
    const ref = new Date('2025-01-15T12:00:00.000Z');

    it('should parse "01/02/2025" with dateFormat: us as January 2nd', () => {
      const result = parse('01/02/2025', { referenceDate: ref, dateFormat: 'us' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCMonth()).toBe(0); // January
        expect(result.date.getUTCDate()).toBe(2);
      }
    });

    it('should parse "01/02/2025" with dateFormat: intl as February 1st', () => {
      const result = parse('01/02/2025', { referenceDate: ref, dateFormat: 'intl' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCMonth()).toBe(1); // February
        expect(result.date.getUTCDate()).toBe(1);
      }
    });

    it('should parse "13/02/2025" with dateFormat: us as February 13th (unambiguous)', () => {
      const result = parse('13/02/2025', { referenceDate: ref, dateFormat: 'us' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // 13 can't be a month, so it must be day/month/year
        expect(result.date.getUTCMonth()).toBe(1); // February
        expect(result.date.getUTCDate()).toBe(13);
      }
    });

    it('should parse "13/02/2025" with dateFormat: intl as February 13th', () => {
      const result = parse('13/02/2025', { referenceDate: ref, dateFormat: 'intl' });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCMonth()).toBe(1); // February
        expect(result.date.getUTCDate()).toBe(13);
      }
    });

    it('should parse "01/02/2025" with dateFormat: auto as ambiguous', () => {
      const result = parse('01/02/2025', { referenceDate: ref, dateFormat: 'auto' });
      // Could be null (ambiguous) or pick one interpretation
      // Implementation decision - just verify it doesn't crash
    });

    it('should parse "2025-01-02" regardless of dateFormat as January 2nd (ISO)', () => {
      const result1 = parse('2025-01-02', { referenceDate: ref, dateFormat: 'us' });
      const result2 = parse('2025-01-02', { referenceDate: ref, dateFormat: 'intl' });

      expect(result1?.type).toBe('date');
      expect(result2?.type).toBe('date');

      if (result1?.type === 'date' && result2?.type === 'date') {
        // ISO format always unambiguous
        expect(result1.date.getUTCMonth()).toBe(0);
        expect(result1.date.getUTCDate()).toBe(2);
        expect(result2.date.getUTCMonth()).toBe(0);
        expect(result2.date.getUTCDate()).toBe(2);
      }
    });

    it('should parse "2025/01/02" as January 2nd (ISO-like)', () => {
      const result = parse('2025/01/02', { referenceDate: ref });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCMonth()).toBe(0);
        expect(result.date.getUTCDate()).toBe(2);
      }
    });
  });

  describe('Combined options', () => {
    it('should handle referenceDate + fiscalYearStart together', () => {
      const ref = new Date('2025-02-01T12:00:00.000Z');
      const result = parse('Q1', { referenceDate: ref, fiscalYearStart: 'april' });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        // We're in Feb (which is Q4 of April fiscal year)
        // So Q1 should be next occurrence (Apr-Jun 2025)
        expect(result.start.getUTCMonth()).toBe(3); // April
      }
    });

    it('should handle referenceDate + weekStartsOn together', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('next week', { referenceDate: ref, weekStartsOn: 'monday' });
      expect(result).not.toBeNull();
    });

    it('should handle all options combined', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('Q1', {
        referenceDate: ref,
        fiscalYearStart: 'april',
        weekStartsOn: 'monday',
        dateFormat: 'intl'
      });
      expect(result).not.toBeNull();
    });
  });

  describe('Default values', () => {
    it('should use current date as default referenceDate', () => {
      const before = new Date();
      const result = parse('tomorrow');
      const after = new Date();

      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Tomorrow should be between before+1day and after+1day
        const minDate = new Date(before.getTime() + 24 * 60 * 60 * 1000);
        const maxDate = new Date(after.getTime() + 24 * 60 * 60 * 1000);
        expect(result.date.getTime()).toBeGreaterThanOrEqual(minDate.getTime() - 1000);
        expect(result.date.getTime()).toBeLessThanOrEqual(maxDate.getTime() + 1000);
      }
    });

    it('should use january as default fiscalYearStart', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('Q1', { referenceDate: ref });
      expect(result).not.toBeNull();
      if (result?.type === 'fuzzy') {
        // Default fiscal year starts in January
        expect(result.start.getUTCMonth()).toBe(0);
      }
    });

    it('should use sunday as default weekStartsOn', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('beginning of week', { referenceDate: ref });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Default week starts on Sunday
        expect(result.date.getUTCDay()).toBe(0);
      }
    });

    it('should use intl as default dateFormat', () => {
      const ref = new Date('2025-01-15T12:00:00.000Z');
      const result = parse('01/02/2025', { referenceDate: ref });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        // Default is international (DD/MM/YYYY)
        expect(result.date.getUTCMonth()).toBe(1); // February
        expect(result.date.getUTCDate()).toBe(1);
      }
    });
  });
});

import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

// Fixed reference date for deterministic tests
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

// Duration constants
const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('Edge Cases', () => {
  describe('Case insensitivity', () => {
    it('should parse "NEXT FRIDAY"', () => {
      const result = parse('NEXT FRIDAY', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should parse "Next Friday"', () => {
      const result = parse('Next Friday', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should parse "next friday"', () => {
      const result = parse('next friday', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should parse "nExT fRiDaY"', () => {
      const result = parse('nExT fRiDaY', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should parse "JANUARY 15TH FOR 2 WEEKS"', () => {
      const result = parse('JANUARY 15TH FOR 2 WEEKS', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });

    it('should parse "Q1" and "q1" the same way', () => {
      const result1 = parse('Q1', { referenceDate });
      const result2 = parse('q1', { referenceDate });
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1?.type).toBe(result2?.type);
    });
  });

  describe('Whitespace handling', () => {
    it('should parse "  next friday  " (leading/trailing)', () => {
      const result = parse('  next friday  ', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should parse "next    friday" (multiple spaces)', () => {
      const result = parse('next    friday', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should parse "next\\tfriday" (tab)', () => {
      const result = parse('next\tfriday', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should handle "next\\nfriday" (newline within)', () => {
      const result = parse('next\nfriday', { referenceDate });
      // May or may not parse - newlines might split it
      // Just verify it doesn't crash
    });

    it('should parse "  next   friday   for   2   weeks  "', () => {
      const result = parse('  next   friday   for   2   weeks  ', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('span');
    });
  });

  describe('Invalid inputs (should return null)', () => {
    it('should return null for empty string', () => {
      const result = parse('', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const result = parse('   ', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "not a date at all"', () => {
      const result = parse('not a date at all', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "hello world"', () => {
      const result = parse('hello world', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "the quick brown fox"', () => {
      const result = parse('the quick brown fox', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "12345" (just numbers)', () => {
      const result = parse('12345', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "!!@@##$" (special characters)', () => {
      const result = parse('!!@@##$', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for non-latin characters', () => {
      const result = parse('日本語', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('Ambiguous inputs', () => {
    it('should handle "march" (bare month)', () => {
      const result = parse('march', { referenceDate });
      // Could be start of march or fuzzy "all of march"
      // Implementation decides - just verify it parses
      expect(result).not.toBeNull();
    });

    it('should handle "2025" (bare year)', () => {
      const result = parse('2025', { referenceDate });
      // Could be start of year or fuzzy "all year"
      expect(result).not.toBeNull();
    });

    it('should handle "monday" (bare weekday)', () => {
      const result = parse('monday', { referenceDate });
      // Should be next monday per design decision
      expect(result).not.toBeNull();
      expect(result?.type).toBe('date');
    });

    it('should return null for "5" (too ambiguous)', () => {
      const result = parse('5', { referenceDate });
      expect(result).toBeNull();
    });

    it('should handle "10-15" (could be range without context)', () => {
      const result = parse('10-15', { referenceDate });
      // Likely null without month context
      // Implementation decides
    });
  });

  describe('Year rollover', () => {
    const decemberRef = new Date('2025-12-15T12:00:00.000Z');
    const januaryRef = new Date('2025-01-15T12:00:00.000Z');
    const novemberRef = new Date('2025-11-15T12:00:00.000Z');

    it('should parse "january" in December as next January', () => {
      const result = parse('january 1', { referenceDate: decemberRef });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCFullYear()).toBe(2026);
        expect(result.date.getUTCMonth()).toBe(0);
      }
    });

    it('should parse "last december" in January as previous December', () => {
      const result = parse('last december', { referenceDate: januaryRef });
      expect(result).not.toBeNull();
      if (result?.type === 'date' || result?.type === 'fuzzy') {
        // Should be December 2024
        const date = result.type === 'date' ? result.date : result.start;
        expect(date.getUTCFullYear()).toBe(2024);
        expect(date.getUTCMonth()).toBe(11);
      }
    });

    it('should parse "next january" in November as upcoming January', () => {
      const result = parse('next january', { referenceDate: novemberRef });
      expect(result).not.toBeNull();
      if (result?.type === 'date' || result?.type === 'fuzzy') {
        const date = result.type === 'date' ? result.date : result.start;
        expect(date.getUTCFullYear()).toBe(2026);
        expect(date.getUTCMonth()).toBe(0);
      }
    });

    it('should parse "Q1" in Q4 as next Q1', () => {
      const q4Ref = new Date('2025-11-01T12:00:00.000Z');
      const result = parse('Q1', { referenceDate: q4Ref });
      expect(result).not.toBeNull();
      if (result?.type === 'fuzzy') {
        expect(result.start.getUTCFullYear()).toBe(2026);
      }
    });
  });

  describe('Leap years', () => {
    it('should parse "february 29th 2024" as valid (leap year)', () => {
      const result = parse('february 29th 2024', { referenceDate });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCMonth()).toBe(1);
        expect(result.date.getUTCDate()).toBe(29);
        expect(result.date.getUTCFullYear()).toBe(2024);
      }
    });

    it('should return null for "february 29th 2025" (not a leap year)', () => {
      const result = parse('february 29th 2025', { referenceDate });
      expect(result).toBeNull();
    });

    it('should handle "february 29th" with referenceDate in 2024', () => {
      const ref2024 = new Date('2024-01-15T12:00:00.000Z');
      const result = parse('february 29th', { referenceDate: ref2024 });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCMonth()).toBe(1);
        expect(result.date.getUTCDate()).toBe(29);
      }
    });

    it('should handle "february 29th" with referenceDate in 2025', () => {
      const result = parse('february 29th', { referenceDate });
      // Should either return null or find next leap year (2028)
      // Implementation decides
    });
  });

  describe('Month boundaries', () => {
    it('should parse "january 31st" as valid', () => {
      const result = parse('january 31st', { referenceDate });
      expect(result).not.toBeNull();
      if (result?.type === 'date') {
        expect(result.date.getUTCDate()).toBe(31);
      }
    });

    it('should return null for "january 32nd"', () => {
      const result = parse('january 32nd', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "february 30th"', () => {
      const result = parse('february 30th', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "february 31st"', () => {
      const result = parse('february 31st', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "april 31st"', () => {
      const result = parse('april 31st', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "september 31st"', () => {
      const result = parse('september 31st', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('Duration edge cases', () => {
    it('should parse "1000 days"', () => {
      const result = parse('1000 days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('duration');
      if (result?.type === 'duration') {
        expect(result.duration).toBe(1000 * MS_PER_DAY);
      }
    });

    it('should parse "100 years"', () => {
      const result = parse('100 years', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('duration');
    });

    it('should parse "1 second"', () => {
      const result = parse('1 second', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('duration');
      if (result?.type === 'duration') {
        expect(result.duration).toBe(1000);
      }
    });

    it('should parse "0.001 days"', () => {
      const result = parse('0.001 days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('duration');
    });

    it('should parse "0 days"', () => {
      const result = parse('0 days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.type).toBe('duration');
      if (result?.type === 'duration') {
        expect(result.duration).toBe(0);
      }
    });

    it('should return null for "-2 days" (negative)', () => {
      const result = parse('-2 days', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('Range edge cases', () => {
    it('should parse same day range "jan 5 to jan 5"', () => {
      const result = parse('jan 5 to jan 5', { referenceDate });
      expect(result).not.toBeNull();
      if (result?.type === 'span') {
        expect(result.duration).toBe(0);
        expect(result.start.toISOString()).toBe(result.end.toISOString());
      }
    });

    it('should handle reversed range "jan 20 to jan 5"', () => {
      const result = parse('jan 20 to jan 5', { referenceDate });
      // Should either return null or swap dates
      // Implementation decides - just don't crash
    });

    it('should parse very long range "2000 to 2100"', () => {
      const result = parse('2000 to 2100', { referenceDate });
      expect(result).not.toBeNull();
      if (result?.type === 'span') {
        expect(result.start.getUTCFullYear()).toBe(2000);
        expect(result.end.getUTCFullYear()).toBe(2100);
      }
    });
  });

  describe('Time edge cases', () => {
    it('should treat "midnight", "12am", and "00:00" the same', () => {
      const r1 = parse('tomorrow at midnight', { referenceDate });
      const r2 = parse('tomorrow at 12am', { referenceDate });
      const r3 = parse('tomorrow at 00:00', { referenceDate });

      expect(r1?.type).toBe('date');
      expect(r2?.type).toBe('date');
      expect(r3?.type).toBe('date');

      if (r1?.type === 'date' && r2?.type === 'date' && r3?.type === 'date') {
        expect(r1.date.getUTCHours()).toBe(0);
        expect(r2.date.getUTCHours()).toBe(0);
        expect(r3.date.getUTCHours()).toBe(0);
      }
    });

    it('should treat "noon", "12pm", and "12:00" the same', () => {
      const r1 = parse('tomorrow at noon', { referenceDate });
      const r2 = parse('tomorrow at 12pm', { referenceDate });
      const r3 = parse('tomorrow at 12:00', { referenceDate });

      expect(r1?.type).toBe('date');
      expect(r2?.type).toBe('date');
      expect(r3?.type).toBe('date');

      if (r1?.type === 'date' && r2?.type === 'date' && r3?.type === 'date') {
        expect(r1.date.getUTCHours()).toBe(12);
        expect(r2.date.getUTCHours()).toBe(12);
        expect(r3.date.getUTCHours()).toBe(12);
      }
    });

    it('should handle "24:00"', () => {
      const result = parse('tomorrow at 24:00', { referenceDate });
      // Could be null or next day 00:00 - implementation decides
    });

    it('should return null for "25:00"', () => {
      const result = parse('tomorrow at 25:00', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "9:60"', () => {
      const result = parse('tomorrow at 9:60', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('Parenthetical edge cases', () => {
    it('should return null for "Meeting ()" (empty parentheses)', () => {
      const result = parse('Meeting ()', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "Meeting (   )" (whitespace only)', () => {
      const result = parse('Meeting (   )', { referenceDate });
      expect(result).toBeNull();
    });

    it('should handle "Meeting (Jan 15" (unmatched open paren)', () => {
      const result = parse('Meeting (Jan 15', { referenceDate });
      // Should handle gracefully - might parse the date or return null
    });

    it('should handle "Meeting Jan 15)" (unmatched close paren)', () => {
      const result = parse('Meeting Jan 15)', { referenceDate });
      // Should handle gracefully
    });

    it('should parse "Meeting (Team A) (Jan 15)" correctly', () => {
      const result = parse('Meeting (Team A) (Jan 15)', { referenceDate });
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.title).toBe('Meeting (Team A)');
      }
    });

    it('should handle "Meeting ((Jan 15))" (nested parens)', () => {
      const result = parse('Meeting ((Jan 15))', { referenceDate });
      // Should handle gracefully
    });

    it('should parse "Meeting (weekly) - Jan 15" correctly', () => {
      const result = parse('Meeting (weekly) - Jan 15', { referenceDate });
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.title).toBe('Meeting (weekly)');
      }
    });

    it('should return null for "Meeting (TBD)" (non-date content)', () => {
      const result = parse('Meeting (TBD)', { referenceDate });
      expect(result).toBeNull();
    });

    it('should return null for "Meeting (ASAP)" (non-date content)', () => {
      const result = parse('Meeting (ASAP)', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('Return type validation', () => {
    it('should return type as one of date/duration/span/fuzzy', () => {
      const tests = ['tomorrow', '2 weeks', 'jan 5 for 10 days', 'Q1'];
      tests.forEach(input => {
        const result = parse(input, { referenceDate });
        if (result !== null) {
          expect(['date', 'duration', 'span', 'fuzzy']).toContain(result.type);
        }
      });
    });

    it('should have valid Date object for date type', () => {
      const result = parse('tomorrow', { referenceDate });
      expect(result?.type).toBe('date');
      if (result?.type === 'date') {
        expect(result.date instanceof Date).toBe(true);
        expect(isNaN(result.date.getTime())).toBe(false);
      }
    });

    it('should have positive duration for duration type', () => {
      const result = parse('2 weeks', { referenceDate });
      expect(result?.type).toBe('duration');
      if (result?.type === 'duration') {
        expect(typeof result.duration).toBe('number');
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have start <= end for span type', () => {
      const result = parse('jan 5 to jan 20', { referenceDate });
      expect(result?.type).toBe('span');
      if (result?.type === 'span') {
        expect(result.start.getTime()).toBeLessThanOrEqual(result.end.getTime());
      }
    });

    it('should have duration = end - start for span type', () => {
      const result = parse('jan 5 to jan 20', { referenceDate });
      if (result?.type === 'span') {
        expect(result.duration).toBe(result.end.getTime() - result.start.getTime());
      }
    });

    it('should have title as string or null', () => {
      const r1 = parse('tomorrow', { referenceDate });
      const r2 = parse('Meeting - tomorrow', { referenceDate });

      expect(r1?.title).toBeNull();
      if (r2 !== null) {
        expect(typeof r2.title === 'string' || r2.title === null).toBe(true);
      }
    });

    it('should have approximate = true for fuzzy type', () => {
      const result = parse('Q1', { referenceDate });
      expect(result?.type).toBe('fuzzy');
      if (result?.type === 'fuzzy') {
        expect(result.approximate).toBe(true);
      }
    });
  });
});

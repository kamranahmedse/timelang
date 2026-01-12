import { describe, it, expect } from 'vitest';
import { parse, SpanResult } from '../src';

// Fixed reference date for deterministic tests: Wednesday, January 15, 2025
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

// Helper to create expected dates in UTC
function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

// Helper to check if result is a span type (ranges produce spans)
function expectRange(
  input: string,
  expectedStart: Date,
  expectedEnd: Date,
  options = { referenceDate }
) {
  const result = parse(input, options) as SpanResult;
  expect(result.type).toBe('span');
  expect(result.start.toISOString()).toBe(expectedStart.toISOString());
  expect(result.end.toISOString()).toBe(expectedEnd.toISOString());
  const expectedDuration = expectedEnd.getTime() - expectedStart.getTime();
  expect(result.duration).toBe(expectedDuration);
  expect(result.title).toBeNull();
}

describe('Range Parsing', () => {
  describe('Basic "to" patterns', () => {
    it('should parse "jan 5 to jan 20"', () => {
      expectRange('jan 5 to jan 20', utc(2025, 1, 5), utc(2025, 1, 20));
    });

    it('should parse "january 5 to january 20"', () => {
      expectRange('january 5 to january 20', utc(2025, 1, 5), utc(2025, 1, 20));
    });

    it('should parse "january 5th to january 20th"', () => {
      expectRange('january 5th to january 20th', utc(2025, 1, 5), utc(2025, 1, 20));
    });

    it('should parse "5th january to 20th january"', () => {
      expectRange('5th january to 20th january', utc(2025, 1, 5), utc(2025, 1, 20));
    });

    it('should parse "monday to friday"', () => {
      const result = parse('monday to friday', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 20).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 17).toISOString());
    });

    it('should parse "march to june"', () => {
      expectRange('march to june', utc(2025, 3, 1), utc(2025, 6, 30));
    });

    it('should parse "2024 to 2025"', () => {
      expectRange('2024 to 2025', utc(2024, 1, 1), utc(2025, 12, 31));
    });

    it('should parse "Q1 to Q3"', () => {
      expectRange('Q1 to Q3', utc(2025, 1, 1), utc(2025, 9, 30));
    });
  });

  describe('"from-to" patterns', () => {
    it('should parse "from march 1 to march 15"', () => {
      expectRange('from march 1 to march 15', utc(2025, 3, 1), utc(2025, 3, 15));
    });

    it('should parse "from january to june"', () => {
      expectRange('from january to june', utc(2025, 1, 1), utc(2025, 6, 30));
    });

    it('should parse "from monday to friday"', () => {
      const result = parse('from monday to friday', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 20).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 17).toISOString());
    });

    it('should parse "from jan 5 to jan 20"', () => {
      expectRange('from jan 5 to jan 20', utc(2025, 1, 5), utc(2025, 1, 20));
    });

    it('should parse "from Q1 to Q2"', () => {
      expectRange('from Q1 to Q2', utc(2025, 1, 1), utc(2025, 6, 30));
    });
  });

  describe('Dash/hyphen separators', () => {
    it('should parse "january 1 - january 15"', () => {
      expectRange('january 1 - january 15', utc(2025, 1, 1), utc(2025, 1, 15));
    });

    it('should parse "jan 1 - jan 15"', () => {
      expectRange('jan 1 - jan 15', utc(2025, 1, 1), utc(2025, 1, 15));
    });

    it('should parse "march 1 – march 15" (en dash)', () => {
      expectRange('march 1 – march 15', utc(2025, 3, 1), utc(2025, 3, 15));
    });

    it('should parse "march 1 — march 15" (em dash)', () => {
      expectRange('march 1 — march 15', utc(2025, 3, 1), utc(2025, 3, 15));
    });

    it('should parse "July10-July15" (no spaces)', () => {
      expectRange('July10-July15', utc(2025, 7, 10), utc(2025, 7, 15));
    });

    it('should parse "July10 - July 15" (mixed spaces)', () => {
      expectRange('July10 - July 15', utc(2025, 7, 10), utc(2025, 7, 15));
    });

    it('should parse "July 10-15" (same month shorthand)', () => {
      expectRange('July 10-15', utc(2025, 7, 10), utc(2025, 7, 15));
    });

    it('should parse "10-15 July" (same month shorthand, reversed)', () => {
      expectRange('10-15 July', utc(2025, 7, 10), utc(2025, 7, 15));
    });
  });

  describe('"between" patterns', () => {
    it('should parse "between feb 1 and feb 14"', () => {
      expectRange('between feb 1 and feb 14', utc(2025, 2, 1), utc(2025, 2, 14));
    });

    it('should parse "between january and march"', () => {
      expectRange('between january and march', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "between monday and friday"', () => {
      const result = parse('between monday and friday', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 20).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 17).toISOString());
    });

    it('should parse "between Q1 and Q3"', () => {
      expectRange('between Q1 and Q3', utc(2025, 1, 1), utc(2025, 9, 30));
    });
  });

  describe('"through" patterns', () => {
    it('should parse "january 1 through january 15"', () => {
      expectRange('january 1 through january 15', utc(2025, 1, 1), utc(2025, 1, 15));
    });

    it('should parse "monday through friday"', () => {
      const result = parse('monday through friday', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 20).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 17).toISOString());
    });

    it('should parse "jan through mar"', () => {
      expectRange('jan through mar', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "march 10 through march 20"', () => {
      expectRange('march 10 through march 20', utc(2025, 3, 10), utc(2025, 3, 20));
    });
  });

  describe('"until/til/till" patterns', () => {
    it('should parse "january 1 until january 15"', () => {
      expectRange('january 1 until january 15', utc(2025, 1, 1), utc(2025, 1, 15));
    });

    it('should parse "from january 1 until january 15"', () => {
      expectRange('from january 1 until january 15', utc(2025, 1, 1), utc(2025, 1, 15));
    });

    it('should parse "monday til friday"', () => {
      const result = parse('monday til friday', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 20).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 17).toISOString());
    });

    it('should parse "january till march"', () => {
      expectRange('january till march', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "from now until march"', () => {
      const result = parse('from now until march', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.getTime()).toBeLessThanOrEqual(referenceDate.getTime() + 86400000);
    });

    it('should parse "until friday"', () => {
      const result = parse('until friday', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.end.toISOString()).toBe(utc(2025, 1, 17).toISOString());
    });

    it('should parse "til end of month"', () => {
      const result = parse('til end of month', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.end.toISOString()).toBe(utc(2025, 1, 31).toISOString());
    });
  });

  describe('Cross-month ranges', () => {
    it('should parse "january 25 to february 5"', () => {
      expectRange('january 25 to february 5', utc(2025, 1, 25), utc(2025, 2, 5));
    });

    it('should parse "december 20 to january 5"', () => {
      expectRange('december 20 to january 5', utc(2025, 12, 20), utc(2026, 1, 5));
    });

    it('should parse "november 15, 2024 to february 10, 2025"', () => {
      expectRange('november 15, 2024 to february 10, 2025', utc(2024, 11, 15), utc(2025, 2, 10));
    });

    it('should parse "march 20 to april 10"', () => {
      expectRange('march 20 to april 10', utc(2025, 3, 20), utc(2025, 4, 10));
    });
  });

  describe('Cross-year ranges', () => {
    it('should parse "december 2024 to january 2025"', () => {
      expectRange('december 2024 to january 2025', utc(2024, 12, 1), utc(2025, 1, 31));
    });

    it('should parse "2024 to 2026"', () => {
      expectRange('2024 to 2026', utc(2024, 1, 1), utc(2026, 12, 31));
    });

    it('should parse "Q4 2024 to Q1 2025"', () => {
      expectRange('Q4 2024 to Q1 2025', utc(2024, 10, 1), utc(2025, 3, 31));
    });

    it('should parse "november 2024 to march 2025"', () => {
      expectRange('november 2024 to march 2025', utc(2024, 11, 1), utc(2025, 3, 31));
    });
  });

  describe('Same day with times', () => {
    it('should parse "9am to 5pm"', () => {
      const result = parse('9am to 5pm', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.getUTCHours()).toBe(9);
      expect(result.end.getUTCHours()).toBe(17);
    });

    it('should parse "monday 9am to monday 5pm"', () => {
      const result = parse('monday 9am to monday 5pm', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.getUTCHours()).toBe(9);
      expect(result.end.getUTCHours()).toBe(17);
    });

    it('should parse "tomorrow 10am to 6pm"', () => {
      const result = parse('tomorrow 10am to 6pm', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 16, 10, 0).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 16, 18, 0).toISOString());
    });

    it('should parse "march 15th 9am to 5pm"', () => {
      const result = parse('march 15th 9am to 5pm', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 3, 15, 9, 0).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 3, 15, 17, 0).toISOString());
    });

    it('should parse "jan 20 8:00 to 17:00"', () => {
      const result = parse('jan 20 8:00 to 17:00', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 20, 8, 0).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 20, 17, 0).toISOString());
    });
  });

  describe('Edge cases', () => {
    it('should parse same day range "jan 5 to jan 5"', () => {
      const result = parse('jan 5 to jan 5', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(result.end.toISOString());
      expect(result.duration).toBe(0);
    });

    it('should handle reversed range "jan 20 to jan 5"', () => {
      const result = parse('jan 20 to jan 5', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.toISOString()).toBe(utc(2025, 1, 20).toISOString());
      expect(result.end.toISOString()).toBe(utc(2025, 1, 5).toISOString());
    });

    it('should parse very long range "2000 to 2100"', () => {
      const result = parse('2000 to 2100', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.start.getUTCFullYear()).toBe(2000);
      expect(result.end.getUTCFullYear()).toBe(2100);
    });
  });
});

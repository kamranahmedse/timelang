import { describe, it, expect } from 'vitest';
import { parse, FuzzyResult, DateResult, SpanResult } from '../src/index';

// Fixed reference date for deterministic tests
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function expectFuzzy(
  input: string,
  expectedStart: Date,
  expectedEnd: Date,
  options = { referenceDate }
) {
  const result = parse(input, options) as FuzzyResult;
  expect(result.type).toBe('fuzzy');
  expect(result.start.toISOString()).toBe(expectedStart.toISOString());
  expect(result.end.toISOString()).toBe(expectedEnd.toISOString());
  expect(result.approximate).toBe(true);
  expect(result.title).toBeNull();
}

function expectFuzzyType(input: string, options = { referenceDate }) {
  const result = parse(input, options) as FuzzyResult;
  expect(result.type).toBe('fuzzy');
  expect(result.approximate).toBe(true);
  expect(result.title).toBeNull();
  expect(result.start.getTime()).toBeLessThanOrEqual(result.end.getTime());
}

function expectBoundaryDate(
  input: string,
  expectedDate: Date,
  options = { referenceDate }
) {
  const result = parse(input, options) as DateResult;
  expect(result.type).toBe('date');
  expect(result.date.toISOString()).toBe(expectedDate.toISOString());
  expect(result.title).toBeNull();
}

describe('Fuzzy Period Parsing', () => {
  describe('Quarters (basic)', () => {
    it('should parse "Q1"', () => {
      expectFuzzy('Q1', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "Q2"', () => {
      expectFuzzy('Q2', utc(2025, 4, 1), utc(2025, 6, 30));
    });

    it('should parse "Q3"', () => {
      expectFuzzy('Q3', utc(2025, 7, 1), utc(2025, 9, 30));
    });

    it('should parse "Q4"', () => {
      expectFuzzy('Q4', utc(2025, 10, 1), utc(2025, 12, 31));
    });

    it('should parse "q1" (lowercase)', () => {
      expectFuzzy('q1', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "q2" (lowercase)', () => {
      expectFuzzy('q2', utc(2025, 4, 1), utc(2025, 6, 30));
    });

    it('should parse "q3" (lowercase)', () => {
      expectFuzzy('q3', utc(2025, 7, 1), utc(2025, 9, 30));
    });

    it('should parse "q4" (lowercase)', () => {
      expectFuzzy('q4', utc(2025, 10, 1), utc(2025, 12, 31));
    });

    it('should parse "first quarter"', () => {
      expectFuzzy('first quarter', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "second quarter"', () => {
      expectFuzzy('second quarter', utc(2025, 4, 1), utc(2025, 6, 30));
    });

    it('should parse "third quarter"', () => {
      expectFuzzy('third quarter', utc(2025, 7, 1), utc(2025, 9, 30));
    });

    it('should parse "fourth quarter"', () => {
      expectFuzzy('fourth quarter', utc(2025, 10, 1), utc(2025, 12, 31));
    });

    it('should parse "1st quarter"', () => {
      expectFuzzy('1st quarter', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "2nd quarter"', () => {
      expectFuzzy('2nd quarter', utc(2025, 4, 1), utc(2025, 6, 30));
    });

    it('should parse "3rd quarter"', () => {
      expectFuzzy('3rd quarter', utc(2025, 7, 1), utc(2025, 9, 30));
    });

    it('should parse "4th quarter"', () => {
      expectFuzzy('4th quarter', utc(2025, 10, 1), utc(2025, 12, 31));
    });
  });

  describe('Quarters with year', () => {
    it('should parse "Q1 2025"', () => {
      expectFuzzy('Q1 2025', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "Q2 2025"', () => {
      expectFuzzy('Q2 2025', utc(2025, 4, 1), utc(2025, 6, 30));
    });

    it('should parse "Q3 2025"', () => {
      expectFuzzy('Q3 2025', utc(2025, 7, 1), utc(2025, 9, 30));
    });

    it('should parse "Q4 2025"', () => {
      expectFuzzy('Q4 2025', utc(2025, 10, 1), utc(2025, 12, 31));
    });

    it('should parse "Q1 of 2025"', () => {
      expectFuzzy('Q1 of 2025', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "first quarter 2025"', () => {
      expectFuzzy('first quarter 2025', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "first quarter of 2025"', () => {
      expectFuzzy('first quarter of 2025', utc(2025, 1, 1), utc(2025, 3, 31));
    });

    it('should parse "Q1 2024" (past year)', () => {
      expectFuzzy('Q1 2024', utc(2024, 1, 1), utc(2024, 3, 31));
    });
  });

  describe('Quarters with modifiers', () => {
    it('should parse "early Q1"', () => {
      expectFuzzyType('early Q1');
    });

    it('should parse "mid Q1"', () => {
      expectFuzzyType('mid Q1');
    });

    it('should parse "late Q1"', () => {
      expectFuzzyType('late Q1');
    });

    it('should parse "early Q2"', () => {
      expectFuzzyType('early Q2');
    });

    it('should parse "mid Q2"', () => {
      expectFuzzyType('mid Q2');
    });

    it('should parse "late Q2"', () => {
      expectFuzzyType('late Q2');
    });

    it('should parse "early Q3"', () => {
      expectFuzzyType('early Q3');
    });

    it('should parse "mid Q3"', () => {
      expectFuzzyType('mid Q3');
    });

    it('should parse "late Q3"', () => {
      expectFuzzyType('late Q3');
    });

    it('should parse "early Q4"', () => {
      expectFuzzyType('early Q4');
    });

    it('should parse "mid Q4"', () => {
      expectFuzzyType('mid Q4');
    });

    it('should parse "late Q4"', () => {
      expectFuzzyType('late Q4');
    });

    it('should parse "beginning of Q1"', () => {
      expectBoundaryDate('beginning of Q1', utc(2025, 1, 1));
    });

    it('should parse "middle of Q1"', () => {
      expectFuzzyType('middle of Q1');
    });

    it('should parse "end of Q1"', () => {
      expectBoundaryDate('end of Q1', utc(2025, 3, 31));
    });

    it('should parse "start of Q2"', () => {
      expectBoundaryDate('start of Q2', utc(2025, 4, 1));
    });
  });

  describe('Years with modifiers', () => {
    it('should parse "early 2025"', () => {
      expectFuzzyType('early 2025');
    });

    it('should parse "mid 2025"', () => {
      expectFuzzyType('mid 2025');
    });

    it('should parse "late 2025"', () => {
      expectFuzzyType('late 2025');
    });

    it('should parse "early next year"', () => {
      expectFuzzyType('early next year');
    });

    it('should parse "mid next year"', () => {
      expectFuzzyType('mid next year');
    });

    it('should parse "late next year"', () => {
      expectFuzzyType('late next year');
    });

    it('should parse "beginning of 2025"', () => {
      expectBoundaryDate('beginning of 2025', utc(2025, 1, 1));
    });

    it('should parse "middle of 2025"', () => {
      expectFuzzyType('middle of 2025');
    });

    it('should parse "end of 2025"', () => {
      expectBoundaryDate('end of 2025', utc(2025, 12, 31));
    });

    it('should parse "start of 2025"', () => {
      expectBoundaryDate('start of 2025', utc(2025, 1, 1));
    });

    it('should parse "first half of 2025"', () => {
      expectFuzzy('first half of 2025', utc(2025, 1, 1), utc(2025, 6, 30));
    });

    it('should parse "second half of 2025"', () => {
      expectFuzzy('second half of 2025', utc(2025, 7, 1), utc(2025, 12, 31));
    });

    it('should parse "H1 2025"', () => {
      expectFuzzy('H1 2025', utc(2025, 1, 1), utc(2025, 6, 30));
    });

    it('should parse "H2 2025"', () => {
      expectFuzzy('H2 2025', utc(2025, 7, 1), utc(2025, 12, 31));
    });
  });

  describe('Months with modifiers', () => {
    it('should parse "early january"', () => {
      expectFuzzyType('early january');
    });

    it('should parse "mid january"', () => {
      expectFuzzyType('mid january');
    });

    it('should parse "late january"', () => {
      expectFuzzyType('late january');
    });

    it('should parse "early february"', () => {
      expectFuzzyType('early february');
    });

    it('should parse "mid february"', () => {
      expectFuzzyType('mid february');
    });

    it('should parse "late february"', () => {
      expectFuzzyType('late february');
    });

    it('should parse "beginning of march"', () => {
      expectBoundaryDate('beginning of march', utc(2025, 3, 1));
    });

    it('should parse "middle of march"', () => {
      expectFuzzyType('middle of march');
    });

    it('should parse "end of march"', () => {
      expectBoundaryDate('end of march', utc(2025, 3, 31));
    });

    it('should parse "start of april"', () => {
      expectBoundaryDate('start of april', utc(2025, 4, 1));
    });

    it('should parse "first week of january"', () => {
      expectFuzzyType('first week of january');
    });

    it('should parse "last week of january"', () => {
      expectFuzzyType('last week of january');
    });

    it('should parse "second week of march"', () => {
      expectFuzzyType('second week of march');
    });

    it('should parse "third week of march"', () => {
      expectFuzzyType('third week of march');
    });
  });

  describe('Weeks with modifiers', () => {
    it('should parse "early next week"', () => {
      expectFuzzyType('early next week');
    });

    it('should parse "mid next week"', () => {
      expectFuzzyType('mid next week');
    });

    it('should parse "late next week"', () => {
      expectFuzzyType('late next week');
    });

    it('should parse "beginning of the week"', () => {
      // Reference date is Jan 15, 2025 (Wednesday), week starts Sunday = Jan 12
      expectBoundaryDate('beginning of the week', utc(2025, 1, 12));
    });

    it('should parse "middle of the week"', () => {
      expectFuzzyType('middle of the week');
    });

    it('should parse "end of the week"', () => {
      // Reference date is Jan 15, 2025 (Wednesday), week ends Saturday = Jan 18
      expectBoundaryDate('end of the week', utc(2025, 1, 18));
    });

    it('should parse "early this week"', () => {
      expectFuzzyType('early this week');
    });

    it('should parse "late this week"', () => {
      expectFuzzyType('late this week');
    });
  });

  describe('Vague expressions', () => {
    it('should parse "sometime in Q1"', () => {
      expectFuzzyType('sometime in Q1');
    });

    it('should parse "sometime in january"', () => {
      expectFuzzyType('sometime in january');
    });

    it('should parse "sometime next week"', () => {
      expectFuzzyType('sometime next week');
    });

    it('should parse "around mid january"', () => {
      expectFuzzyType('around mid january');
    });

    it('should parse "around Q2"', () => {
      expectFuzzyType('around Q2');
    });

    it('should parse "roughly mid year"', () => {
      expectFuzzyType('roughly mid year');
    });

    it('should parse "approximately early march"', () => {
      expectFuzzyType('approximately early march');
    });

    it('should parse "about mid Q3"', () => {
      expectFuzzyType('about mid Q3');
    });
  });

  describe('Seasons', () => {
    it('should parse "spring"', () => {
      expectFuzzyType('spring');
    });

    it('should parse "summer"', () => {
      expectFuzzyType('summer');
    });

    it('should parse "fall"', () => {
      expectFuzzyType('fall');
    });

    it('should parse "autumn"', () => {
      expectFuzzyType('autumn');
    });

    it('should parse "winter"', () => {
      expectFuzzyType('winter');
    });

    it('should parse "spring 2025"', () => {
      expectFuzzyType('spring 2025');
    });

    it('should parse "summer 2025"', () => {
      expectFuzzyType('summer 2025');
    });

    it('should parse "fall 2025"', () => {
      expectFuzzyType('fall 2025');
    });

    it('should parse "winter 2025"', () => {
      expectFuzzyType('winter 2025');
    });

    it('should parse "early spring"', () => {
      expectFuzzyType('early spring');
    });

    it('should parse "mid summer"', () => {
      expectFuzzyType('mid summer');
    });

    it('should parse "late fall"', () => {
      expectFuzzyType('late fall');
    });

    it('should parse "next spring"', () => {
      expectFuzzyType('next spring');
    });

    it('should parse "last summer"', () => {
      expectFuzzyType('last summer');
    });

    it('should parse "this winter"', () => {
      expectFuzzyType('this winter');
    });
  });

  describe('Duration within fuzzy period', () => {
    it('should parse "50 days in mid Q1"', () => {
      const result = parse('50 days in mid Q1', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(50 * MS_PER_DAY);
    });

    it('should parse "2 weeks in early Q2"', () => {
      const result = parse('2 weeks in early Q2', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(2 * MS_PER_WEEK);
    });

    it('should parse "10 days in late Q3"', () => {
      const result = parse('10 days in late Q3', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(10 * MS_PER_DAY);
    });

    it('should parse "1 month in Q4"', () => {
      const result = parse('1 month in Q4', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(30 * MS_PER_DAY);
    });

    it('should parse "2 weeks in early march"', () => {
      const result = parse('2 weeks in early march', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(2 * MS_PER_WEEK);
    });

    it('should parse "10 days in mid january"', () => {
      const result = parse('10 days in mid january', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(10 * MS_PER_DAY);
    });

    it('should parse "3 months in early 2025"', () => {
      const result = parse('3 months in early 2025', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(90 * MS_PER_DAY);
    });

    it('should parse "6 months in the first half of 2025"', () => {
      const result = parse('6 months in the first half of 2025', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(180 * MS_PER_DAY);
    });

    it('should parse "2 weeks in early spring"', () => {
      const result = parse('2 weeks in early spring', { referenceDate }) as SpanResult;
      expect(result.type).toBe('span');
      expect(result.duration).toBe(2 * MS_PER_WEEK);
    });
  });

  describe('Fiscal year options', () => {
    it('should parse "Q1" with fiscal year starting in april', () => {
      const result = parse('Q1', { referenceDate, fiscalYearStart: 'april' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(3); // April (0-indexed)
      expect(result.end.getUTCMonth()).toBe(5); // June
    });

    it('should parse "Q1" with fiscal year starting in july', () => {
      const result = parse('Q1', { referenceDate, fiscalYearStart: 'july' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(6); // July
      expect(result.end.getUTCMonth()).toBe(8); // September
    });

    it('should parse "Q1" with fiscal year starting in october', () => {
      const result = parse('Q1', { referenceDate, fiscalYearStart: 'october' }) as FuzzyResult;
      expect(result.type).toBe('fuzzy');
      expect(result.start.getUTCMonth()).toBe(9); // October
      expect(result.end.getUTCMonth()).toBe(11); // December
    });
  });
});

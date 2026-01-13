import { describe, it, expect } from 'vitest';
import { parse, parseDate, DateResult } from '../src/index';

// Fixed reference date for deterministic tests
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

function expectDate(input: string, expectedDate: Date, options = { referenceDate }) {
  const result = parse(input, options) as DateResult;
  expect(result.type).toBe('date');
  expect(result.date.toISOString()).toBe(expectedDate.toISOString());
  expect(result.title).toBeNull();
}

function expectParseDate(input: string, expectedDate: Date, options = { referenceDate }) {
  const result = parseDate(input, options);
  expect(result).not.toBeNull();
  expect(result?.toISOString()).toBe(expectedDate.toISOString());
}

describe('Single Date Parsing', () => {
  describe('Relative days', () => {
    it('should parse "today"', () => {
      expectDate('today', utc(2025, 1, 15));
    });

    it('should parse "tomorrow"', () => {
      expectDate('tomorrow', utc(2025, 1, 16));
    });

    it('should parse "yesterday"', () => {
      expectDate('yesterday', utc(2025, 1, 14));
    });

    it('should parse "day after tomorrow"', () => {
      expectDate('day after tomorrow', utc(2025, 1, 17));
    });

    it('should parse "day before yesterday"', () => {
      expectDate('day before yesterday', utc(2025, 1, 13));
    });
  });

  describe('Bare weekdays (next occurrence)', () => {
    // Reference: Wednesday, January 15, 2025
    // monday=1, tuesday=2, wednesday=3, thursday=4, friday=5, saturday=6, sunday=0

    it('should parse "monday" as next Monday', () => {
      expectDate('monday', utc(2025, 1, 20)); // Next Monday is Jan 20
    });

    it('should parse "tuesday" as next Tuesday', () => {
      expectDate('tuesday', utc(2025, 1, 21));
    });

    it('should parse "wednesday" as next Wednesday', () => {
      expectDate('wednesday', utc(2025, 1, 22)); // Not today, next week
    });

    it('should parse "thursday" as next Thursday', () => {
      expectDate('thursday', utc(2025, 1, 16));
    });

    it('should parse "friday" as next Friday', () => {
      expectDate('friday', utc(2025, 1, 17));
    });

    it('should parse "saturday" as next Saturday', () => {
      expectDate('saturday', utc(2025, 1, 18));
    });

    it('should parse "sunday" as next Sunday', () => {
      expectDate('sunday', utc(2025, 1, 19));
    });
  });

  describe('Next weekdays', () => {
    it('should parse "next monday"', () => {
      expectDate('next monday', utc(2025, 1, 20));
    });

    it('should parse "next tuesday"', () => {
      expectDate('next tuesday', utc(2025, 1, 21));
    });

    it('should parse "next wednesday"', () => {
      expectDate('next wednesday', utc(2025, 1, 22));
    });

    it('should parse "next thursday"', () => {
      expectDate('next thursday', utc(2025, 1, 16));
    });

    it('should parse "next friday"', () => {
      expectDate('next friday', utc(2025, 1, 17));
    });

    it('should parse "next saturday"', () => {
      expectDate('next saturday', utc(2025, 1, 18));
    });

    it('should parse "next sunday"', () => {
      expectDate('next sunday', utc(2025, 1, 19));
    });
  });

  describe('Last weekdays', () => {
    it('should parse "last monday"', () => {
      expectDate('last monday', utc(2025, 1, 13));
    });

    it('should parse "last tuesday"', () => {
      expectDate('last tuesday', utc(2025, 1, 14));
    });

    it('should parse "last wednesday"', () => {
      expectDate('last wednesday', utc(2025, 1, 8));
    });

    it('should parse "last thursday"', () => {
      expectDate('last thursday', utc(2025, 1, 9));
    });

    it('should parse "last friday"', () => {
      expectDate('last friday', utc(2025, 1, 10));
    });

    it('should parse "last saturday"', () => {
      expectDate('last saturday', utc(2025, 1, 11));
    });

    it('should parse "last sunday"', () => {
      expectDate('last sunday', utc(2025, 1, 12));
    });
  });

  describe('This/Coming/Previous weekdays', () => {
    it('should parse "this monday"', () => {
      expectDate('this monday', utc(2025, 1, 13)); // This week's Monday (past)
    });

    it('should parse "this friday"', () => {
      expectDate('this friday', utc(2025, 1, 17)); // This week's Friday (future)
    });

    it('should parse "coming monday"', () => {
      expectDate('coming monday', utc(2025, 1, 20));
    });

    it('should parse "coming friday"', () => {
      expectDate('coming friday', utc(2025, 1, 17));
    });

    it('should parse "previous monday"', () => {
      expectDate('previous monday', utc(2025, 1, 13));
    });

    it('should parse "previous friday"', () => {
      expectDate('previous friday', utc(2025, 1, 10));
    });
  });

  describe('Month + Day combinations', () => {
    it('should parse "march 15th"', () => {
      expectDate('march 15th', utc(2025, 3, 15));
    });

    it('should parse "march 15"', () => {
      expectDate('march 15', utc(2025, 3, 15));
    });

    it('should parse "15th march"', () => {
      expectDate('15th march', utc(2025, 3, 15));
    });

    it('should parse "15 march"', () => {
      expectDate('15 march', utc(2025, 3, 15));
    });

    it('should parse "march fifteenth"', () => {
      expectDate('march fifteenth', utc(2025, 3, 15));
    });

    it('should parse "the 15th of march"', () => {
      expectDate('the 15th of march', utc(2025, 3, 15));
    });

    it('should parse "15th of march"', () => {
      expectDate('15th of march', utc(2025, 3, 15));
    });

    it('should parse "march the 15th"', () => {
      expectDate('march the 15th', utc(2025, 3, 15));
    });
  });

  describe('Ordinals (1st through 31st)', () => {
    it('should parse "january 1st"', () => {
      expectDate('january 1st', utc(2025, 1, 1));
    });

    it('should parse "january 2nd"', () => {
      expectDate('january 2nd', utc(2025, 1, 2));
    });

    it('should parse "january 3rd"', () => {
      expectDate('january 3rd', utc(2025, 1, 3));
    });

    it('should parse "january 4th"', () => {
      expectDate('january 4th', utc(2025, 1, 4));
    });

    it('should parse "january 21st"', () => {
      expectDate('january 21st', utc(2025, 1, 21));
    });

    it('should parse "january 22nd"', () => {
      expectDate('january 22nd', utc(2025, 1, 22));
    });

    it('should parse "january 23rd"', () => {
      expectDate('january 23rd', utc(2025, 1, 23));
    });

    it('should parse "january 24th"', () => {
      expectDate('january 24th', utc(2025, 1, 24));
    });

    it('should parse "january 31st"', () => {
      expectDate('january 31st', utc(2025, 1, 31));
    });
  });

  describe('All month names (full)', () => {
    it('should parse "january 1"', () => {
      expectDate('january 1', utc(2025, 1, 1));
    });

    it('should parse "february 1"', () => {
      expectDate('february 1', utc(2025, 2, 1));
    });

    it('should parse "march 1"', () => {
      expectDate('march 1', utc(2025, 3, 1));
    });

    it('should parse "april 1"', () => {
      expectDate('april 1', utc(2025, 4, 1));
    });

    it('should parse "may 1"', () => {
      expectDate('may 1', utc(2025, 5, 1));
    });

    it('should parse "june 1"', () => {
      expectDate('june 1', utc(2025, 6, 1));
    });

    it('should parse "july 1"', () => {
      expectDate('july 1', utc(2025, 7, 1));
    });

    it('should parse "august 1"', () => {
      expectDate('august 1', utc(2025, 8, 1));
    });

    it('should parse "september 1"', () => {
      expectDate('september 1', utc(2025, 9, 1));
    });

    it('should parse "october 1"', () => {
      expectDate('october 1', utc(2025, 10, 1));
    });

    it('should parse "november 1"', () => {
      expectDate('november 1', utc(2025, 11, 1));
    });

    it('should parse "december 1"', () => {
      expectDate('december 1', utc(2025, 12, 1));
    });
  });

  describe('All month names (abbreviated)', () => {
    it('should parse "jan 1"', () => {
      expectDate('jan 1', utc(2025, 1, 1));
    });

    it('should parse "feb 1"', () => {
      expectDate('feb 1', utc(2025, 2, 1));
    });

    it('should parse "mar 1"', () => {
      expectDate('mar 1', utc(2025, 3, 1));
    });

    it('should parse "apr 1"', () => {
      expectDate('apr 1', utc(2025, 4, 1));
    });

    it('should parse "may 1" (same as full)', () => {
      expectDate('may 1', utc(2025, 5, 1));
    });

    it('should parse "jun 1"', () => {
      expectDate('jun 1', utc(2025, 6, 1));
    });

    it('should parse "jul 1"', () => {
      expectDate('jul 1', utc(2025, 7, 1));
    });

    it('should parse "aug 1"', () => {
      expectDate('aug 1', utc(2025, 8, 1));
    });

    it('should parse "sep 1"', () => {
      expectDate('sep 1', utc(2025, 9, 1));
    });

    it('should parse "sept 1"', () => {
      expectDate('sept 1', utc(2025, 9, 1));
    });

    it('should parse "oct 1"', () => {
      expectDate('oct 1', utc(2025, 10, 1));
    });

    it('should parse "nov 1"', () => {
      expectDate('nov 1', utc(2025, 11, 1));
    });

    it('should parse "dec 1"', () => {
      expectDate('dec 1', utc(2025, 12, 1));
    });
  });

  describe('Month + Day + Year', () => {
    it('should parse "march 15th 2025"', () => {
      expectDate('march 15th 2025', utc(2025, 3, 15));
    });

    it('should parse "march 15, 2025"', () => {
      expectDate('march 15, 2025', utc(2025, 3, 15));
    });

    it('should parse "15th march 2025"', () => {
      expectDate('15th march 2025', utc(2025, 3, 15));
    });

    it('should parse "march 15th, 2025"', () => {
      expectDate('march 15th, 2025', utc(2025, 3, 15));
    });

    it('should parse "15/03/2025" (intl format)', () => {
      expectDate('15/03/2025', utc(2025, 3, 15), { referenceDate, dateFormat: 'intl' });
    });

    it('should parse "03/15/2025" (us format)', () => {
      expectDate('03/15/2025', utc(2025, 3, 15), { referenceDate, dateFormat: 'us' });
    });

    it('should parse "2025-03-15" (ISO format)', () => {
      expectDate('2025-03-15', utc(2025, 3, 15));
    });

    it('should parse "2025/03/15"', () => {
      expectDate('2025/03/15', utc(2025, 3, 15));
    });
  });

  describe('Relative weeks/months/years', () => {
    it('should parse "next week"', () => {
      expectDate('next week', utc(2025, 1, 19));
    });

    it('should parse "last week"', () => {
      expectDate('last week', utc(2025, 1, 5));
    });

    it('should parse "this week"', () => {
      expectDate('this week', utc(2025, 1, 12));
    });

    it('should parse "next month"', () => {
      expectDate('next month', utc(2025, 2, 1));
    });

    it('should parse "last month"', () => {
      expectDate('last month', utc(2024, 12, 1));
    });

    it('should parse "this month"', () => {
      expectDate('this month', utc(2025, 1, 1));
    });

    it('should parse "next year"', () => {
      expectDate('next year', utc(2026, 1, 1));
    });

    it('should parse "last year"', () => {
      expectDate('last year', utc(2024, 1, 1));
    });

    it('should parse "this year"', () => {
      expectDate('this year', utc(2025, 1, 1));
    });
  });

  describe('Period boundaries', () => {
    it('should parse "end of month"', () => {
      expectDate('end of month', utc(2025, 1, 31));
    });

    it('should parse "beginning of month"', () => {
      expectDate('beginning of month', utc(2025, 1, 1));
    });

    it('should parse "start of month"', () => {
      expectDate('start of month', utc(2025, 1, 1));
    });

    it('should parse "end of year"', () => {
      expectDate('end of year', utc(2025, 12, 31));
    });

    it('should parse "beginning of year"', () => {
      expectDate('beginning of year', utc(2025, 1, 1));
    });

    it('should parse "start of year"', () => {
      expectDate('start of year', utc(2025, 1, 1));
    });

    it('should parse "end of week"', () => {
      expectDate('end of week', utc(2025, 1, 18));
    });

    it('should parse "beginning of week"', () => {
      expectDate('beginning of week', utc(2025, 1, 12));
    });

    it('should parse "start of week"', () => {
      expectDate('start of week', utc(2025, 1, 12));
    });

    it('should parse "end of january"', () => {
      expectDate('end of january', utc(2025, 1, 31));
    });

    it('should parse "beginning of january"', () => {
      expectDate('beginning of january', utc(2025, 1, 1));
    });

    it('should parse "start of Q1"', () => {
      expectDate('start of Q1', utc(2025, 1, 1));
    });

    it('should parse "end of Q1"', () => {
      expectDate('end of Q1', utc(2025, 3, 31));
    });
  });

  describe('Dates with times', () => {
    it('should parse "tomorrow at 3pm"', () => {
      expectDate('tomorrow at 3pm', utc(2025, 1, 16, 15, 0));
    });

    it('should parse "next monday at 9am"', () => {
      expectDate('next monday at 9am', utc(2025, 1, 20, 9, 0));
    });

    it('should parse "march 15th at 14:00"', () => {
      expectDate('march 15th at 14:00', utc(2025, 3, 15, 14, 0));
    });

    it('should parse "friday at noon"', () => {
      expectDate('friday at noon', utc(2025, 1, 17, 12, 0));
    });

    it('should parse "saturday at midnight"', () => {
      expectDate('saturday at midnight', utc(2025, 1, 18, 0, 0));
    });

    it('should parse "next week monday 10am"', () => {
      expectDate('next week monday 10am', utc(2025, 1, 20, 10, 0));
    });
  });

  describe('parseDate helper function', () => {
    it('should return Date directly for valid date input', () => {
      expectParseDate('tomorrow', utc(2025, 1, 16));
    });

    it('should convert duration to date relative to reference', () => {
      const result = parseDate('2 weeks', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.toISOString()).toBe(utc(2025, 1, 29, 12, 0).toISOString());
    });

    it('should convert "3 days" to date relative to reference', () => {
      const result = parseDate('3 days', { referenceDate });
      expect(result).not.toBeNull();
      expect(result?.toISOString()).toBe(utc(2025, 1, 18, 12, 0).toISOString());
    });

    it('should return null for invalid input', () => {
      const result = parseDate('not a date', { referenceDate });
      expect(result).toBeNull();
    });
  });

  describe('Year rollover behavior', () => {
    // Reference date in December
    const decemberRef = new Date('2025-12-15T12:00:00.000Z');

    it('should parse "january" in December as next January', () => {
      expectDate('january 1', utc(2026, 1, 1), { referenceDate: decemberRef });
    });

    it('should parse "february" in December as next February', () => {
      expectDate('february 1', utc(2026, 2, 1), { referenceDate: decemberRef });
    });
  });

  describe('Month that has passed in current year', () => {
    // Reference is January, so months before should go to next occurrence
    // Actually wait - January IS the reference, so a past month would be next year
    // Let's use a reference date in November to test months that have passed

    const novemberRef = new Date('2025-11-15T12:00:00.000Z');

    it('should parse "march 15" in November as next year March', () => {
      expectDate('march 15', utc(2026, 3, 15), { referenceDate: novemberRef });
    });

    it('should parse "january 1" in November as next January', () => {
      expectDate('january 1', utc(2026, 1, 1), { referenceDate: novemberRef });
    });
  });

  describe('Time-of-day modifiers (morning, afternoon, evening)', () => {
    it('should parse "next monday in the afternoon" as next monday at 14:00', () => {
      // Reference: Wednesday Jan 15, 2025. Next monday is Jan 20
      expectDate('next monday in the afternoon', utc(2025, 1, 20, 14, 0));
    });

    it('should parse "next monday afternoon" as next monday at 14:00', () => {
      expectDate('next monday afternoon', utc(2025, 1, 20, 14, 0));
    });

    it('should parse "last friday evening" as last friday at 18:00', () => {
      // Reference: Wednesday Jan 15, 2025. Last friday is Jan 10
      expectDate('last friday evening', utc(2025, 1, 10, 18, 0));
    });

    it('should parse "tomorrow morning" as tomorrow at 9:00', () => {
      expectDate('tomorrow morning', utc(2025, 1, 16, 9, 0));
    });

    it('should parse "tomorrow afternoon" as tomorrow at 14:00', () => {
      expectDate('tomorrow afternoon', utc(2025, 1, 16, 14, 0));
    });

    it('should parse "tomorrow evening" as tomorrow at 18:00', () => {
      expectDate('tomorrow evening', utc(2025, 1, 16, 18, 0));
    });

    it('should parse "monday morning" as next monday at 9:00', () => {
      expectDate('monday morning', utc(2025, 1, 20, 9, 0));
    });

    it('should parse "friday afternoon" as next friday at 14:00', () => {
      // Next friday is Jan 17
      expectDate('friday afternoon', utc(2025, 1, 17, 14, 0));
    });

    it('should parse "this friday evening" as this friday at 18:00', () => {
      expectDate('this friday evening', utc(2025, 1, 17, 18, 0));
    });
  });

  describe('Start/end of day patterns', () => {
    it('should parse "start of today" as today at 00:00', () => {
      expectDate('start of today', utc(2025, 1, 15, 0, 0));
    });

    it('should parse "end of today" as today at 23:59', () => {
      expectDate('end of today', utc(2025, 1, 15, 23, 59));
    });

    it('should parse "beginning of tomorrow" as tomorrow at 00:00', () => {
      expectDate('beginning of tomorrow', utc(2025, 1, 16, 0, 0));
    });

    it('should parse "end of tomorrow" as tomorrow at 23:59', () => {
      expectDate('end of tomorrow', utc(2025, 1, 16, 23, 59));
    });

    it('should parse "start of yesterday" as yesterday at 00:00', () => {
      expectDate('start of yesterday', utc(2025, 1, 14, 0, 0));
    });

    it('should parse "end of yesterday" as yesterday at 23:59', () => {
      expectDate('end of yesterday', utc(2025, 1, 14, 23, 59));
    });
  });

  describe('This morning/afternoon/evening patterns', () => {
    it('should parse "this morning" as today at 9:00', () => {
      expectDate('this morning', utc(2025, 1, 15, 9, 0));
    });

    it('should parse "this afternoon" as today at 14:00', () => {
      expectDate('this afternoon', utc(2025, 1, 15, 14, 0));
    });

    it('should parse "this evening" as today at 18:00', () => {
      expectDate('this evening', utc(2025, 1, 15, 18, 0));
    });
  });

  describe('Bare ordinal day patterns', () => {
    it('should parse "4th" as the 4th of next month (since Jan 4 has passed)', () => {
      // Reference is Jan 15, so 4th has passed -> Feb 4
      expectDate('4th', utc(2025, 2, 4));
    });

    it('should parse "20th" as the 20th of current month (since Jan 20 is future)', () => {
      expectDate('20th', utc(2025, 1, 20));
    });

    it('should parse "1st" as the 1st of next month', () => {
      expectDate('1st', utc(2025, 2, 1));
    });

    it('should parse "31st" as the 31st of current month', () => {
      expectDate('31st', utc(2025, 1, 31));
    });

    it('should parse "on 15th" as the 15th of current month', () => {
      expectDate('on 15th', utc(2025, 1, 15));
    });

    it('should parse "on 20th" as the 20th of current month', () => {
      expectDate('on 20th', utc(2025, 1, 20));
    });
  });
});

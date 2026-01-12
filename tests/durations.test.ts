import { describe, it, expect } from 'vitest';
import { parse, parseDuration, DurationResult } from '../src';

// Duration constants in milliseconds
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;

// Helper to check if result is a duration type
function expectDuration(input: string, expectedMs: number) {
  const result = parse(input) as DurationResult;
  expect(result.type).toBe('duration');
  expect(result.duration).toBe(expectedMs);
  expect(result.title).toBeNull();
}

// Helper with approximate matching for month/year durations
function expectDurationApprox(input: string, expectedMs: number, tolerance = 0.01) {
  const result = parse(input) as DurationResult;
  expect(result.type).toBe('duration');
  const diff = Math.abs(result.duration - expectedMs);
  const maxDiff = expectedMs * tolerance;
  expect(diff).toBeLessThanOrEqual(maxDiff);
  expect(result.title).toBeNull();
}

describe('Duration Parsing', () => {
  describe('Basic units - Days', () => {
    it('should parse "1 day"', () => {
      expectDuration('1 day', MS_PER_DAY);
    });

    it('should parse "2 days"', () => {
      expectDuration('2 days', 2 * MS_PER_DAY);
    });

    it('should parse "10 days"', () => {
      expectDuration('10 days', 10 * MS_PER_DAY);
    });

    it('should parse "30 days"', () => {
      expectDuration('30 days', 30 * MS_PER_DAY);
    });

    it('should parse "365 days"', () => {
      expectDuration('365 days', 365 * MS_PER_DAY);
    });
  });

  describe('Basic units - Weeks', () => {
    it('should parse "1 week"', () => {
      expectDuration('1 week', MS_PER_WEEK);
    });

    it('should parse "2 weeks"', () => {
      expectDuration('2 weeks', 2 * MS_PER_WEEK);
    });

    it('should parse "4 weeks"', () => {
      expectDuration('4 weeks', 4 * MS_PER_WEEK);
    });

    it('should parse "52 weeks"', () => {
      expectDuration('52 weeks', 52 * MS_PER_WEEK);
    });
  });

  describe('Basic units - Months', () => {
    it('should parse "1 month"', () => {
      expectDurationApprox('1 month', MS_PER_MONTH);
    });

    it('should parse "2 months"', () => {
      expectDurationApprox('2 months', 2 * MS_PER_MONTH);
    });

    it('should parse "6 months"', () => {
      expectDurationApprox('6 months', 6 * MS_PER_MONTH);
    });

    it('should parse "12 months"', () => {
      expectDurationApprox('12 months', 12 * MS_PER_MONTH);
    });
  });

  describe('Basic units - Years', () => {
    it('should parse "1 year"', () => {
      expectDurationApprox('1 year', MS_PER_YEAR);
    });

    it('should parse "2 years"', () => {
      expectDurationApprox('2 years', 2 * MS_PER_YEAR);
    });

    it('should parse "5 years"', () => {
      expectDurationApprox('5 years', 5 * MS_PER_YEAR);
    });

    it('should parse "10 years"', () => {
      expectDurationApprox('10 years', 10 * MS_PER_YEAR);
    });
  });

  describe('Basic units - Hours', () => {
    it('should parse "1 hour"', () => {
      expectDuration('1 hour', MS_PER_HOUR);
    });

    it('should parse "2 hours"', () => {
      expectDuration('2 hours', 2 * MS_PER_HOUR);
    });

    it('should parse "24 hours"', () => {
      expectDuration('24 hours', 24 * MS_PER_HOUR);
    });

    it('should parse "48 hours"', () => {
      expectDuration('48 hours', 48 * MS_PER_HOUR);
    });
  });

  describe('Basic units - Minutes', () => {
    it('should parse "1 minute"', () => {
      expectDuration('1 minute', MS_PER_MINUTE);
    });

    it('should parse "30 minutes"', () => {
      expectDuration('30 minutes', 30 * MS_PER_MINUTE);
    });

    it('should parse "60 minutes"', () => {
      expectDuration('60 minutes', 60 * MS_PER_MINUTE);
    });

    it('should parse "90 minutes"', () => {
      expectDuration('90 minutes', 90 * MS_PER_MINUTE);
    });
  });

  describe('Basic units - Seconds', () => {
    it('should parse "1 second"', () => {
      expectDuration('1 second', MS_PER_SECOND);
    });

    it('should parse "30 seconds"', () => {
      expectDuration('30 seconds', 30 * MS_PER_SECOND);
    });

    it('should parse "60 seconds"', () => {
      expectDuration('60 seconds', 60 * MS_PER_SECOND);
    });
  });

  describe('Abbreviated units', () => {
    it('should parse "1d"', () => {
      expectDuration('1d', MS_PER_DAY);
    });

    it('should parse "2d"', () => {
      expectDuration('2d', 2 * MS_PER_DAY);
    });

    it('should parse "10d"', () => {
      expectDuration('10d', 10 * MS_PER_DAY);
    });

    it('should parse "1w"', () => {
      expectDuration('1w', MS_PER_WEEK);
    });

    it('should parse "2w"', () => {
      expectDuration('2w', 2 * MS_PER_WEEK);
    });

    it('should parse "4w"', () => {
      expectDuration('4w', 4 * MS_PER_WEEK);
    });

    it('should parse "1m"', () => {
      expectDurationApprox('1m', MS_PER_MONTH);
    });

    it('should parse "2m"', () => {
      expectDurationApprox('2m', 2 * MS_PER_MONTH);
    });

    it('should parse "6m"', () => {
      expectDurationApprox('6m', 6 * MS_PER_MONTH);
    });

    it('should parse "1y"', () => {
      expectDurationApprox('1y', MS_PER_YEAR);
    });

    it('should parse "2y"', () => {
      expectDurationApprox('2y', 2 * MS_PER_YEAR);
    });

    it('should parse "5y"', () => {
      expectDurationApprox('5y', 5 * MS_PER_YEAR);
    });

    it('should parse "1h"', () => {
      expectDuration('1h', MS_PER_HOUR);
    });

    it('should parse "2h"', () => {
      expectDuration('2h', 2 * MS_PER_HOUR);
    });

    it('should parse "24h"', () => {
      expectDuration('24h', 24 * MS_PER_HOUR);
    });

    it('should parse "1min"', () => {
      expectDuration('1min', MS_PER_MINUTE);
    });

    it('should parse "30min"', () => {
      expectDuration('30min', 30 * MS_PER_MINUTE);
    });

    it('should parse "60min"', () => {
      expectDuration('60min', 60 * MS_PER_MINUTE);
    });

    it('should parse "1s"', () => {
      expectDuration('1s', MS_PER_SECOND);
    });

    it('should parse "30s"', () => {
      expectDuration('30s', 30 * MS_PER_SECOND);
    });

    it('should parse "60s"', () => {
      expectDuration('60s', 60 * MS_PER_SECOND);
    });

    it('should parse "1hr"', () => {
      expectDuration('1hr', MS_PER_HOUR);
    });

    it('should parse "2hrs"', () => {
      expectDuration('2hrs', 2 * MS_PER_HOUR);
    });

    it('should parse "24hrs"', () => {
      expectDuration('24hrs', 24 * MS_PER_HOUR);
    });
  });

  describe('Word numbers', () => {
    it('should parse "one day"', () => {
      expectDuration('one day', MS_PER_DAY);
    });

    it('should parse "two days"', () => {
      expectDuration('two days', 2 * MS_PER_DAY);
    });

    it('should parse "three days"', () => {
      expectDuration('three days', 3 * MS_PER_DAY);
    });

    it('should parse "four days"', () => {
      expectDuration('four days', 4 * MS_PER_DAY);
    });

    it('should parse "five days"', () => {
      expectDuration('five days', 5 * MS_PER_DAY);
    });

    it('should parse "six days"', () => {
      expectDuration('six days', 6 * MS_PER_DAY);
    });

    it('should parse "seven days"', () => {
      expectDuration('seven days', 7 * MS_PER_DAY);
    });

    it('should parse "eight days"', () => {
      expectDuration('eight days', 8 * MS_PER_DAY);
    });

    it('should parse "nine days"', () => {
      expectDuration('nine days', 9 * MS_PER_DAY);
    });

    it('should parse "ten days"', () => {
      expectDuration('ten days', 10 * MS_PER_DAY);
    });

    it('should parse "eleven days"', () => {
      expectDuration('eleven days', 11 * MS_PER_DAY);
    });

    it('should parse "twelve days"', () => {
      expectDuration('twelve days', 12 * MS_PER_DAY);
    });

    it('should parse "one week"', () => {
      expectDuration('one week', MS_PER_WEEK);
    });

    it('should parse "two weeks"', () => {
      expectDuration('two weeks', 2 * MS_PER_WEEK);
    });

    it('should parse "three weeks"', () => {
      expectDuration('three weeks', 3 * MS_PER_WEEK);
    });

    it('should parse "one month"', () => {
      expectDurationApprox('one month', MS_PER_MONTH);
    });

    it('should parse "two months"', () => {
      expectDurationApprox('two months', 2 * MS_PER_MONTH);
    });

    it('should parse "three months"', () => {
      expectDurationApprox('three months', 3 * MS_PER_MONTH);
    });

    it('should parse "one year"', () => {
      expectDurationApprox('one year', MS_PER_YEAR);
    });

    it('should parse "two years"', () => {
      expectDurationApprox('two years', 2 * MS_PER_YEAR);
    });

    it('should parse "a day"', () => {
      expectDuration('a day', MS_PER_DAY);
    });

    it('should parse "a week"', () => {
      expectDuration('a week', MS_PER_WEEK);
    });

    it('should parse "a month"', () => {
      expectDurationApprox('a month', MS_PER_MONTH);
    });

    it('should parse "a year"', () => {
      expectDurationApprox('a year', MS_PER_YEAR);
    });

    it('should parse "an hour"', () => {
      expectDuration('an hour', MS_PER_HOUR);
    });

    it('should parse "a minute"', () => {
      expectDuration('a minute', MS_PER_MINUTE);
    });
  });

  describe('Fractional durations', () => {
    it('should parse "1.5 days"', () => {
      expectDuration('1.5 days', 1.5 * MS_PER_DAY);
    });

    it('should parse "0.5 days"', () => {
      expectDuration('0.5 days', 0.5 * MS_PER_DAY);
    });

    it('should parse "1.5 weeks"', () => {
      expectDuration('1.5 weeks', 1.5 * MS_PER_WEEK);
    });

    it('should parse "0.5 weeks"', () => {
      expectDuration('0.5 weeks', 0.5 * MS_PER_WEEK);
    });

    it('should parse "2.5 hours"', () => {
      expectDuration('2.5 hours', 2.5 * MS_PER_HOUR);
    });

    it('should parse "0.25 hours"', () => {
      expectDuration('0.25 hours', 0.25 * MS_PER_HOUR);
    });

    it('should parse "half a day"', () => {
      expectDuration('half a day', 0.5 * MS_PER_DAY);
    });

    it('should parse "half a week"', () => {
      expectDuration('half a week', 0.5 * MS_PER_WEEK);
    });

    it('should parse "half a month"', () => {
      expectDurationApprox('half a month', 0.5 * MS_PER_MONTH);
    });

    it('should parse "a day and a half"', () => {
      expectDuration('a day and a half', 1.5 * MS_PER_DAY);
    });

    it('should parse "a week and a half"', () => {
      expectDuration('a week and a half', 1.5 * MS_PER_WEEK);
    });

    it('should parse "one and a half days"', () => {
      expectDuration('one and a half days', 1.5 * MS_PER_DAY);
    });

    it('should parse "two and a half weeks"', () => {
      expectDuration('two and a half weeks', 2.5 * MS_PER_WEEK);
    });
  });

  describe('Combined durations', () => {
    it('should parse "1 week and 2 days"', () => {
      expectDuration('1 week and 2 days', MS_PER_WEEK + 2 * MS_PER_DAY);
    });

    it('should parse "2 hours and 30 minutes"', () => {
      expectDuration('2 hours and 30 minutes', 2 * MS_PER_HOUR + 30 * MS_PER_MINUTE);
    });

    it('should parse "1 year and 6 months"', () => {
      expectDurationApprox('1 year and 6 months', MS_PER_YEAR + 6 * MS_PER_MONTH);
    });

    it('should parse "1 day 2 hours 30 minutes"', () => {
      expectDuration('1 day 2 hours 30 minutes', MS_PER_DAY + 2 * MS_PER_HOUR + 30 * MS_PER_MINUTE);
    });

    it('should parse "1w 2d"', () => {
      expectDuration('1w 2d', MS_PER_WEEK + 2 * MS_PER_DAY);
    });

    it('should parse "2h 30m"', () => {
      expectDuration('2h 30m', 2 * MS_PER_HOUR + 30 * MS_PER_MINUTE);
    });

    it('should parse "1y 6m"', () => {
      expectDurationApprox('1y 6m', MS_PER_YEAR + 6 * MS_PER_MONTH);
    });

    it('should parse "1 week, 2 days"', () => {
      expectDuration('1 week, 2 days', MS_PER_WEEK + 2 * MS_PER_DAY);
    });

    it('should parse "1 week, 2 days, and 3 hours"', () => {
      expectDuration('1 week, 2 days, and 3 hours', MS_PER_WEEK + 2 * MS_PER_DAY + 3 * MS_PER_HOUR);
    });
  });

  describe('With "for" prefix', () => {
    it('should parse "for 2 weeks"', () => {
      expectDuration('for 2 weeks', 2 * MS_PER_WEEK);
    });

    it('should parse "for 10 days"', () => {
      expectDuration('for 10 days', 10 * MS_PER_DAY);
    });

    it('should parse "for 3 months"', () => {
      expectDurationApprox('for 3 months', 3 * MS_PER_MONTH);
    });

    it('should parse "for a year"', () => {
      expectDurationApprox('for a year', MS_PER_YEAR);
    });

    it('should parse "for 2 hours and 30 minutes"', () => {
      expectDuration('for 2 hours and 30 minutes', 2 * MS_PER_HOUR + 30 * MS_PER_MINUTE);
    });
  });

  describe('Edge cases', () => {
    it('should parse "0 days"', () => {
      expectDuration('0 days', 0);
    });

    it('should parse "100 days"', () => {
      expectDuration('100 days', 100 * MS_PER_DAY);
    });

    it('should parse "1000 days"', () => {
      expectDuration('1000 days', 1000 * MS_PER_DAY);
    });

    it('should parse "0.1 days"', () => {
      expectDuration('0.1 days', 0.1 * MS_PER_DAY);
    });

    it('should parse "0.01 weeks"', () => {
      expectDuration('0.01 weeks', 0.01 * MS_PER_WEEK);
    });
  });

  describe('parseDuration helper function', () => {
    it('should return duration in ms for valid duration input', () => {
      const result = parseDuration('2 weeks');
      expect(result).toBe(2 * MS_PER_WEEK);
    });

    it('should return null for non-duration input', () => {
      const result = parseDuration('tomorrow');
      expect(result).toBeNull();
    });

    it('should return null for invalid input', () => {
      const result = parseDuration('not a duration');
      expect(result).toBeNull();
    });
  });
});

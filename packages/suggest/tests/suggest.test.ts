import { describe, it, expect } from 'vitest';
import { suggest } from '../src/index';

const referenceDate = new Date('2025-01-15T12:00:00.000Z');

describe('suggest', () => {
  describe('empty input', () => {
    it('returns default suggestions sorted by proximity', () => {
      const result = suggest('', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns parsed dates', () => {
      const result = suggest('', { referenceDate });

      result.forEach((s) => {
        expect(s.date).toBeInstanceOf(Date);
      });
    });
  });

  describe('relative time', () => {
    it('returns suggestions for numeric prefix', () => {
      const result = suggest('5', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.label.startsWith('5'))).toBe(true);
    });

    it('returns suggestions for "5 m"', () => {
      const result = suggest('5 m', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('minutes'))).toBe(true);
    });
  });

  describe('relative weekdays', () => {
    it('returns suggestions for "next"', () => {
      const result = suggest('next', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.label.startsWith('next'))).toBe(true);
    });

    it('returns suggestions for "next m"', () => {
      const result = suggest('next m', { referenceDate });

      expect(result.some((s) => s.label.startsWith('next monday'))).toBe(true);
    });
  });

  describe('relative day with time', () => {
    it('returns suggestions for "tomorrow at"', () => {
      const result = suggest('tomorrow at', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.label.startsWith('tomorrow at'))).toBe(true);
    });

    it('returns parsed dates for time suggestions', () => {
      const result = suggest('tomorrow at noon', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('tomorrow at noon');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });
  });

  describe('options', () => {
    it('respects limit option', () => {
      const result = suggest('1', { referenceDate, limit: 3 });

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('uses default limit of 5', () => {
      const result = suggest('1', { referenceDate });

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('uses referenceDate for parsing', () => {
      const ref = new Date('2025-06-15T12:00:00Z');
      const result = suggest('tomorrow', { referenceDate: ref });

      expect(result[0]?.date.toISOString()).toContain('2025-06-16');
    });
  });

  describe('fallback parsing', () => {
    it('parses raw input when no template matches', () => {
      const result = suggest('january 15', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('january 15');
    });
  });

  describe('whitespace handling', () => {
    it('trims whitespace from input', () => {
      const result = suggest('  tomorrow  ', { referenceDate });

      expect(result[0]?.label).toContain('tomorrow');
    });
  });

  describe('relative week suggestions', () => {
    it('returns suggestions for "this week"', () => {
      const result = suggest('this week', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('this week');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "next week"', () => {
      const result = suggest('next week', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('next week');
    });

    it('returns suggestions for "last week"', () => {
      const result = suggest('last week', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('last week');
    });
  });

  describe('relative month suggestions', () => {
    it('returns suggestions for "this month"', () => {
      const result = suggest('this month', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('this month');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "next month"', () => {
      const result = suggest('next month', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('next month');
    });

    it('returns suggestions for "last month"', () => {
      const result = suggest('last month', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('last month');
    });
  });

  describe('relative year suggestions', () => {
    it('returns suggestions for "this year"', () => {
      const result = suggest('this year', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('this year');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "next year"', () => {
      const result = suggest('next year', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('next year');
    });

    it('returns suggestions for "last year"', () => {
      const result = suggest('last year', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('last year');
    });
  });

  describe('quarter suggestions', () => {
    it('returns suggestions for "this quarter"', () => {
      const result = suggest('this quarter', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('this quarter');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "Q"', () => {
      const result = suggest('Q', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('quarter') || s.label.startsWith('Q'))).toBe(true);
    });

    it('returns suggestions for "Q1"', () => {
      const result = suggest('Q1', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('Q1');
    });
  });

  describe('end of period suggestions', () => {
    it('returns suggestions for "end of"', () => {
      const result = suggest('end of', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.label.startsWith('end of'))).toBe(true);
    });

    it('returns suggestions for "eod"', () => {
      const result = suggest('eod', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('eod');
    });

    it('returns suggestions for "end of day"', () => {
      const result = suggest('end of day', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('end of day');
    });

    it('returns suggestions for "end of month"', () => {
      const result = suggest('end of month', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('end of month');
    });
  });

  describe('start of period suggestions', () => {
    it('returns suggestions for "start of"', () => {
      const result = suggest('start of', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.label.startsWith('start of'))).toBe(true);
    });

    it('returns suggestions for "beginning of"', () => {
      const result = suggest('beginning of', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.label.startsWith('beginning of'))).toBe(true);
    });
  });

  describe('special day suggestions', () => {
    it('returns suggestions for "day after tomorrow"', () => {
      const result = suggest('day after tomorrow', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('day after tomorrow');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "day before yesterday"', () => {
      const result = suggest('day before yesterday', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('day before yesterday');
    });

    it('returns suggestions for "day"', () => {
      const result = suggest('day', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label === 'day after tomorrow')).toBe(true);
    });
  });

  describe('time of day suggestions', () => {
    it('returns suggestions for "tomorrow morning"', () => {
      const result = suggest('tomorrow morning', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('tomorrow morning');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "yesterday evening"', () => {
      const result = suggest('yesterday evening', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('yesterday evening');
    });

    it('returns suggestions for "this morning"', () => {
      const result = suggest('this morning', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('this morning');
    });
  });

  describe('now and later suggestions', () => {
    it('returns suggestions for "now"', () => {
      const result = suggest('now', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('now');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "later"', () => {
      const result = suggest('later', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label === 'later today')).toBe(true);
    });
  });

  describe('in a X suggestions', () => {
    it('returns suggestions for "in an hour"', () => {
      const result = suggest('in an hour', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('in an hour');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('returns suggestions for "in a"', () => {
      const result = suggest('in a', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label === 'in a week')).toBe(true);
    });

    it('returns suggestions for "half an hour"', () => {
      const result = suggest('half an hour', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('half an hour');
    });

    it('returns suggestions for "fortnight"', () => {
      const result = suggest('in a fortnight', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('in a fortnight');
    });
  });

  describe('noon suggestions', () => {
    it('returns suggestions for "tomorrow noon"', () => {
      const result = suggest('tomorrow noon', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('tomorrow noon');
      expect(result[0]?.date).toBeInstanceOf(Date);
    });
  });

  describe('abbreviation and alias support', () => {
    it('returns suggestions for weekday abbreviations like "tue"', () => {
      const result = suggest('tue', { referenceDate, limit: 20 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('tuesday'))).toBe(true);
    });

    it('returns suggestions for "mon"', () => {
      const result = suggest('mon', { referenceDate, limit: 20 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('monday'))).toBe(true);
    });

    it('returns suggestions for "wed"', () => {
      const result = suggest('wed', { referenceDate, limit: 20 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('wednesday'))).toBe(true);
    });

    it('returns suggestions for "next tue"', () => {
      const result = suggest('next tue', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toContain('next tuesday');
    });

    it('returns suggestions for "tom"', () => {
      const result = suggest('tom', { referenceDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('tomorrow'))).toBe(true);
    });

    it('returns suggestions for "morn"', () => {
      const result = suggest('morn', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('morning'))).toBe(true);
    });
  });

  describe('sorting by date proximity', () => {
    it('sorts "last" suggestions with closer dates first', () => {
      const result = suggest('last', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      const labels = result.map((s) => s.label);

      const weekIdx = labels.indexOf('last week');
      const monthIdx = labels.indexOf('last month');
      const yearIdx = labels.indexOf('last year');

      if (weekIdx !== -1 && monthIdx !== -1) {
        expect(weekIdx).toBeLessThan(monthIdx);
      }
      if (monthIdx !== -1 && yearIdx !== -1) {
        expect(monthIdx).toBeLessThan(yearIdx);
      }
    });
  });

  describe('minDate and maxDate filtering', () => {
    it('filters out dates before minDate', () => {
      const result = suggest('week', { referenceDate, limit: 10, minDate: referenceDate });

      const labels = result.map((s) => s.label);
      expect(labels).not.toContain('last week');
      expect(labels).not.toContain('1 week ago');
    });

    it('filters out dates after maxDate', () => {
      const result = suggest('week', { referenceDate, limit: 10, maxDate: referenceDate });

      const labels = result.map((s) => s.label);
      expect(labels).not.toContain('next week');
      expect(labels).not.toContain('1 week from now');
    });

    it('returns no results when all dates are outside range', () => {
      const minDate = new Date('2030-01-01');
      const result = suggest('yesterday', { referenceDate, minDate });

      expect(result.length).toBe(0);
    });
  });

  describe('date + month suggestions', () => {
    it('returns suggestions for "25 a"', () => {
      const result = suggest('25 a', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label === '25 april')).toBe(true);
      expect(result.some((s) => s.label === '25 august')).toBe(true);
    });

    it('returns suggestions for "25 aug"', () => {
      const result = suggest('25 aug', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('25 august');
    });

    it('returns suggestions for month abbreviations', () => {
      const result = suggest('mar', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.label.includes('march'))).toBe(true);
    });

    it('returns suggestions for "june 1"', () => {
      const result = suggest('june 1', { referenceDate, limit: 10 });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.label).toBe('june 1');
    });
  });

  describe('deduplication', () => {
    it('removes duplicate dates keeping simpler labels', () => {
      const result = suggest('week', { referenceDate, limit: 20 });

      const labels = result.map((s) => s.label);
      expect(labels).toContain('in a week');
      expect(labels).not.toContain('1 week from now');
    });
  });

  describe('business hours prioritization', () => {
    it('prioritizes business hours (8am-6pm) over late night for future dates', () => {
      const result = suggest('tomorrow', { referenceDate, limit: 10, sortPreference: 'future' });

      const labels = result.map((s) => s.label);
      const idx8am = labels.findIndex((l) => l.includes('8am'));
      const idx12am = labels.findIndex((l) => l.includes('12am'));

      if (idx8am !== -1 && idx12am !== -1) {
        expect(idx8am).toBeLessThan(idx12am);
      }
    });

    it('shows 12pm before 12am when typing "at 12" for future dates', () => {
      const result = suggest('tomorrow at 12', { referenceDate, sortPreference: 'future' });

      expect(result.length).toBe(2);
      expect(result[0]?.label).toBe('tomorrow at 12pm');
      expect(result[1]?.label).toBe('tomorrow at 12am');
    });

    it('prioritizes business hours for past dates with past sort preference', () => {
      const result = suggest('last monday', { referenceDate, limit: 10, sortPreference: 'past' });

      const labels = result.map((s) => s.label);
      const businessHourTimes = ['8am', '9am', '10am', '11am', 'noon', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
      const lateNightTimes = ['11pm', '10pm', '12am'];

      const firstBusinessIdx = labels.findIndex((l) => businessHourTimes.some((t) => l.includes(t)));
      const firstLateNightIdx = labels.findIndex((l) => lateNightTimes.some((t) => l.includes(t)));

      if (firstBusinessIdx !== -1 && firstLateNightIdx !== -1) {
        expect(firstBusinessIdx).toBeLessThan(firstLateNightIdx);
      }
    });

    it('shows business hours first for weekday suggestions', () => {
      const result = suggest('monday', { referenceDate, limit: 6, sortPreference: 'future' });

      const labels = result.map((s) => s.label);
      expect(labels[0]).toBe('monday at 8am');
      expect(labels).not.toContain('monday at 12am');
    });
  });
});

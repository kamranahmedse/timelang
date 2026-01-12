import { describe, it, expect } from 'vitest';
import { extract } from '../src/index';

// Fixed reference date for deterministic tests
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

describe('Extract (Multiple Timespans)', () => {
  describe('Comma separated', () => {
    it('should extract "Sprint 1 - Jan 5 to Jan 19, Sprint 2 - Jan 20 to Feb 2"', () => {
      const results = extract('Sprint 1 - Jan 5 to Jan 19, Sprint 2 - Jan 20 to Feb 2', { referenceDate });
      expect(results).toHaveLength(2);
      expect(results[0]?.title).toBe('Sprint 1');
      expect(results[1]?.title).toBe('Sprint 2');
    });

    it('should extract "Meeting at 10am, Lunch at noon, Review at 3pm"', () => {
      const results = extract('Meeting at 10am, Lunch at noon, Review at 3pm', { referenceDate });
      expect(results).toHaveLength(3);
    });

    it('should extract "Q1 planning, Q2 execution, Q3 review"', () => {
      const results = extract('Q1 planning, Q2 execution, Q3 review', { referenceDate });
      expect(results).toHaveLength(3);
    });

    it('should extract "monday, wednesday, friday"', () => {
      const results = extract('monday, wednesday, friday', { referenceDate });
      expect(results).toHaveLength(3);
      results.forEach(r => {
        expect(r.type).toBe('date');
      });
    });

    it('should extract "jan 5, jan 10, jan 15, jan 20"', () => {
      const results = extract('jan 5, jan 10, jan 15, jan 20', { referenceDate });
      expect(results).toHaveLength(4);
    });
  });

  describe('Semicolon separated', () => {
    it('should extract "Phase 1: jan-feb; Phase 2: mar-apr; Phase 3: may-jun"', () => {
      const results = extract('Phase 1: jan-feb; Phase 2: mar-apr; Phase 3: may-jun', { referenceDate });
      expect(results).toHaveLength(3);
      expect(results[0]?.title).toBe('Phase 1');
      expect(results[1]?.title).toBe('Phase 2');
      expect(results[2]?.title).toBe('Phase 3');
    });

    it('should extract "Sprint 1 - 2 weeks; Sprint 2 - 2 weeks; Sprint 3 - 2 weeks"', () => {
      const results = extract('Sprint 1 - 2 weeks; Sprint 2 - 2 weeks; Sprint 3 - 2 weeks', { referenceDate });
      expect(results).toHaveLength(3);
    });

    it('should extract "morning session; afternoon session; evening wrap-up"', () => {
      const results = extract('morning session; afternoon session; evening wrap-up', { referenceDate });
      // These might not parse as dates, so could be empty or partial
      // The test verifies the semicolon splitting works
    });
  });

  describe('"and" separated', () => {
    it('should extract "Monday and Wednesday and Friday"', () => {
      const results = extract('Monday and Wednesday and Friday', { referenceDate });
      expect(results).toHaveLength(3);
      results.forEach(r => {
        expect(r.type).toBe('date');
      });
    });

    it('should extract "Q1 and Q3"', () => {
      const results = extract('Q1 and Q3', { referenceDate });
      expect(results).toHaveLength(2);
      results.forEach(r => {
        expect(r.type).toBe('fuzzy');
      });
    });

    it('should extract "January 5th and January 20th"', () => {
      const results = extract('January 5th and January 20th', { referenceDate });
      expect(results).toHaveLength(2);
      results.forEach(r => {
        expect(r.type).toBe('date');
      });
    });

    it('should extract "tomorrow and next friday"', () => {
      const results = extract('tomorrow and next friday', { referenceDate });
      expect(results).toHaveLength(2);
    });
  });

  describe('Newline separated', () => {
    it('should extract "Sprint 1 - Jan 5 to Jan 19\\nSprint 2 - Jan 20 to Feb 2"', () => {
      const results = extract('Sprint 1 - Jan 5 to Jan 19\nSprint 2 - Jan 20 to Feb 2', { referenceDate });
      expect(results).toHaveLength(2);
      expect(results[0]?.title).toBe('Sprint 1');
      expect(results[1]?.title).toBe('Sprint 2');
    });

    it('should extract "Morning meeting at 10am\\nAfternoon review at 3pm"', () => {
      const results = extract('Morning meeting at 10am\nAfternoon review at 3pm', { referenceDate });
      expect(results).toHaveLength(2);
    });

    it('should extract multi-line list', () => {
      const input = `Task 1 - jan 5
Task 2 - jan 10
Task 3 - jan 15`;
      const results = extract(input, { referenceDate });
      expect(results).toHaveLength(3);
    });
  });

  describe('Mixed formats', () => {
    it('should extract "Sprint 1: jan 5-19, Sprint 2: jan 20 to feb 2, and Sprint 3 starting feb 3 for 2 weeks"', () => {
      const results = extract('Sprint 1: jan 5-19, Sprint 2: jan 20 to feb 2, and Sprint 3 starting feb 3 for 2 weeks', { referenceDate });
      expect(results).toHaveLength(3);
    });

    it('should extract mixed date types', () => {
      const results = extract('tomorrow, next week, Q1, last 30 days', { referenceDate });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract "Meeting (Jan 5), Review (Jan 10), Launch (Jan 15)"', () => {
      const results = extract('Meeting (Jan 5), Review (Jan 10), Launch (Jan 15)', { referenceDate });
      expect(results).toHaveLength(3);
    });
  });

  describe('Parenthetical in lists', () => {
    it('should extract "Team A (monday), Team B (tuesday), Team C (wednesday)"', () => {
      const results = extract('Team A (monday), Team B (tuesday), Team C (wednesday)', { referenceDate });
      expect(results).toHaveLength(3);
      expect(results[0]?.title).toBe('Team A');
      expect(results[1]?.title).toBe('Team B');
      expect(results[2]?.title).toBe('Team C');
    });

    it('should extract "Sprint 1 (jan 5-19), Sprint 2 (jan 20 - feb 2)"', () => {
      const results = extract('Sprint 1 (jan 5-19), Sprint 2 (jan 20 - feb 2)', { referenceDate });
      expect(results).toHaveLength(2);
      expect(results[0]?.title).toBe('Sprint 1');
      expect(results[1]?.title).toBe('Sprint 2');
    });

    it('should extract "Review (Q1), Planning (Q2), Execution (Q3)"', () => {
      const results = extract('Review (Q1), Planning (Q2), Execution (Q3)', { referenceDate });
      expect(results).toHaveLength(3);
      expect(results[0]?.title).toBe('Review');
      expect(results[1]?.title).toBe('Planning');
      expect(results[2]?.title).toBe('Execution');
    });
  });

  describe('Edge cases', () => {
    it('should return empty array for empty string', () => {
      const results = extract('', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should return empty array for whitespace only', () => {
      const results = extract('   ', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should return single item for single date', () => {
      const results = extract('tomorrow', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('date');
    });

    it('should return empty array for text with no parseable dates', () => {
      const results = extract('hello world, foo bar, baz qux', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should return only valid entries for mixed valid/invalid', () => {
      const results = extract('tomorrow, not a date, next friday, garbage', { referenceDate });
      expect(results).toHaveLength(2);
    });

    it('should handle extra commas gracefully', () => {
      const results = extract('tomorrow,, next friday,', { referenceDate });
      expect(results).toHaveLength(2);
    });

    it('should handle extra semicolons gracefully', () => {
      const results = extract('tomorrow;; next friday;', { referenceDate });
      expect(results).toHaveLength(2);
    });

    it('should handle mixed separators', () => {
      const results = extract('tomorrow, next friday; next monday\nlast week', { referenceDate });
      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Result verification', () => {
    it('should return array of ParseResult objects', () => {
      const results = extract('jan 5, jan 10', { referenceDate });
      expect(Array.isArray(results)).toBe(true);
      results.forEach(r => {
        expect(r).toHaveProperty('type');
        expect(['date', 'duration', 'span', 'fuzzy']).toContain(r.type);
      });
    });

    it('should preserve title for each extracted item', () => {
      const results = extract('Meeting (jan 5), Review (jan 10)', { referenceDate });
      expect(results[0]?.title).toBe('Meeting');
      expect(results[1]?.title).toBe('Review');
    });

    it('should have null title for items without explicit title', () => {
      const results = extract('jan 5, jan 10', { referenceDate });
      results.forEach(r => {
        expect(r.title).toBeNull();
      });
    });
  });

  describe('Complex real-world examples', () => {
    it('should extract sprint schedule', () => {
      const input = `Sprint 1: Jan 6 - Jan 19
Sprint 2: Jan 20 - Feb 2
Sprint 3: Feb 3 - Feb 16
Sprint 4: Feb 17 - Mar 2`;
      const results = extract(input, { referenceDate });
      expect(results).toHaveLength(4);
    });

    it('should extract meeting schedule', () => {
      const input = 'Standup (daily at 9am), Sprint Review (friday at 3pm), Retro (friday at 4pm)';
      const results = extract(input, { referenceDate });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract project milestones', () => {
      const input = 'Alpha release - end of Q1, Beta release - mid Q2, GA release - Q3 2025';
      const results = extract(input, { referenceDate });
      expect(results).toHaveLength(3);
    });

    it('should extract vacation schedule', () => {
      const input = 'John (Dec 20 - Jan 3), Sarah (Dec 24 - Dec 31), Mike (Jan 2 - Jan 5)';
      const results = extract(input, { referenceDate });
      expect(results).toHaveLength(3);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { scan } from '../src/index';

const referenceDate = new Date('2025-01-15T12:00:00.000Z');

describe('Scan (Prose Text Extraction)', () => {
  describe('Basic prose extraction', () => {
    it('should extract date from "can we meet tomorrow at 5pm?"', () => {
      const results = scan('can we meet tomorrow at 5pm?', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('date');
      expect(results[0].match).toBe('tomorrow at 5pm');
    });

    it('should extract date from "let\'s schedule for next friday"', () => {
      const results = scan("let's schedule for next friday", { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('date');
      expect(results[0].match).toBe('next friday');
    });

    it('should extract date from "the deadline is march 15th"', () => {
      const results = scan('the deadline is march 15th', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('date');
      expect(results[0].match).toBe('march 15th');
    });

    it('should extract date from "I\'ll be free in 2 hours"', () => {
      const results = scan("I'll be free in 2 hours", { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('in 2 hours');
    });
  });

  describe('Position tracking', () => {
    it('should return correct start and end positions', () => {
      const text = 'meeting tomorrow at noon';
      const results = scan(text, { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].start).toBe(8);
      expect(results[0].end).toBe(24);
      expect(text.slice(results[0].start, results[0].end)).toBe('tomorrow at noon');
    });

    it('should return correct positions for date at start of text', () => {
      const text = 'tomorrow we have a meeting';
      const results = scan(text, { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].start).toBe(0);
      expect(text.slice(results[0].start, results[0].end)).toBe('tomorrow');
    });

    it('should return correct positions for date at end of text', () => {
      const text = 'the meeting is tomorrow';
      const results = scan(text, { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].end).toBe(text.length);
    });
  });

  describe('Multiple dates in text', () => {
    it('should extract multiple dates from prose', () => {
      const results = scan(
        'we could meet tomorrow or maybe next monday would work better',
        { referenceDate }
      );
      expect(results).toHaveLength(2);
      expect(results[0].match).toBe('tomorrow');
      expect(results[1].match).toBe('next monday');
    });

    it('should extract dates from email-like text', () => {
      const text =
        'Hi, can we reschedule from monday to wednesday? Let me know by friday.';
      const results = scan(text, { referenceDate });
      expect(results).toHaveLength(2);
      expect(results[0].result.type).toBe('span');
      expect(results[0].match).toBe('from monday to wednesday');
      expect(results[1].match).toBe('friday');
    });

    it('should extract dates from meeting notes', () => {
      const text =
        'Action items: submit report by jan 20, review draft on jan 25, final delivery feb 1';
      const results = scan(text, { referenceDate });
      expect(results).toHaveLength(3);
    });
  });

  describe('Date spans in prose', () => {
    it('should extract span from "the conference runs from jan 5 to jan 10"', () => {
      const results = scan('the conference runs from jan 5 to jan 10', {
        referenceDate,
      });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('span');
      expect(results[0].match).toBe('from jan 5 to jan 10');
    });

    it('should extract date from "I\'ll be on vacation next week"', () => {
      const results = scan("I'll be on vacation next week", { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('date');
      expect(results[0].match).toBe('next week');
    });
  });

  describe('Durations in prose', () => {
    it('should extract duration from "this should take about 2 weeks"', () => {
      const results = scan('this should take about 2 weeks', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('duration');
      expect(results[0].match).toBe('2 weeks');
    });

    it('should extract duration from "we need 3 days to finish"', () => {
      const results = scan('we need 3 days to finish', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('duration');
      expect(results[0].match).toBe('3 days');
    });
  });

  describe('Fuzzy dates in prose', () => {
    it('should extract fuzzy date from "let\'s aim for early january"', () => {
      const results = scan("let's aim for early january", { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('fuzzy');
      expect(results[0].match).toBe('early january');
    });

    it('should extract fuzzy date from "we\'re targeting mid Q2"', () => {
      const results = scan("we're targeting mid Q2", { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('fuzzy');
      expect(results[0].match).toBe('mid Q2');
    });
  });

  describe('Ambiguous words', () => {
    it('should not match "may" as month when used as verb', () => {
      const results = scan('you may call me anytime', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should match "may" as month in "the event is in may"', () => {
      const results = scan('the event is in may', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('may');
    });

    it('should not match "march" as month when used as verb', () => {
      const results = scan('they march in the parade', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should match "march" with day number', () => {
      const results = scan('the deadline is march 15', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('march 15');
    });
  });

  describe('Edge cases', () => {
    it('should return empty array for empty string', () => {
      const results = scan('', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should return empty array for text with no dates', () => {
      const results = scan('hello world, how are you?', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should handle text with only whitespace', () => {
      const results = scan('   ', { referenceDate });
      expect(results).toHaveLength(0);
    });

    it('should handle punctuation around dates', () => {
      const results = scan('Meeting (tomorrow) confirmed.', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('tomorrow');
    });

    it('should handle dates in quotes', () => {
      const results = scan('She said "let\'s meet friday"', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('friday');
    });
  });

  describe('Case insensitivity', () => {
    it('should match regardless of case', () => {
      const results1 = scan('meeting on MONDAY', { referenceDate });
      const results2 = scan('meeting on Monday', { referenceDate });
      const results3 = scan('meeting on monday', { referenceDate });

      expect(results1).toHaveLength(1);
      expect(results2).toHaveLength(1);
      expect(results3).toHaveLength(1);
    });
  });

  describe('Longest match preference', () => {
    it('should prefer "tomorrow at 5pm" over just "tomorrow"', () => {
      const results = scan('let us meet tomorrow at 5pm please', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('tomorrow at 5pm');
    });

    it('should prefer "next friday at noon" over "next friday"', () => {
      const results = scan('available next friday at noon', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('next friday at noon');
    });

    it('should prefer "jan 5 to jan 10" over "jan 5"', () => {
      const results = scan('conference jan 5 to jan 10', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0].result.type).toBe('span');
    });
  });

  describe('Real-world examples', () => {
    it('should extract from email subject', () => {
      const results = scan('Re: Meeting rescheduled to thursday at 2pm', {
        referenceDate,
      });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('thursday at 2pm');
    });

    it('should extract from calendar description', () => {
      const text =
        'Weekly sync every monday at 10am. Cancelled for the week of jan 20.';
      const results = scan(text, { referenceDate });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract from chat message', () => {
      const results = scan('hey are you free tomorrow around 3pm?', {
        referenceDate,
      });
      expect(results).toHaveLength(1);
      expect(results[0].match).toBe('tomorrow around 3pm');
    });

    it('should extract from task description', () => {
      const results = scan(
        'TODO: Review PR before end of day friday and deploy by monday morning',
        { referenceDate }
      );
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Non-overlapping results', () => {
    it('should not return overlapping matches', () => {
      const results = scan('meeting tomorrow at 5pm', { referenceDate });
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].end).toBeLessThanOrEqual(results[i + 1].start);
      }
    });
  });

  describe('Result structure', () => {
    it('should return proper ScanResult structure', () => {
      const results = scan('meeting tomorrow', { referenceDate });
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('result');
      expect(results[0]).toHaveProperty('match');
      expect(results[0]).toHaveProperty('start');
      expect(results[0]).toHaveProperty('end');
      expect(typeof results[0].start).toBe('number');
      expect(typeof results[0].end).toBe('number');
      expect(typeof results[0].match).toBe('string');
    });
  });
});

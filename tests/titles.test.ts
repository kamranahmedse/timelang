import { describe, it, expect } from 'vitest';
import { parse } from '../src/index';

// Fixed reference date for deterministic tests
const referenceDate = new Date('2025-01-15T12:00:00.000Z');

function expectTitle(input: string, expectedTitle: string, options = { referenceDate }) {
  const result = parse(input, options);
  expect(result).not.toBeNull();
  expect(result?.title).toBe(expectedTitle);
}

function expectHasTitle(input: string, options = { referenceDate }) {
  const result = parse(input, options);
  expect(result).not.toBeNull();
  expect(result?.title).not.toBeNull();
  expect(typeof result?.title).toBe('string');
  expect(result?.title?.length).toBeGreaterThan(0);
}

describe('Title/Description Extraction', () => {
  describe('Dash separator', () => {
    it('should parse "Engineering meeting - July 10 to July 15"', () => {
      expectTitle('Engineering meeting - July 10 to July 15', 'Engineering meeting');
    });

    it('should parse "Sprint planning - next monday for 2 hours"', () => {
      expectTitle('Sprint planning - next monday for 2 hours', 'Sprint planning');
    });

    it('should parse "Team offsite - march 15th to march 17th"', () => {
      expectTitle('Team offsite - march 15th to march 17th', 'Team offsite');
    });

    it('should parse "Q1 Review - mid january"', () => {
      expectTitle('Q1 Review - mid january', 'Q1 Review');
    });

    it('should parse "Project deadline - end of march"', () => {
      expectTitle('Project deadline - end of march', 'Project deadline');
    });

    it('should parse "Weekly sync - tomorrow"', () => {
      expectTitle('Weekly sync - tomorrow', 'Weekly sync');
    });

    it('should parse "Launch party - friday at 5pm"', () => {
      expectTitle('Launch party - friday at 5pm', 'Launch party');
    });
  });

  describe('Colon separator', () => {
    it('should parse "Sprint 1: jan 5 to jan 19"', () => {
      expectTitle('Sprint 1: jan 5 to jan 19', 'Sprint 1');
    });

    it('should parse "Sprint 2: jan 20 to feb 2"', () => {
      expectTitle('Sprint 2: jan 20 to feb 2', 'Sprint 2');
    });

    it('should parse "Meeting: tomorrow at 3pm"', () => {
      expectTitle('Meeting: tomorrow at 3pm', 'Meeting');
    });

    it('should parse "Deadline: end of Q1"', () => {
      expectTitle('Deadline: end of Q1', 'Deadline');
    });

    it('should parse "Review period: last 30 days"', () => {
      expectTitle('Review period: last 30 days', 'Review period');
    });

    it('should parse "Phase 1: march for 2 weeks"', () => {
      expectTitle('Phase 1: march for 2 weeks', 'Phase 1');
    });
  });

  describe('Parenthetical dates', () => {
    it('should parse "Meeting with Team (Jan 15)"', () => {
      expectTitle('Meeting with Team (Jan 15)', 'Meeting with Team');
    });

    it('should parse "Project Kickoff (March 1st)"', () => {
      expectTitle('Project Kickoff (March 1st)', 'Project Kickoff');
    });

    it('should parse "Sprint Review (next friday)"', () => {
      expectTitle('Sprint Review (next friday)', 'Sprint Review');
    });

    it('should parse "Deadline (end of Q1)"', () => {
      expectTitle('Deadline (end of Q1)', 'Deadline');
    });

    it('should parse "Conference (march 10 to march 12)"', () => {
      expectTitle('Conference (march 10 to march 12)', 'Conference');
    });

    it('should parse "Vacation (dec 20 - jan 5)"', () => {
      expectTitle('Vacation (dec 20 - jan 5)', 'Vacation');
    });

    it('should parse "Team Sync (tomorrow at 3pm)"', () => {
      expectTitle('Team Sync (tomorrow at 3pm)', 'Team Sync');
    });

    it('should parse "Planning Session (mid Q1)"', () => {
      expectTitle('Planning Session (mid Q1)', 'Planning Session');
    });

    it('should parse "Launch Window (early march for 2 weeks)"', () => {
      expectTitle('Launch Window (early march for 2 weeks)', 'Launch Window');
    });

    it('should parse "Review Period (last 30 days)"', () => {
      expectTitle('Review Period (last 30 days)', 'Review Period');
    });

    it('should parse "Q3 Goals (Q3 2025)"', () => {
      expectTitle('Q3 Goals (Q3 2025)', 'Q3 Goals');
    });

    it('should parse "Budget Review (H1 2025)"', () => {
      expectTitle('Budget Review (H1 2025)', 'Budget Review');
    });

    it('should parse "Offsite (next week)"', () => {
      expectTitle('Offsite (next week)', 'Offsite');
    });

    it('should parse "1:1 with Manager (monday at 10am)"', () => {
      expectTitle('1:1 with Manager (monday at 10am)', '1:1 with Manager');
    });

    it('should parse "Bug Fix #123 (tomorrow for 2 hours)"', () => {
      expectTitle('Bug Fix #123 (tomorrow for 2 hours)', 'Bug Fix #123');
    });
  });

  describe('Parenthetical with special characters', () => {
    it('should parse "Meeting w/ John (next friday)"', () => {
      expectTitle('Meeting w/ John (next friday)', 'Meeting w/ John');
    });

    it('should parse "Sync: API Team (march 15th)"', () => {
      expectTitle('Sync: API Team (march 15th)', 'Sync: API Team');
    });

    it('should parse "URGENT - Deploy fix (tomorrow at 9am)"', () => {
      expectTitle('URGENT - Deploy fix (tomorrow at 9am)', 'URGENT - Deploy fix');
    });

    it('should parse "[Optional] Team Building (friday at 5pm)"', () => {
      expectTitle('[Optional] Team Building (friday at 5pm)', '[Optional] Team Building');
    });

    it('should parse "Release v2.0.0 (Q2 2025)"', () => {
      expectTitle('Release v2.0.0 (Q2 2025)', 'Release v2.0.0');
    });
  });

  describe('Square bracket dates', () => {
    it('should parse "Project Kickoff [March 1st]"', () => {
      expectTitle('Project Kickoff [March 1st]', 'Project Kickoff');
    });

    it('should parse "Sprint Review [next friday]"', () => {
      expectTitle('Sprint Review [next friday]', 'Sprint Review');
    });

    it('should parse "Deadline [end of Q1]"', () => {
      expectTitle('Deadline [end of Q1]', 'Deadline');
    });

    it('should parse "Team Sync [tomorrow at 3pm]"', () => {
      expectTitle('Team Sync [tomorrow at 3pm]', 'Team Sync');
    });
  });

  describe('"on" pattern', () => {
    it('should parse "Team sync on next monday"', () => {
      expectTitle('Team sync on next monday', 'Team sync');
    });

    it('should parse "Review meeting on friday"', () => {
      expectTitle('Review meeting on friday', 'Review meeting');
    });

    it('should parse "Launch on march 15th"', () => {
      expectTitle('Launch on march 15th', 'Launch');
    });

    it('should parse "Deadline on end of month"', () => {
      expectTitle('Deadline on end of month', 'Deadline');
    });
  });

  describe('"in" pattern with title', () => {
    it('should parse "Build frontend in january for two days"', () => {
      expectTitle('Build frontend in january for two days', 'Build frontend');
    });

    it('should parse "Complete testing in Q1"', () => {
      expectTitle('Complete testing in Q1', 'Complete testing');
    });

    it('should parse "Finish project in early march"', () => {
      expectTitle('Finish project in early march', 'Finish project');
    });

    it('should parse "Launch feature in mid Q2 for 2 weeks"', () => {
      expectTitle('Launch feature in mid Q2 for 2 weeks', 'Launch feature');
    });
  });

  describe('"for" pattern with title', () => {
    it('should parse "Development phase for 2 weeks starting march 1"', () => {
      expectTitle('Development phase for 2 weeks starting march 1', 'Development phase');
    });

    it('should parse "Testing period for 10 days in late march"', () => {
      expectTitle('Testing period for 10 days in late march', 'Testing period');
    });

    it('should parse "Sprint for 2 weeks from jan 5"', () => {
      expectTitle('Sprint for 2 weeks from jan 5', 'Sprint');
    });
  });

  describe('"from/to" with title', () => {
    it('should parse "Conference from march 10 to march 12"', () => {
      expectTitle('Conference from march 10 to march 12', 'Conference');
    });

    it('should parse "Vacation from dec 20 to jan 5"', () => {
      expectTitle('Vacation from dec 20 to jan 5', 'Vacation');
    });

    it('should parse "Project timeline from Q1 to Q3"', () => {
      expectTitle('Project timeline from Q1 to Q3', 'Project timeline');
    });
  });

  describe('"during" pattern', () => {
    it('should parse "Maintenance during Q1"', () => {
      expectTitle('Maintenance during Q1', 'Maintenance');
    });

    it('should parse "Training during early january"', () => {
      expectTitle('Training during early january', 'Training');
    });

    it('should parse "Review during the last week of march"', () => {
      expectTitle('Review during the last week of march', 'Review');
    });
  });

  describe('Complex titles', () => {
    it('should parse "Q3 Planning - 50 days in mid Q1"', () => {
      expectTitle('Q3 Planning - 50 days in mid Q1', 'Q3 Planning');
    });

    it('should parse "2025 Roadmap Review - Q1 2025"', () => {
      expectTitle('2025 Roadmap Review - Q1 2025', '2025 Roadmap Review');
    });

    it('should parse "Sprint 5 (Backend) - jan 20 to feb 2"', () => {
      expectTitle('Sprint 5 (Backend) - jan 20 to feb 2', 'Sprint 5 (Backend)');
    });

    it('should parse "Team Building [Optional] - next friday"', () => {
      expectTitle('Team Building [Optional] - next friday', 'Team Building [Optional]');
    });

    it('should parse "URGENT: Fix bug - tomorrow for 2 hours"', () => {
      expectTitle('URGENT: Fix bug - tomorrow for 2 hours', 'URGENT: Fix bug');
    });

    it('should parse "TODO: Review docs - by end of week"', () => {
      expectHasTitle('TODO: Review docs - by end of week');
    });
  });

  describe('Titles with special characters', () => {
    it('should parse "Meeting w/ John - tomorrow"', () => {
      expectTitle('Meeting w/ John - tomorrow', 'Meeting w/ John');
    });

    it('should parse "1:1 with manager - next monday"', () => {
      expectTitle('1:1 with manager - next monday', '1:1 with manager');
    });

    it('should parse "Bug fix #123 - this week"', () => {
      expectHasTitle('Bug fix #123 - this week');
    });

    it('should parse "Feature: API v2.0 - Q2"', () => {
      expectTitle('Feature: API v2.0 - Q2', 'Feature: API v2.0');
    });

    it('should parse "Release v1.2.3 - march 15th"', () => {
      expectTitle('Release v1.2.3 - march 15th', 'Release v1.2.3');
    });
  });

  describe('Title trimming and normalization', () => {
    it('should trim whitespace from titles', () => {
      const result = parse('  Meeting  - tomorrow', { referenceDate });
      expect(result?.title).toBe('Meeting');
    });

    it('should preserve internal spaces in titles', () => {
      const result = parse('Team Planning Session - next week', { referenceDate });
      expect(result?.title).toBe('Team Planning Session');
    });
  });

  describe('No title cases', () => {
    it('should have null title for plain date', () => {
      const result = parse('tomorrow', { referenceDate });
      expect(result?.title).toBeNull();
    });

    it('should have null title for plain duration', () => {
      const result = parse('2 weeks', { referenceDate });
      expect(result?.title).toBeNull();
    });

    it('should have null title for plain range', () => {
      const result = parse('jan 5 to jan 20', { referenceDate });
      expect(result?.title).toBeNull();
    });

    it('should have null title for plain quarter', () => {
      const result = parse('Q1', { referenceDate });
      expect(result?.title).toBeNull();
    });
  });
});

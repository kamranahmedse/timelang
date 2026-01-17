# timelang

>Parse natural language time expressions into dates, durations, and ranges.

[![npm version](https://img.shields.io/npm/v/@timelang/parse)](https://www.npmjs.com/package/@timelang/parse)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/docs-timelang.dev-purple)](https://timelang.dev)

It takes natural language inputs and converts them into structured date, duration, or span objects.

- **Flexible inputs** — `tomorrow`, `next friday at 3pm`, `jan 5 to jan 20`, `2 weeks`
- **Fuzzy periods** — `mid Q1`, `early january`, `end of month`
- **Title extraction** — Gets `Team Sync` and date from `Team Sync - next monday`
- **Multiple formats** — `jan 5`, `5th jan`, `january 5th`, `2025-01-05`
- **Forgiving parser** — Extra spaces, mixed case, missing separators all work
- **Edge case handling** — Year rollovers, leap years, fiscal quarters
- **Configurable** — Reference date, fiscal year start, week start day, date format
- **TypeScript** — Typesafe with full type definitions

## Installation

Install the package using your preferred package manager:

```bash
npm install @timelang/parse
```

Use any of the provided methods to parse time expressions:

```javascript
import { parse, parseDate, parseDuration, parseSpan, scan } from '@timelang/parse';

parseDate('next friday at 3pm');        // Date
parseDuration('2h 30m');                // 9000000 (milliseconds)
parseSpan('jan 5 to jan 20');           // { start: Date, end: Date, duration: number }

parse('Team Sync - next monday');       // { type: 'date', date, title: 'Team Sync' }
parse('mid Q1');                        // { type: 'fuzzy', start, end, approximate: true }

scan('can we meet tomorrow at 5pm?');
// [{ result: {...}, match: 'tomorrow at 5pm', start: 12, end: 27 }]
```

## API Reference

| Method | Description | Returns |
|--------|-------------|---------|
| [`parseDate(input, options?)`](#parsedateinput-options) | Parse single date expressions | `Date \| null` |
| [`parse(input, options?)`](#parseinput-options) | Parse any time expression with type detection | `ParseResult` |
| [`parseDuration(input, options?)`](#parsedurationinput-options) | Parse duration expressions | `number \| null` (ms) |
| [`parseSpan(input, options?)`](#parsespaninput-options) | Parse date ranges and time spans | `SpanResult \| null` |
| [`scan(input, options?)`](#scaninput-options) | Find dates embedded in prose/free-form text | `ScanMatch[]` |

See also: [Options](#options) · [TypeScript Types](#typescript-types) · [License](#license)

## API

### `parseDate(input, options?)`

Returns a Date or null. Use when you only want single dates.

```typescript
// Relative dates
parseDate('today');
parseDate('tomorrow');
parseDate('yesterday');
parseDate('day after tomorrow');

// Weekdays
parseDate('monday');                   // next Monday
parseDate('next friday');
parseDate('last tuesday');
parseDate('this wednesday');

// Month and day
parseDate('march 15');
parseDate('march 15th');
parseDate('15th march');
parseDate('the 15th of march');
parseDate('march 15th 2025');

// With time
parseDate('tomorrow at 3pm');
parseDate('next monday at 9:30am');
parseDate('march 15 at 14:00');

// ISO format
parseDate('2025-03-15');
parseDate('2025-03-15T14:30:00');

// Relative time
parseDate('in 30 minutes');
parseDate('in 2 hours');

// Period boundaries
parseDate('end of month');
parseDate('end of week');
parseDate('end of day');
parseDate('beginning of year');
parseDate('beginning of month');

// Invalid input
parseDate('not a date');               // null
parseDate('february 30');              // null (invalid date)
parseDate('2 weeks');                  // null (duration, not date)
```

### `parse(input, options?)`

Returns different result types based on input.

```typescript
// Date result
parse('tomorrow');
// { type: 'date', date: Date, title: null }

parse('next friday');
// { type: 'date', date: Date, title: null }

parse('march 15th 2025');
// { type: 'date', date: Date, title: null }

// Duration result
parse('2 weeks');
// { type: 'duration', duration: 1209600000, title: null }

parse('1h 30m');
// { type: 'duration', duration: 5400000, title: null }

// Span result
parse('jan 5 to jan 20');
// { type: 'span', start: Date, end: Date, duration: number, title: null }

parse('last 30 days');
// { type: 'span', start: Date, end: Date, duration: number, title: null }

// Fuzzy result (approximate dates)
parse('mid Q1');
// { type: 'fuzzy', start: Date, end: Date, approximate: true, title: null }

parse('early january');
// { type: 'fuzzy', start: Date, end: Date, approximate: true, title: null }

// With titles (dash separator)
parse('Team Sync - next monday');
// { type: 'date', date: Date, title: 'Team Sync' }

// With titles (colon separator)
parse('Sprint 1: jan 5 to jan 19');
// { type: 'span', start: Date, end: Date, duration: number, title: 'Sprint 1' }

// With titles (parentheses)
parse('Meeting (Jan 15 at 2pm)');
// { type: 'date', date: Date, title: 'Meeting' }

// With titles (brackets)
parse('Project Kickoff [March 1st]');
// { type: 'date', date: Date, title: 'Project Kickoff' }

// Invalid input
parse('random text');
// null
```

### `parseDuration(input, options?)`

Returns duration in milliseconds or null.

```typescript
// Basic units
parseDuration('3 days');
parseDuration('2 weeks');
parseDuration('1 month');
parseDuration('1 year');
parseDuration('6 hours');
parseDuration('30 minutes');
parseDuration('45 seconds');

// Abbreviated (m = minutes, mo = months)
parseDuration('3d');
parseDuration('2w');
parseDuration('3mo');
parseDuration('1y');
parseDuration('2h');
parseDuration('30m');
parseDuration('45s');

// Word numbers
parseDuration('one week');
parseDuration('two days');
parseDuration('a month');
parseDuration('an hour');

// Fractional
parseDuration('1.5 days');
parseDuration('half a week');
parseDuration('quarter hour');
parseDuration('one and a half hours');

// Combined
parseDuration('1 week and 2 days');
parseDuration('2h 30m');
parseDuration('1 hour 45 minutes');
parseDuration('1h 30m 15s');

// With 'for' prefix
parseDuration('for 2 weeks');
parseDuration('for 3 days');

// Invalid input
parseDuration('tomorrow');             // null (not a duration)
parseDuration('random');               // null
```

### `parseSpan(input, options?)`

Returns `{ start: Date, end: Date, duration: number }` or null.

```typescript
// Date ranges - "to" pattern
parseSpan('jan 5 to jan 20');
parseSpan('january 5 to january 20');

// Date ranges - "from-to" pattern
parseSpan('from march 1 to march 15');

// Date ranges - dash pattern
parseSpan('January 1 - January 15');
parseSpan('Jan1-Jan15');

// Date ranges - "between" pattern
parseSpan('between feb 1 and feb 14');

// Date ranges - "through" pattern
parseSpan('january 1 through january 15');

// Date ranges - "until" pattern
parseSpan('january 1 until january 15');

// Date with duration
parseSpan('july 3rd for 10 days');
parseSpan('tomorrow for 3 days');
parseSpan('next monday for 2 weeks');

// Starting pattern
parseSpan('starting march 1 for 2 weeks');

// In pattern
parseSpan('in january for two days');

// Relative spans - past
parseSpan('last 30 days');
parseSpan('last 2 weeks');
parseSpan('past 7 days');
parseSpan('past 2 weeks');

// Relative spans - future
parseSpan('next 30 days');
parseSpan('next 7 days');
parseSpan('coming 2 weeks');

// Relative spans - within
parseSpan('within 30 days');
parseSpan('within the next month');

// Period spans
parseSpan('this week');
parseSpan('this month');
parseSpan('this year');
parseSpan('next week');
parseSpan('next month');
parseSpan('last week');
parseSpan('last month');
parseSpan('last year');

// Quarters
parseSpan('Q1');
parseSpan('Q2 2025');
parseSpan('first quarter');
parseSpan('second quarter 2025');

// Seasons
parseSpan('spring');
parseSpan('summer 2025');
parseSpan('fall');
parseSpan('winter');

// Year parts
parseSpan('first half of 2025');
parseSpan('second half of 2025');
parseSpan('H1 2025');
parseSpan('H2 2025');

// Year to date
parseSpan('ytd');
parseSpan('year to date');

// Invalid input
parseSpan('tomorrow');                 // null (single date, not span)
parseSpan('2 weeks');                  // null (duration, not span)
parseSpan('random text');              // null
```

### `scan(input, options?)`

Scans text for embedded date expressions. Returns array of matches with position info.

Use `scan` when you need to find dates within free-form text like emails, messages, or documents.

```typescript
// Basic prose scanning
scan('can we meet tomorrow at 5pm?');
// [{ result: { type: 'date', date: Date }, match: 'tomorrow at 5pm', start: 12, end: 27 }]

scan("let's schedule for next friday");
// [{ result: { type: 'date', date: Date }, match: 'next friday', start: 20, end: 31 }]

// Multiple dates in text
scan('we could meet tomorrow or maybe next monday');
// [
//   { result: { type: 'date', ... }, match: 'tomorrow', start: 14, end: 22 },
//   { result: { type: 'date', ... }, match: 'next monday', start: 33, end: 44 }
// ]

// Finds spans in prose
scan('the conference runs from jan 5 to jan 10');
// [{ result: { type: 'span', ... }, match: 'from jan 5 to jan 10', start: 20, end: 40 }]

// Email-like text
scan('Hi, can we reschedule from monday to wednesday? Let me know by friday.');
// [
//   { result: { type: 'span', ... }, match: 'from monday to wednesday', ... },
//   { result: { type: 'date', ... }, match: 'friday', ... }
// ]

// Handles ambiguous words contextually
scan('you may call me anytime');          // [] - "may" is a verb here
scan('the event is in may');              // [{ ..., match: 'may', ... }] - "may" is a month

// Empty or no dates
scan('hello world');                      // []
scan('');                                 // []
```

Each result includes:
- `result` - The parsed `ParseResult` (date, span, duration, or fuzzy)
- `match` - The matched text substring
- `start` - Start position in the original string
- `end` - End position in the original string

## Options

```typescript
interface ParseOptions {
  referenceDate?: Date;           // Default: new Date()
  fiscalYearStart?: 'january' | 'april' | 'july' | 'october';
  weekStartsOn?: 'sunday' | 'monday';
  dateFormat?: 'us' | 'intl' | 'auto';
}
```

### referenceDate

What "today" means. Default is current date.

```typescript
parseDate('tomorrow', { referenceDate: new Date('2025-06-15') });
// June 16, 2025

parseDate('next monday', { referenceDate: new Date('2025-06-15') });
// Based on June 15, 2025

parseSpan('last 7 days', { referenceDate: new Date('2025-06-15') });
// June 8-15, 2025
```

### fiscalYearStart

When Q1 starts. Different countries use different fiscal years.

```typescript
// Default (January)
parseSpan('Q1');                                    // Jan-Mar

// UK, Japan (April)
parseSpan('Q1', { fiscalYearStart: 'april' });      // Apr-Jun

// Australia (July)
parseSpan('Q1', { fiscalYearStart: 'july' });       // Jul-Sep

// US Federal (October)
parseSpan('Q1', { fiscalYearStart: 'october' });    // Oct-Dec
```

### weekStartsOn

First day of week. Used for "this week" calculations.

```typescript
// Default (Sunday)
parseSpan('this week');                             // Sun-Sat

// Monday start
parseSpan('this week', { weekStartsOn: 'monday' }); // Mon-Sun
```

### dateFormat

How to parse dates like "01/02/2025".

```typescript
// 'intl' (default) - DD/MM/YYYY
parseDate('01/02/2025');                            // February 1st

// 'us' - MM/DD/YYYY
parseDate('01/02/2025', { dateFormat: 'us' });      // January 2nd

// 'auto' - returns null if ambiguous
parseDate('01/02/2025', { dateFormat: 'auto' });    // null (ambiguous)
parseDate('25/01/2025', { dateFormat: 'auto' });    // January 25th (not ambiguous)
```

ISO format (YYYY-MM-DD) always works regardless of this option.

## TypeScript Types

```typescript
interface DateResult {
  type: 'date';
  date: Date;
  title: string | null;
}

interface DurationResult {
  type: 'duration';
  duration: number; // milliseconds
  title: string | null;
  approximate?: boolean; // true for expressions like "about 2 weeks"
}

interface SpanResult {
  type: 'span';
  start: Date;
  end: Date;
  duration: number; // milliseconds
  title: string | null;
}

interface FuzzyResult {
  type: 'fuzzy';
  start: Date;
  end: Date;
  approximate: true;
  title: string | null;
}

type ParseResult = DateResult | DurationResult | SpanResult | FuzzyResult | null;

interface ScanMatch {
  result: ParseResult;  // The parsed result (never null)
  match: string;        // The matched text
  start: number;        // Start position in input
  end: number;          // End position in input
}
```

## License

MIT

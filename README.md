# timelang

>Parse and autocomplete natural language time expressions.

[![npm version](https://img.shields.io/npm/v/@timelang/parse)](https://www.npmjs.com/package/@timelang/parse)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/docs-timelang.dev-purple)](https://timelang.dev)

## Table of Contents

- [Packages](#packages)
- [Quick Start](#quick-start)
  - [@timelang/parse](#timelangparse-quick-start)
  - [@timelang/suggest](#timelangsuggest-quick-start)
- [@timelang/parse](#timelangparse)
  - [Features](#features)
  - [Installation](#installation)
  - [API Reference](#api-reference)
  - [Options](#options)
  - [TypeScript Types](#typescript-types)
- [@timelang/suggest](#timelangsuggest)
  - [Features](#suggest-features)
  - [Installation](#suggest-installation)
  - [API Reference](#suggest-api)
  - [Options](#suggest-options)
  - [TypeScript Types](#suggest-typescript-types)
- [License](#license)

## Packages

| Package | Description |
|---------|-------------|
| [@timelang/parse](#timelangparse) | Parse natural language time expressions into dates, durations, and ranges |
| [@timelang/suggest](#timelangsuggest) | Autocomplete suggestions for time expressions |

## Quick Start

### @timelang/parse Quick Start

```bash
npm install @timelang/parse
```

```javascript
import { parse, parseDate, parseDuration, parseSpan, scan } from '@timelang/parse';

parseDate('next friday at 3pm');        // Date
parseDuration('2h 30m');                // 9000000 (milliseconds)
parseSpan('jan 5 to jan 20');           // { start: Date, end: Date, duration: number }

parse('Team Sync - next monday');       // { type: 'date', date, title: 'Team Sync' }
parse('mid Q1');                        // { type: 'fuzzy', start, end, approximate: true }

scan("let's meet next monday at 530pm");
// [{ result: {...}, match: 'next monday at 530pm', start: 11, end: 31 }]
```

### @timelang/suggest Quick Start

```bash
npm install @timelang/suggest
```

```javascript
import { suggest, suggestTime } from '@timelang/suggest';

// Get date/time suggestions as user types
suggest('tom');
// [
//   { label: 'tomorrow at 9am', date: Date },
//   { label: 'tomorrow at 2pm', date: Date },
//   { label: 'tomorrow', date: Date },
//   ...
// ]

suggest('next');
// [
//   { label: 'next week', date: Date },
//   { label: 'next month', date: Date },
//   { label: 'next monday', date: Date },
//   ...
// ]

// Get time-only suggestions
suggestTime('9');
// [
//   { label: '09:00 am', hour: 9, minute: 0, period: 'am' },
//   { label: '09:15 am', hour: 9, minute: 15, period: 'am' },
//   { label: '09:00 pm', hour: 9, minute: 0, period: 'pm' },
//   ...
// ]
```

# @timelang/parse

Parse natural language time expressions into dates, durations, and ranges.

## Features

- **Flexible inputs** — `tomorrow`, `next friday at 3pm`, `jan 5 to jan 20`, `2 weeks`
- **Fuzzy periods** — `mid Q1`, `early january`, `end of month`
- **Title extraction** — Gets `Team Sync` and date from `Team Sync - next monday`
- **Multiple formats** — `jan 5`, `5th jan`, `january 5th`, `2025-01-05`
- **Forgiving parser** — Extra spaces, mixed case, missing separators all work
- **Edge case handling** — Year rollovers, leap years, fiscal quarters
- **Configurable** — Reference date, fiscal year start, week start day, date format
- **TypeScript** — Typesafe with full type definitions

## Installation

```bash
npm install @timelang/parse
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

# @timelang/suggest

Autocomplete suggestions for time expressions. Perfect for building date/time picker inputs with natural language support.

## Suggest Features

- **Smart matching** — Fuzzy matching with abbreviation support (`tom` → `tomorrow`, `nxt` → `next`)
- **Multiple modes** — Date-only, time-only, or datetime suggestions
- **Configurable sorting** — Sort by closest, future-only, or past-only dates
- **Date constraints** — Filter suggestions by min/max date
- **Business hours priority** — Business hour times (9am-5pm) ranked higher
- **Time suggestions** — Dedicated time picker with configurable step intervals

## Suggest Installation

```bash
npm install @timelang/suggest
```

## Suggest API

### `suggest(input, options?)`

Returns an array of date/time suggestions based on user input.

```typescript
import { suggest } from '@timelang/suggest';

// Empty input returns sensible defaults
suggest('');
// [
//   { label: 'tomorrow at 9am', date: Date },
//   { label: 'tomorrow at 2pm', date: Date },
//   { label: 'day after tomorrow', date: Date },
//   { label: 'this week', date: Date },
//   ...
// ]

// Partial input matching
suggest('tom');
// [
//   { label: 'tomorrow at 9am', date: Date },
//   { label: 'tomorrow at 2pm', date: Date },
//   { label: 'tomorrow', date: Date },
//   ...
// ]

suggest('next');
// [
//   { label: 'next week', date: Date },
//   { label: 'next month', date: Date },
//   { label: 'next monday', date: Date },
//   { label: 'next tuesday', date: Date },
//   ...
// ]

// Abbreviations are expanded
suggest('mon');      // matches 'monday', 'next monday', etc.
suggest('tmrw');     // matches 'tomorrow'
suggest('wk');       // matches 'this week', 'next week', etc.

// Multi-word matching
suggest('next fri');
// [
//   { label: 'next friday', date: Date },
//   { label: 'next friday at 9am', date: Date },
//   ...
// ]

// Date-only mode (no time expressions)
suggest('tom', { mode: 'date' });
// [
//   { label: 'tomorrow', date: Date },
//   { label: 'day after tomorrow', date: Date },
//   ...
// ]

// Time-only mode
suggest('', { mode: 'time' });
// [
//   { label: 'now', date: Date },
//   { label: 'in an hour', date: Date },
//   { label: 'in 30 minutes', date: Date },
//   ...
// ]

// Filter by date range
suggest('next', { minDate: new Date('2025-01-01'), maxDate: new Date('2025-12-31') });

// Sort preference
suggest('', { sortPreference: 'future' });  // Future dates first
suggest('', { sortPreference: 'past' });    // Past dates first
suggest('', { sortPreference: 'closest' }); // Closest to reference date (default)
```

### `suggestTime(input, options?)`

Returns time-only suggestions for time picker inputs.

```typescript
import { suggestTime } from '@timelang/suggest';

// Empty input returns times at step intervals, business hours first
suggestTime('');
// [
//   { label: '09:00 am', hour: 9, minute: 0, period: 'am' },
//   { label: '09:15 am', hour: 9, minute: 15, period: 'am' },
//   { label: '09:30 am', hour: 9, minute: 30, period: 'am' },
//   ...
// ]

// Partial hour input
suggestTime('9');
// [
//   { label: '09:00 am', hour: 9, minute: 0, period: 'am' },
//   { label: '09:15 am', hour: 9, minute: 15, period: 'am' },
//   { label: '09:00 pm', hour: 9, minute: 0, period: 'pm' },
//   ...
// ]

// With partial minutes
suggestTime('93');  // 9:3x
// [
//   { label: '09:30 am', hour: 9, minute: 30, period: 'am' },
//   { label: '09:30 pm', hour: 9, minute: 30, period: 'pm' },
//   ...
// ]

// Colon format
suggestTime('9:30');
// [
//   { label: '09:30 am', hour: 9, minute: 30, period: 'am' },
//   { label: '09:30 pm', hour: 9, minute: 30, period: 'pm' },
// ]

// With AM/PM
suggestTime('9p');
// [
//   { label: '09:00 pm', hour: 9, minute: 0, period: 'pm' },
//   { label: '09:15 pm', hour: 9, minute: 15, period: 'pm' },
//   ...
// ]

// 24-hour format
suggestTime('14', { format: '24h' });
// [
//   { label: '14:00', hour: 14, minute: 0 },
//   { label: '14:15', hour: 14, minute: 15 },
//   ...
// ]

// Custom step interval
suggestTime('9', { step: 30 });
// [
//   { label: '09:00 am', hour: 9, minute: 0, period: 'am' },
//   { label: '09:30 am', hour: 9, minute: 30, period: 'am' },
//   ...
// ]
```

## Suggest Options

### SuggestOptions

```typescript
interface SuggestOptions {
  referenceDate?: Date;       // Default: new Date()
  limit?: number;             // Max suggestions to return (default: 5)
  mode?: SuggestMode;         // 'date' | 'datetime' | 'time' (default: 'datetime')
  minDate?: Date;             // Filter out dates before this
  maxDate?: Date;             // Filter out dates after this
  sortPreference?: SortPreference;  // 'closest' | 'future' | 'past' (default: 'closest')
}
```

### SuggestTimeOptions

```typescript
interface SuggestTimeOptions {
  step?: number;              // Minute step interval (default: 15)
  limit?: number;             // Max suggestions to return (default: 10)
  format?: TimeFormat;        // '12h' | '24h' (default: '12h')
}
```

## Suggest TypeScript Types

```typescript
interface Suggestion {
  label: string;  // The suggestion text (e.g., 'tomorrow at 9am')
  date: Date;     // The parsed date
}

interface TimeSuggestion {
  label: string;              // The formatted time (e.g., '09:30 am')
  hour: number;               // Hour (12h or 24h depending on format)
  minute: number;             // Minute
  period?: 'am' | 'pm';       // Only present when format is '12h'
}

type SuggestMode = 'date' | 'datetime' | 'time';
type SortPreference = 'closest' | 'future' | 'past';
type TimeFormat = '12h' | '24h';
```

## License

MIT

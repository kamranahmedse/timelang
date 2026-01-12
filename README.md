# timelang

Parse natural language time expressions into structured data. Turn user input like "next friday at 3pm" or "last 30 days" into dates you can work with.

## Installation

```bash
npm install timelang
```

## Why timelang?

Your users don't think in timestamps. They think in "tomorrow", "next week", and "Q1 2025". timelang bridges that gap.

```typescript
// Instead of building date pickers for every input...
parseDate('tomorrow at 9am');           // Set a reminder
parseDate('next monday');               // Schedule a meeting
parseDate('in 2 weeks');                // Set a due date

// Instead of manual date math...
parseDuration('2h 30m');                // Timer duration
parseDuration('45 minutes');            // Session timeout

// Instead of two date pickers for ranges...
parseSpan('jan 15 to jan 30');          // Vacation dates
parseSpan('next week');                 // Weekly report range
parseSpan('Q1 2025');                   // Quarterly planning

// Instead of complex input parsing...
extract('Kickoff - Jan 5, Sprint 1 - Jan 6 to Jan 19, Launch - Feb 1');
// Returns all three as structured data
```

## Real-World Examples

### Task Management

```typescript
import { parseDate, parseDuration } from 'timelang';

// User types due date naturally
const dueDate = parseDate('friday');
const urgent = parseDate('end of day');
const followUp = parseDate('in 3 days');

// Estimate task duration
const estimate = parseDuration('2 hours');
const sprint = parseDuration('2 weeks');
```

### Calendar Events

```typescript
import { parseSpan, parseDate } from 'timelang';

// "Block 2pm-4pm tomorrow for deep work"
const meeting = parseSpan('tomorrow 2pm to 4pm');
// { start: Date, end: Date, duration: 7200000 }

// Recurring events
const weeklySync = parseDate('next monday at 10am');
const monthlyReview = parseDate('first friday of next month');
```

### Analytics Dashboards

```typescript
import { parseSpan } from 'timelang';

// Date range filters users actually want
const lastWeek = parseSpan('last 7 days');
const thisMonth = parseSpan('this month');
const lastQuarter = parseSpan('Q4 2024');
const ytd = parseSpan('january 1 to today');
const custom = parseSpan('march 15 to april 30');
```

### Project Planning

```typescript
import { parse, extract } from 'timelang';

// Sprint planning
const sprint = parse('Sprint 1 - Jan 6 to Jan 19');
// { type: 'span', title: 'Sprint 1', start: Date, end: Date, duration: ... }

// Parse entire roadmap
const milestones = extract(`
  Design Phase - Jan 1 to Jan 15,
  Development - Jan 16 to Feb 28,
  Testing - March 1-15,
  Launch - March 20
`);
// Returns array of 4 parsed results with titles
```

### Reminders & Notifications

```typescript
import { parseDate, parseDuration } from 'timelang';

// "Remind me in 30 minutes"
const reminderTime = parseDate('in 30 minutes');

// "Snooze for 1 hour"
const snoozeMs = parseDuration('1 hour');
setTimeout(showReminder, snoozeMs);

// Natural language scheduling
const standup = parseDate('tomorrow at 9am');
const deadline = parseDate('end of month');
const nextReview = parseDate('in 2 weeks');
```

### Booking Systems

```typescript
import { parseSpan, parseDate } from 'timelang';

// Hotel booking
const stay = parseSpan('december 20 to december 27');

// Appointment slots
const appointment = parseDate('next thursday at 2pm');

// Availability windows
const available = parseSpan('monday to friday 9am to 5pm');
```

### Time Tracking

```typescript
import { parseDuration } from 'timelang';

// Log time entries naturally
const worked = parseDuration('2h 15m');
const breakTime = parseDuration('45 minutes');
const overtime = parseDuration('1.5 hours');

// Parse user input
const timeEntry = parseDuration('one and a half hours'); // 5400000ms
```

### Billing & Subscriptions

```typescript
import { parseSpan, parseDuration } from 'timelang';

// Billing periods
const billingCycle = parseSpan('this month');
const trialPeriod = parseDuration('14 days');

// Fiscal quarters (configurable start month)
const q1 = parseSpan('Q1', { fiscalYearStart: 'april' });
// April 1 - June 30 for fiscal year starting in April
```

## API

### `parse(input, options?)`

Main function. Returns a discriminated union based on detected type.

```typescript
parse('next friday');           // { type: 'date', date: Date, title: null }
parse('2 weeks');               // { type: 'duration', duration: 1209600000, title: null }
parse('jan 5 to jan 20');       // { type: 'span', start: Date, end: Date, ... }
parse('mid Q1');                // { type: 'fuzzy', start: Date, end: Date, approximate: true, ... }
parse('Meeting - tomorrow');    // { type: 'date', date: Date, title: 'Meeting' }
parse('garbage');               // null
```

### `parseDate(input, options?)`

Returns a Date. Works with date expressions and durations (treated as relative dates).

```typescript
parseDate('tomorrow');          // Date (tomorrow at midnight)
parseDate('next friday at 3pm');// Date
parseDate('2 weeks');           // Date (2 weeks from now)
parseDate('in 30 minutes');     // Date
parseDate('jan 5 to jan 20');   // null (not a single date)
```

### `parseDuration(input, options?)`

Returns duration in milliseconds.

```typescript
parseDuration('2 weeks');       // 1209600000
parseDuration('2h 30m');        // 9000000
parseDuration('1.5 days');      // 129600000
parseDuration('tomorrow');      // null (not a duration)
```

### `parseSpan(input, options?)`

Returns start date, end date, and duration for ranges and periods.

```typescript
parseSpan('jan 5 to jan 20');   // { start: Date, end: Date, duration: number }
parseSpan('last 30 days');      // { start: Date, end: Date, duration: number }
parseSpan('Q1 2025');           // { start: Date, end: Date, duration: number }
parseSpan('this week');         // { start: Date, end: Date, duration: number }
parseSpan('tomorrow');          // null (not a span)
```

### `extract(input, options?)`

Extracts multiple time expressions from text.

```typescript
extract('Sprint 1 - Jan 5 to Jan 19, Sprint 2 - Jan 20 to Feb 2');
// [
//   { type: 'span', title: 'Sprint 1', start: Date, end: Date, ... },
//   { type: 'span', title: 'Sprint 2', start: Date, end: Date, ... }
// ]

extract('Call at 2pm, Meeting at 4pm, Dinner at 7pm');
// [
//   { type: 'date', title: 'Call', date: Date, ... },
//   { type: 'date', title: 'Meeting', date: Date, ... },
//   { type: 'date', title: 'Dinner', date: Date, ... }
// ]
```

## Supported Formats

### Dates
- Relative: `today`, `tomorrow`, `yesterday`, `day after tomorrow`
- Weekdays: `monday`, `next friday`, `last tuesday`, `this wednesday`
- Month + Day: `march 15`, `15th march`, `march 15th 2025`
- With time: `tomorrow at 3pm`, `next monday at 9:30am`
- ISO format: `2025-03-15`

### Durations
- Basic: `3 days`, `2 weeks`, `1 month`, `6 hours`
- Abbreviated: `1d`, `2w`, `3m`, `1y`, `2h`, `30min`
- Word numbers: `one week`, `two days`, `a month`
- Fractional: `1.5 days`, `half a week`, `quarter hour`
- Combined: `1 week and 2 days`, `2h 30m`, `1 hour 45 minutes`

### Ranges
- To pattern: `jan 5 to jan 20`
- From-to: `from march 1 to march 15`
- Dash: `January 1 - January 15`, `July10-July15`
- Between: `between feb 1 and feb 14`
- Through: `january 1 through january 15`

### Timespans
- Date + duration: `july 3rd for 10 days`
- Starting pattern: `starting march 1 for 2 weeks`

### Periods
- Relative: `this week`, `next month`, `last year`
- Quarters: `Q1`, `Q1 2025`, `first quarter`
- Modifiers: `early Q1`, `mid january`, `late 2025`, `end of month`
- Seasons: `spring`, `summer 2025`

### Relative Durations
- Past: `last 30 days`, `past 2 weeks`
- Future: `next 30 days`, `coming 2 weeks`
- Within: `within 30 days`

### With Titles
- Dash: `Team Sync - next monday at 10am`
- Colon: `Sprint 1: jan 5 to jan 19`
- Parenthetical: `Meeting (Jan 15 at 2pm)`

## Options

```typescript
interface ParseOptions {
  referenceDate?: Date;    // Default: new Date()
  fiscalYearStart?: 'january' | 'april' | 'july' | 'october';
  weekStartsOn?: 'sunday' | 'monday';
  dateFormat?: 'us' | 'intl' | 'auto';
}
```

### `referenceDate`

The date used as "today" for relative calculations. Essential for testing and consistent results.

```typescript
const ref = new Date('2025-06-15');
parseDate('tomorrow', { referenceDate: ref }); // June 16, 2025
parseDate('next week', { referenceDate: ref }); // June 22, 2025
```

### `fiscalYearStart`

Determines when Q1 starts. Default is `'january'`.

```typescript
// Calendar year (default)
parseSpan('Q1'); // Jan 1 - Mar 31

// Fiscal year starting in April (UK, Japan, etc.)
parseSpan('Q1', { fiscalYearStart: 'april' }); // Apr 1 - Jun 30

// Fiscal year starting in July (Australia, etc.)
parseSpan('Q1', { fiscalYearStart: 'july' }); // Jul 1 - Sep 30
```

### `weekStartsOn`

Determines which day is the start of the week. Default is `'sunday'`.

```typescript
parseSpan('this week', { weekStartsOn: 'sunday' });  // Sun-Sat
parseSpan('this week', { weekStartsOn: 'monday' });  // Mon-Sun
```

### `dateFormat`

How to interpret ambiguous date formats like `01/02/2025`. Default is `'intl'`.

- `'us'` - MM/DD/YYYY (01/02/2025 = January 2nd)
- `'intl'` - DD/MM/YYYY (01/02/2025 = February 1st)
- `'auto'` - Attempt to infer, may return null if ambiguous

ISO 8601 format (YYYY-MM-DD) always works regardless of this option.

## Return Types

```typescript
type ParseResult = DateResult | DurationResult | SpanResult | FuzzyResult;

interface DateResult {
  type: 'date';
  date: Date;
  title: string | null;
}

interface DurationResult {
  type: 'duration';
  duration: number; // milliseconds
  title: string | null;
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
```

## Browser Support

Works in both Node.js and browsers. No Node.js-specific APIs are used.

## License

MIT

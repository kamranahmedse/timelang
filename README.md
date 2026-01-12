# timelang

Parse natural language time expressions into dates. "next friday", "last 30 days", "Q1 2025" — that kind of thing.

```bash
npm install timelang
```

## Why I built this

I needed natural language date input for [plan.fyi](https://plan.fyi). Users type things like "Team sync - next monday at 10am" or "Sprint 1: Jan 6 to Jan 19" and expect it to just work.

Existing libraries either couldn't handle ranges, didn't extract titles, or fell apart on edge cases. So I built timelang to handle the messy inputs real users type.

## What it handles

```typescript
import { parse, parseDate, parseDuration, parseSpan, extract } from 'timelang';

// Single dates
parseDate('tomorrow');              // Date
parseDate('next friday at 3pm');    // Date
parseDate('march 15th');            // Date

// Durations
parseDuration('2 weeks');           // 1209600000 (milliseconds)
parseDuration('2h 30m');            // 9000000
parseDuration('one and a half hours'); // 5400000

// Ranges
parseSpan('jan 5 to jan 20');       // { start, end, duration }
parseSpan('last 30 days');          // { start, end, duration }
parseSpan('Q1 2025');               // { start, end, duration }

// With titles
parse('Team Sync - next monday');
// { type: 'date', date: Date, title: 'Team Sync' }

// Multiple items
extract('Kickoff - Jan 5, Sprint 1 - Jan 6 to Jan 19, Launch - Feb 1');
// Returns array of 3 parsed results with titles
```

## How good is it?

Pretty good. It handles:

- **Fuzzy inputs**: "mid Q1", "early january", "end of month", "first half of 2025"
- **Sloppy formatting**: Extra spaces, mixed case, missing separators
- **Edge cases**: Year rollovers, leap years, fiscal year quarters
- **Multiple formats**: "jan 5", "5th jan", "january 5th", "2025-01-05"
- **Title extraction**: Pulls out "Team Sync" from "Team Sync - next monday"

It returns `null` for garbage input instead of guessing wrong.

```typescript
parse('asdfasdf');        // null
parseDate('february 30'); // null (invalid date)
parseSpan('tomorrow');    // null (not a span)
```

## Real examples

### Project planning

```typescript
const milestones = extract(`
  Design Phase - Jan 1 to Jan 15,
  Development - Jan 16 to Feb 28,
  Testing - March 1-15,
  Launch - March 20
`);
// 4 results, each with title, dates, and type
```

### Analytics date picker

```typescript
parseSpan('last 7 days');    // quick filter
parseSpan('this month');     // quick filter
parseSpan('Q4 2024');        // quarterly report
parseSpan('ytd');            // year to date
```

### Reminders

```typescript
parseDate('in 30 minutes');
parseDate('tomorrow at 9am');
parseDate('end of day');
```

### Time tracking

```typescript
parseDuration('2h 15m');       // 8100000
parseDuration('45 minutes');   // 2700000
parseDuration('1.5 hours');    // 5400000
```

### Fiscal quarters

```typescript
// Different companies start fiscal years differently
parseSpan('Q1', { fiscalYearStart: 'april' });  // Apr-Jun (UK, Japan)
parseSpan('Q1', { fiscalYearStart: 'july' });   // Jul-Sep (Australia)
```

## API

### `parse(input, options?)`

Returns a typed result based on what it detects.

```typescript
parse('next friday');        // { type: 'date', date, title }
parse('2 weeks');            // { type: 'duration', duration, title }
parse('jan 5 to jan 20');    // { type: 'span', start, end, duration, title }
parse('mid Q1');             // { type: 'fuzzy', start, end, approximate: true, title }
parse('garbage');            // null
```

### `parseDate(input, options?)`

Just gives you a Date or null.

### `parseDuration(input, options?)`

Duration in milliseconds or null.

### `parseSpan(input, options?)`

Start, end, and duration or null.

### `extract(input, options?)`

Array of parsed results from comma/semicolon separated input.

## Options

```typescript
{
  referenceDate: new Date(),     // what "today" means
  fiscalYearStart: 'january',    // when Q1 starts
  weekStartsOn: 'sunday',        // for "this week" calculations
  dateFormat: 'intl'             // 'intl' = DD/MM, 'us' = MM/DD
}
```

## Supported formats

| Category               | Examples                                                            |
|------------------------|---------------------------------------------------------------------|
| **Dates**              |                                                                     |
| Relative               | `today`, `tomorrow`, `yesterday`, `day after tomorrow`              |
| Weekdays               | `monday`, `next friday`, `last tuesday`, `this wednesday`           |
| Month + Day            | `march 15`, `15th march`, `march 15th 2025`                         |
| With time              | `tomorrow at 3pm`, `next monday at 9:30am`                          |
| ISO format             | `2025-03-15`                                                        |
| **Durations**          |                                                                     |
| Basic                  | `3 days`, `2 weeks`, `1 month`, `6 hours`                           |
| Abbreviated            | `1d`, `2w`, `3mo`, `1y`, `2h`, `30m` (`m` = minutes, `mo` = months) |
| Word numbers           | `one week`, `two days`, `a month`                                   |
| Fractional             | `1.5 days`, `half a week`, `quarter hour`                           |
| Combined               | `1 week and 2 days`, `2h 30m`, `1 hour 45 minutes`                  |
| **Ranges**             |                                                                     |
| To pattern             | `jan 5 to jan 20`                                                   |
| From-to                | `from march 1 to march 15`                                          |
| Dash                   | `January 1 - January 15`, `July10-July15`                           |
| Between                | `between feb 1 and feb 14`                                          |
| Through                | `january 1 through january 15`                                      |
| **Timespans**          |                                                                     |
| Date + duration        | `july 3rd for 10 days`                                              |
| Starting pattern       | `starting march 1 for 2 weeks`                                      |
| **Periods**            |                                                                     |
| Relative               | `this week`, `next month`, `last year`                              |
| Quarters               | `Q1`, `Q1 2025`, `first quarter`                                    |
| Modifiers              | `early Q1`, `mid january`, `late 2025`, `end of month`              |
| Seasons                | `spring`, `summer 2025`                                             |
| **Relative durations** |                                                                     |
| Past                   | `last 30 days`, `past 2 weeks`                                      |
| Future                 | `next 30 days`, `coming 2 weeks`                                    |
| Within                 | `within 30 days`                                                    |
| **With titles**        |                                                                     |
| Dash                   | `Team Sync - next monday at 10am`                                   |
| Colon                  | `Sprint 1: jan 5 to jan 19`                                         |
| Parenthetical          | `Meeting (Jan 15 at 2pm)`                                           |

## License

MIT

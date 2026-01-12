# timelang

Parse natural language time expressions into structured data.

## Installation

```bash
npm install timelang
```

## Quick Start

```typescript
import { parse } from 'timelang';

parse('next friday');
// { type: 'date', date: Date, title: null }

parse('2 weeks');
// { type: 'duration', duration: 1209600000, title: null }

parse('july 3rd for 10 days');
// { type: 'span', start: Date, end: Date, duration: 864000000, title: null }

parse('Engineering meeting - July 10 to July 15');
// { type: 'span', start: Date, end: Date, duration: ..., title: 'Engineering meeting' }
```

## API

### `parse(input, options?)`

Main parsing function. Returns a discriminated union based on the detected expression type.

```typescript
import { parse } from 'timelang';

// Returns ParseResult | null
const result = parse('next monday');
```

### `parseDate(input, options?)`

Returns only the Date if the input is a date expression.

```typescript
import { parseDate } from 'timelang';

parseDate('tomorrow');        // Date
parseDate('2 weeks');         // null (not a date)
```

### `parseDuration(input, options?)`

Returns duration in milliseconds if the input is a duration expression.

```typescript
import { parseDuration } from 'timelang';

parseDuration('2 weeks');     // 1209600000
parseDuration('tomorrow');    // null (not a duration)
```

### `parseSpan(input, options?)`

Returns start, end, and duration if the input is a span or range.

```typescript
import { parseSpan } from 'timelang';

parseSpan('jan 5 to jan 20');
// { start: Date, end: Date, duration: number }
```

### `extract(input, options?)`

Extracts multiple time expressions from text.

```typescript
import { extract } from 'timelang';

extract('Sprint 1 - Jan 5 to Jan 19, Sprint 2 - Jan 20 to Feb 2');
// [{ type: 'span', title: 'Sprint 1', ... }, { type: 'span', title: 'Sprint 2', ... }]
```

## Supported Formats

### Dates
- Relative: `today`, `tomorrow`, `yesterday`
- Weekdays: `monday`, `next friday`, `last tuesday`
- Month + Day: `march 15`, `15th march`, `march 15th 2025`
- ISO format: `2025-03-15`

### Durations
- Basic: `3 days`, `2 weeks`, `1 month`
- Abbreviated: `1d`, `2w`, `3m`, `1y`
- Word numbers: `one week`, `two days`
- Fractional: `1.5 days`, `half a week`
- Combined: `1 week and 2 days`, `2h 30m`

### Ranges
- To pattern: `jan 5 to jan 20`
- From-to: `from march 1 to march 15`
- Dash: `January 1 - January 15`, `July10-July15`
- Between: `between feb 1 and feb 14`
- Through: `january 1 through january 15`

### Timespans
- Date + duration: `july 3rd for 10 days`
- Starting pattern: `starting march 1 for 2 weeks`

### Fuzzy Periods
- Quarters: `Q1`, `Q1 2025`, `first quarter`
- Modifiers: `early Q1`, `mid january`, `late 2025`
- Seasons: `spring`, `summer 2025`

### Relative Durations
- Past: `last 30 days`, `past 2 weeks`
- Future: `next 30 days`, `coming 2 weeks`
- Within: `within 30 days`, `within the next month`

### With Titles
- Dash: `Engineering meeting - July 10 to July 15`
- Colon: `Sprint 1: jan 5 to jan 19`
- Parenthetical: `Meeting with Team (Jan 15)`

## Options

```typescript
interface ParseOptions {
  referenceDate?: Date;           // Default: new Date()
  fiscalYearStart?: 'january' | 'april' | 'july' | 'october';
  weekStartsOn?: 'sunday' | 'monday';
  dateFormat?: 'us' | 'intl' | 'auto';
}
```

### `referenceDate`

The date used as "today" for relative calculations.

```typescript
parse('next friday', { referenceDate: new Date('2025-01-15') });
```

### `fiscalYearStart`

Determines which month Q1 starts in.

```typescript
parse('Q1', { fiscalYearStart: 'april' }); // April-June
```

### `weekStartsOn`

Determines which day is the start of the week.

```typescript
parse('this week', { weekStartsOn: 'monday' });
```

### `dateFormat`

How to interpret ambiguous date formats like `01/02/2025`.

- `'us'` - MM/DD/YYYY (January 2nd)
- `'intl'` - DD/MM/YYYY (February 1st)
- `'auto'` - Attempt to infer

## Return Types

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

type ParseResult = DateResult | DurationResult | SpanResult | FuzzyResult;
```

## Browser Support

Works in both Node.js and browsers. No Node.js-specific APIs are used.

## License

MIT

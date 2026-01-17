# @timelang/suggest

Smart autocomplete suggestions for date and time inputs.

## Installation

```bash
npm install @timelang/suggest
```

## Usage

```typescript
import { suggest } from '@timelang/suggest'

const suggestions = suggest('tom')
// → [
//   { label: 'tomorrow', date: Date },
//   { label: 'tomorrow morning', date: Date },
//   { label: 'tomorrow afternoon', date: Date },
//   ...
// ]
```

The `suggest` function returns an array of suggestions, each with a `label` (the suggestion text) and a `date` (the resolved Date object).

## Time-Only Suggestions

For dedicated time input fields, use `suggestTime` which provides time suggestions without dates:

```typescript
import { suggestTime } from '@timelang/suggest'

const suggestions = suggestTime('9')
// → [
//   { label: '09:00 am', hour: 9, minute: 0, period: 'am' },
//   { label: '09:00 pm', hour: 9, minute: 0, period: 'pm' },
//   ...
// ]

// Supports various input formats:
suggestTime('930')   // 9:30
suggestTime('750pm') // 7:50 PM
suggestTime('14')    // 14:00 (2 PM)
```

### Time Options

```typescript
suggestTime(input, {
  step: 15,       // Minute intervals (default: 15)
  limit: 10,      // Maximum suggestions (default: 10)
  format: '12h',  // '12h' or '24h' (default: '12h')
})
```

#### `step`

Controls the minute intervals for suggestions. Defaults to 15 minutes.

```typescript
suggestTime('9', { step: 30 })
// → 9:00, 9:30, 10:00, 10:30...

suggestTime('9', { step: 5 })
// → 9:00, 9:05, 9:10, 9:15...
```

#### `format`

Controls the output format and the values in the returned suggestions:

- `'12h'` (default) - Returns hour as 1-12 with `period` ('am' | 'pm')
- `'24h'` - Returns hour as 0-23, no `period` field

```typescript
// 12-hour format (default)
suggestTime('9', { format: '12h' })
// → { label: '09:00 am', hour: 9, minute: 0, period: 'am' }

// 24-hour format
suggestTime('9', { format: '24h' })
// → { label: '09:00', hour: 9, minute: 0 }
```

## Options

```typescript
suggest(input, {
  referenceDate: new Date(),  // Base date for resolving expressions
  limit: 5,                   // Maximum suggestions (default: 5)
  mode: 'datetime',           // 'date' | 'datetime' | 'time'
  minDate: new Date(),        // Filter out dates before this
  maxDate: new Date(),        // Filter out dates after this
  sortPreference: 'closest',  // 'closest' | 'future' | 'past'
})
```

### `referenceDate`

The base date used for resolving relative expressions like "tomorrow" or "next week".

```typescript
suggest('tomorrow', { referenceDate: new Date('2025-03-15') })
// Resolves relative to March 15, 2025
```

### `limit`

Maximum number of suggestions to return. Defaults to 5.

```typescript
suggest('next', { limit: 10 })
```

### `mode`

Controls which types of suggestions are returned:

- `'datetime'` (default) - All suggestions
- `'date'` - Only date-based suggestions (excludes time-only like "in 2 hours")
- `'time'` - Only time-based suggestions (excludes date-only like "next week")

```typescript
suggest('next', { mode: 'date' })
// Returns: next monday, next tuesday, next week...
// Excludes: next hour, in 30 minutes...
```

### `minDate` / `maxDate`

Constrain suggestions to a date range. Suggestions outside this range are filtered out.

```typescript
// Future dates only
suggest('', { minDate: new Date() })

// Past dates only
suggest('', { maxDate: new Date() })

// Within a specific range
suggest('', {
  minDate: new Date('2025-01-01'),
  maxDate: new Date('2025-12-31')
})
```

### `sortPreference`

Controls how suggestions are ordered:

- `'closest'` (default) - Sorts by distance from reference date
- `'future'` - Prioritizes future dates, then sorts chronologically
- `'past'` - Prioritizes past dates, then sorts reverse chronologically

```typescript
// Show future dates first
suggest('', { sortPreference: 'future' })

// Show past dates first
suggest('', { sortPreference: 'past' })
```

## Smart Matching

The suggest function handles abbreviations and partial matches:

| Input | Matches |
|-------|---------|
| `tom` | tomorrow, tomorrow morning... |
| `mon` | monday, next monday... |
| `5 day` | 5 days ago, 5 days from now |
| `next` | next monday, next tuesday, next week... |

## Types

```typescript
// suggest() types
interface Suggestion {
  label: string
  date: Date
}

type SuggestMode = 'date' | 'datetime' | 'time'
type SortPreference = 'closest' | 'future' | 'past'

interface SuggestOptions {
  referenceDate?: Date
  limit?: number
  mode?: SuggestMode
  minDate?: Date
  maxDate?: Date
  sortPreference?: SortPreference
  step?: number // minute step for time suggestions (default: 15)
}

// suggestTime() types
interface TimeSuggestion {
  label: string
  hour: number       // 1-12 for '12h' format, 0-23 for '24h' format
  minute: number
  period?: 'am' | 'pm'  // Only present when format is '12h'
}

type TimeFormat = '12h' | '24h'

interface SuggestTimeOptions {
  step?: number      // Minute intervals (default: 15)
  limit?: number     // Maximum suggestions (default: 10)
  format?: TimeFormat  // '12h' or '24h' (default: '12h')
}
```

## License

MIT

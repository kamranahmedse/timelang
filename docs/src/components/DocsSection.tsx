import { CodeBlock } from './CodeBlock'

export function DocsSection() {
  return (
    <section id="docs" className="py-12">
      <h2 className="text-lg font-bold text-zinc-100 mb-2">Usage</h2>
      <p className="text-zinc-500 text-sm mb-6">
        Use <code className="text-zinc-400">parse()</code> for automatic type detection, or one of the specific functions if you know what to expect.
      </p>

      <CodeBlock code={`import { parse } from '@timelang/parse'

// Dates
parse('next friday')
parse('tomorrow at 3pm')
parse('march 15th 2025')
// → { type: 'date', date: Date, title: null }

// Durations
parse('2 weeks')
parse('1h 30m')
// → { type: 'duration', duration: 1209600000, title: null }

// Time spans
parse('jan 5 to jan 20')
parse('last 30 days')
parse('next monday for 2 weeks')
// → { type: 'span', start: Date, end: Date, duration: number, title: null }

// With titles
parse('Team offsite - March 10 to March 14')
parse('Sprint 1: jan 5 to jan 19')
// → { type: 'span', ..., title: 'Team offsite' }

// Fuzzy periods
parse('Q1 2025')
parse('early january')
parse('mid Q1')
// → { type: 'fuzzy', start: Date, end: Date, approximate: true }`} language="typescript" />

      <div className="mt-12">
        <h3 className="text-lg font-bold text-zinc-100 mb-4">Helpers</h3>
        <CodeBlock code={`import { parseDate, parseDuration, parseSpan, scan } from '@timelang/parse'

// Single dates
parseDate('tomorrow')              // Date
parseDate('next friday at 3pm')    // Date
parseDate('in 2 hours')            // Date

// Durations in milliseconds
parseDuration('2 weeks')           // 1209600000
parseDuration('2h 30m')            // 9000000

// Time spans
parseSpan('jan 5 to jan 20')       // { start, end, duration }
parseSpan('last 30 days')          // { start, end, duration }
parseSpan('this week')             // { start, end, duration }

// Scan for dates in prose text
scan('can we meet tomorrow at 5pm?')
// → [{ result: { type: 'date', ... }, match: 'tomorrow at 5pm', start: 12, end: 27 }]`} language="typescript" />
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-zinc-100 mb-2">Titles</h3>
        <p className="text-zinc-500 text-sm mb-4">
          Automatically extracts titles from expressions using common separators.
        </p>
        <CodeBlock code={`parse('Team offsite - March 10 to March 14')
// → { type: 'span', title: 'Team offsite', ... }

parse('Sprint 1: jan 5 to jan 19')
// → { type: 'span', title: 'Sprint 1', ... }

parse('Meeting with Team (Jan 15 at 2pm)')
// → { type: 'date', title: 'Meeting with Team', ... }

parse('Project Kickoff [March 1st]')
// → { type: 'date', title: 'Project Kickoff', ... }`} language="typescript" />
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-zinc-100 mb-4">Options</h3>
        <CodeBlock code={`parse('Q1', {
  referenceDate: new Date('2025-06-01'),
  fiscalYearStart: 'april',    // 'january' | 'april' | 'july' | 'october'
  weekStartsOn: 'monday',      // 'sunday' | 'monday'
  dateFormat: 'intl'           // 'us' | 'intl' | 'auto'
})`} language="typescript" />
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-zinc-100 mb-4">Types</h3>
        <CodeBlock code={`type ParseResult = DateResult | DurationResult | SpanResult | FuzzyResult | null

interface DateResult {
  type: 'date'
  date: Date
  title: string | null
}

interface DurationResult {
  type: 'duration'
  duration: number
  title: string | null
}

interface SpanResult {
  type: 'span'
  start: Date
  end: Date
  duration: number
  title: string | null
}

interface FuzzyResult {
  type: 'fuzzy'
  start: Date
  end: Date
  approximate: true
  title: string | null
}

interface ScanMatch {
  result: ParseResult
  match: string
  start: number
  end: number
}`} language="typescript" />
      </div>
    </section>
  )
}

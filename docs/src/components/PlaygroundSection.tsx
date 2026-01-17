import { parse, parseDate, parseDuration, parseSpan, scan } from '@timelang/parse'
import { FunctionCard } from './FunctionCard'

export function PlaygroundSection() {
  return (
    <section id="playground" className="py-12">
      <h2 className="text-lg font-bold text-zinc-100 mb-2">Playground</h2>
      <p className="text-zinc-500 mb-8 text-sm">Test each function individually.</p>

      <div className="space-y-4">
        <FunctionCard
          name="parse()"
          description="returns discriminated union"
          placeholder="tomorrow at 3pm, last 30 days, Q1 2025"
          fn={parse}
        />
        <FunctionCard
          name="parseDate()"
          description="returns Date | null"
          placeholder="next friday at 3pm, in 2 hours, end of month"
          fn={parseDate}
        />
        <FunctionCard
          name="parseDuration()"
          description="returns ms | null"
          placeholder="2 weeks, 1d 2h 30m, half a day"
          fn={parseDuration}
        />
        <FunctionCard
          name="parseSpan()"
          description="returns { start, end, duration } | null"
          placeholder="last 30 days, this week, jan 5 to jan 20"
          fn={parseSpan}
        />
        <FunctionCard
          name="scan()"
          description="returns array of matches with positions"
          placeholder="can we meet tomorrow at 5pm?"
          fn={scan}
        />
      </div>
    </section>
  )
}

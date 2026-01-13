import { useState, useMemo } from 'react'
import { parse } from 'timelang'
import { ExampleChip } from './example-chip'
import { ResultDisplay } from './result-display'

const EXAMPLES = [
  'tomorrow at 3pm',
  'in 2 hours',
  'last 30 days',
  'Q1 2025',
  'Team sync - next monday',
  'jan 15 to feb 1',
  'end of month',
  '2h 30m',
  'next friday at 3pm',
  'this month',
  'early january',
  'half an hour',
  'ytd',
  'next week for 3 days',
]

export function HeroDemo() {
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) {
      return undefined
    }
    try {
      return parse(input)
    } catch {
      return null
    }
  }, [input])

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Try: tomorrow at 3pm, last 30 days, Q1 2025..."
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-colors"
      />
      <div className="flex items-center gap-2 flex-wrap">
        {EXAMPLES.map((example) => (
          <ExampleChip key={example} onClick={() => setInput(example)}>
            {example}
          </ExampleChip>
        ))}
      </div>
      {input.trim() && (
        <div className="pt-2">
          <ResultDisplay result={result} />
        </div>
      )}
    </div>
  )
}

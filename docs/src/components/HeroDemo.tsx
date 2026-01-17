import { useState, useMemo } from 'react'
import { parse } from '@timelang/parse'
import { ExampleChip } from './ExampleChip'
import { ResultDisplay } from './ResultDisplay'

const EXAMPLES = [
  'tomorrow at 3pm',
  'next business day',
  'half past 4',
  'in a fortnight',
  'Q1 2025',
  'Team sync - next monday',
  'EOD Friday',
  'week 12',
  'quarter to 5',
  'later this week',
  '2 business days ago',
  'noon on Friday',
  'the week of March 15',
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
    <div className="space-y-3 max-w-xl mx-auto">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Try: half past 4, next business day, EOD Friday..."
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-colors"
      />
      <div className="flex items-center gap-2 flex-wrap justify-center">
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

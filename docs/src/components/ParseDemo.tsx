import { useState, useMemo } from 'react'
import { parse, scan } from '@timelang/parse'
import { ExampleChip } from './ExampleChip'

export function ParseDemo() {
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

  const examples = [
    'tomorrow at 3pm',
    'next friday',
    'last 30 days',
    'Q1 2025',
    'in 2 hours',
    '2 weeks',
    'jan 5 to jan 20',
    'Team meeting - Monday at 2pm',
  ]

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type anything: tomorrow, next week, Q1 2025..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
      />
      <div className="flex items-center gap-2 flex-wrap">
        {examples.map((example) => (
          <ExampleChip key={example} onClick={() => setInput(example)}>
            {example}
          </ExampleChip>
        ))}
      </div>
      {result !== undefined && (
        <div className="bg-zinc-800/50 rounded-lg p-4 text-sm">
          <pre className="text-zinc-300 overflow-x-auto">
            {result === null
              ? 'null'
              : JSON.stringify(result, (_, v) => (v instanceof Date ? v.toISOString() : v), 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

interface ResultTypeDemoProps {
  title: string
  description: string
  examples: string[]
  showResult: (result: ReturnType<typeof parse>) => string
}

export function ResultTypeDemo(props: ResultTypeDemoProps) {
  const { title, description, examples, showResult } = props
  const [input, setInput] = useState(examples[0])

  const result = useMemo(() => parse(input), [input])

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div>
        <h4 className="font-medium text-zinc-200">{title}</h4>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setInput(ex)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              input === ex
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="bg-zinc-800/50 rounded p-2 text-sm">
        <p className="text-zinc-400">
          Result: <span className="text-zinc-200">{showResult(result)}</span>
        </p>
      </div>
    </div>
  )
}

export function ScanDemo() {
  const [input, setInput] = useState('Can we meet tomorrow at 5pm?')

  const matches = useMemo(() => scan(input), [input])

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a sentence with dates..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
      />
      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">No dates found</p>
        ) : (
          matches.map((match, i) => (
            <div key={i} className="bg-zinc-800/50 rounded p-3 text-sm space-y-1">
              <p className="text-zinc-200">
                Found: <span className="text-yellow-400">"{match.match}"</span>
              </p>
              <p className="text-zinc-500">
                Position: {match.start}-{match.end}
              </p>
              {match.result && (
                <p className="text-zinc-400">
                  Type: {match.result.type}
                  {match.result.type === 'date' && ` → ${match.result.date.toLocaleString()}`}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function TitleDemo() {
  const examples = [
    'Team offsite - March 10 to March 14',
    'Sprint 1: jan 5 to jan 19',
    'Meeting with Team (Jan 15 at 2pm)',
    'Project Kickoff [March 1st]',
  ]
  const [selected, setSelected] = useState(examples[0])

  const result = useMemo(() => parse(selected), [selected])

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setSelected(ex)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              selected === ex
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {ex.length > 30 ? ex.slice(0, 30) + '...' : ex}
          </button>
        ))}
      </div>
      {result && (
        <div className="bg-zinc-800/50 rounded p-3 text-sm space-y-1">
          <p className="text-zinc-200">
            Title: <span className="text-yellow-400">{result.title || '(none)'}</span>
          </p>
          <p className="text-zinc-400">Type: {result.type}</p>
        </div>
      )}
    </div>
  )
}

interface CategoryExamplesProps {
  title: string
  examples: string[]
}

export function CategoryExamples(props: CategoryExamplesProps) {
  const { title, examples } = props
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-4 space-y-2">
      <h4 className="text-sm font-medium text-zinc-300">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {examples.map((ex) => (
          <code key={ex} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
            {ex}
          </code>
        ))}
      </div>
    </div>
  )
}

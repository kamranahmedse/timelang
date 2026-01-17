import { useState, useMemo } from 'react'
import { suggest, suggestTime, type SuggestMode, type TimeFormat, type TimeSuggestion } from '@timelang/suggest'

const MODES: { value: SuggestMode; label: string }[] = [
  { value: 'datetime', label: 'DateTime' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
]

const TIME_FORMATS: { value: TimeFormat; label: string }[] = [
  { value: '12h', label: '12h' },
  { value: '24h', label: '24h' },
]

export function SuggestDemo() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<SuggestMode>('datetime')
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h')

  const dateSuggestions = useMemo(() => {
    if (mode === 'time') {
      return []
    }
    return suggest(input, { limit: 6, sortPreference: 'future', mode })
  }, [input, mode])

  const timeSuggestions = useMemo(() => {
    if (mode !== 'time') {
      return []
    }
    return suggestTime(input, { limit: 6, step: 15, format: timeFormat })
  }, [input, mode, timeFormat])

  const formatHourMinute = (s: TimeSuggestion) => {
    const h = s.hour.toString().padStart(2, '0')
    const m = s.minute.toString().padStart(2, '0')
    if (s.period) {
      return `{ hour: ${h}, minute: ${m}, period: '${s.period}' }`
    }
    return `{ hour: ${h}, minute: ${m} }`
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === m.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === 'time' && (
          <div className="flex gap-1">
            {TIME_FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTimeFormat(f.value)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  timeFormat === f.value
                    ? 'bg-zinc-600 text-white'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'time' ? "Type a time: 9, 930, 2p..." : "Type anything: tom, next, 5 days, monday..."}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
      />
      <div className="space-y-1">
        {mode === 'time' ? (
          <>
            {timeSuggestions.length === 0 && input && (
              <p className="text-sm text-zinc-500">No suggestions</p>
            )}
            {timeSuggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg"
              >
                <span className="text-zinc-100">{s.label}</span>
                <code className="text-xs text-zinc-500 font-mono">
                  {formatHourMinute(s)}
                </code>
              </div>
            ))}
          </>
        ) : (
          <>
            {dateSuggestions.length === 0 && input && (
              <p className="text-sm text-zinc-500">No suggestions</p>
            )}
            {dateSuggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg"
              >
                <span className="text-zinc-100">{s.label}</span>
                <span className="text-xs text-zinc-500">
                  {s.date.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

interface MatchingExampleProps {
  input: string
  result: string
}

export function MatchingExample(props: MatchingExampleProps) {
  const { input, result } = props
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 flex items-center gap-3">
      <code className="text-sm text-yellow-400">"{input}"</code>
      <span className="text-zinc-500">→</span>
      <span className="text-sm text-zinc-300">{result}</span>
    </div>
  )
}

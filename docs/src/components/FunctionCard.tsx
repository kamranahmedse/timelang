import { useState, useMemo } from 'react'

interface FunctionCardProps {
  name: string
  description: string
  placeholder: string
  fn: (input: string) => unknown
}

export function FunctionCard(props: FunctionCardProps) {
  const { name, description, placeholder, fn } = props
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) {
      return null
    }
    try {
      return fn(input)
    } catch (e) {
      return { error: String(e) }
    }
  }, [input, fn])

  const formatResult = (value: unknown): string => {
    if (value === null) {
      return 'null'
    }
    if (value === undefined) {
      return 'undefined'
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'object') {
      return JSON.stringify(
        value,
        (_, v) => (v instanceof Date ? v.toISOString() : v),
        2
      )
    }
    return String(value)
  }

  const getResultClassName = () => {
    if (result === null) {
      return 'text-zinc-500'
    }
    if (typeof result === 'object' && result !== null && 'error' in result) {
      return 'text-red-400'
    }
    return 'text-emerald-400'
  }

  return (
    <div className="border border-zinc-800/50 rounded-xl p-4 sm:p-5 bg-zinc-900/30">
      <div className="mb-3">
        <code className="text-zinc-200 text-sm">{name}</code>
        <span className="text-zinc-600 text-sm ml-2">— {description}</span>
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
      />
      {input.trim() && (
        <pre className="mt-3 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4 text-sm overflow-x-auto">
          <code className={getResultClassName()}>
            {formatResult(result)}
          </code>
        </pre>
      )}
    </div>
  )
}

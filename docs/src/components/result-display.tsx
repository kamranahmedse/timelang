import { Highlight, themes } from 'prism-react-renderer'
import type { parse } from 'timelang'

type ResultDisplayProps = {
  result: ReturnType<typeof parse> | undefined
}

export function ResultDisplay(props: ResultDisplayProps) {
  const { result } = props

  const formatOutput = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'null'
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

  const output = formatOutput(result)

  return (
    <Highlight theme={themes.nightOwl} code={output} language="json">
      {(highlightProps) => {
        const { style, tokens, getLineProps, getTokenProps } = highlightProps
        return (
          <pre
            className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4 text-sm overflow-x-auto"
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )
      }}
    </Highlight>
  )
}

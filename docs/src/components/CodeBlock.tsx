import { Highlight, themes } from 'prism-react-renderer'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock(props: CodeBlockProps) {
  const { code, language = 'typescript' } = props

  return (
    <Highlight theme={themes.nightOwl} code={code.trim()} language={language}>
      {(highlightProps) => {
        const { style, tokens, getLineProps, getTokenProps } = highlightProps
        return (
          <pre
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 overflow-x-auto text-sm leading-relaxed"
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

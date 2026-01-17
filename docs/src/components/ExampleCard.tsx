interface ExampleCardProps {
  title: string
  bgClass: string
  titleClass: string
  examples: string[]
}

export function ExampleCard(props: ExampleCardProps) {
  const { title, bgClass, titleClass, examples } = props

  return (
    <div className={`p-4 rounded-xl space-y-1 text-zinc-500 ${bgClass}`}>
      <div className={`font-bold mb-2 ${titleClass}`}>{title}</div>
      {examples.map((example, i) => (
        <div key={i}>{example}</div>
      ))}
    </div>
  )
}

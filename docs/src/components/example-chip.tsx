type ExampleChipProps = {
  children: string
  onClick: () => void
}

export function ExampleChip(props: ExampleChipProps) {
  const { children, onClick } = props

  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
    >
      {children}
    </button>
  )
}

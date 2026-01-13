import { CodeBlock } from './code-block'

export function InstallSection() {
  return (
    <section className="py-10">
      <h2 className="text-lg font-bold text-zinc-100 mb-2">Install</h2>
      <p className="text-zinc-500 text-sm mb-4">
        Add to your project using your favorite package manager.
      </p>
      <CodeBlock language="bash">{`npm install timelang`}</CodeBlock>
    </section>
  )
}

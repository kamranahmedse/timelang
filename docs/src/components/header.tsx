import { GithubIcon } from './github-icon'

export function Header() {
  return (
    <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <code className="text-xs sm:text-sm text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
            npm i <span className="text-blue-300">timelang</span>
          </code>
        </div>
        <nav className="flex items-center gap-3 sm:gap-5">
          <a
            href="#docs"
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            How to use?
          </a>
          <a
            href="#playground"
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Playground
          </a>
          <a
            href="https://github.com/kamranahmedse/timelang"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <GithubIcon />
          </a>
        </nav>
      </div>
    </header>
  )
}

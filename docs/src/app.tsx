import { Header } from './components/header'
import { Footer } from './components/footer'
import { HeroSection } from './components/hero-section'
import { ExamplesSection } from './components/examples-section'
import { InstallSection } from './components/install-section'
import { DocsSection } from './components/docs-section'
import { PlaygroundSection } from './components/playground-section'

export function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b bg-zinc-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <HeroSection />
        <ExamplesSection />
        <InstallSection />
        <DocsSection />
        <PlaygroundSection />
      </main>
      <Footer />
    </div>
  )
}

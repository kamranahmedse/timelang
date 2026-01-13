import { HeroDemo } from './hero-demo'

export function HeroSection() {
  return (
    <section className="pt-10 sm:pt-16 pb-8">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif italic text-zinc-100 mb-4">
        Parse time, naturally
      </h1>
      <p className="text-zinc-500 mb-8 text-sm sm:text-base">
        A JavaScript library to turn "next friday at 3pm" or "last 30 days" into dates and durations.
      </p>
      <HeroDemo />
    </section>
  )
}

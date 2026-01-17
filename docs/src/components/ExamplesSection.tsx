import { useState } from 'react'
import { ExampleCard } from './ExampleCard'

const EXAMPLE_CARDS = [
  {
    title: 'Dates',
    bgClass: 'bg-blue-500/5 border border-blue-500/10',
    titleClass: 'text-blue-400',
    examples: [
      'today, tomorrow, yesterday',
      'next monday at 3pm',
      'march 15th, the 20th',
      'day after tomorrow',
      'third Thursday of November',
      'last day of march',
    ],
  },
  {
    title: 'Durations',
    bgClass: 'bg-amber-500/5 border border-amber-500/10',
    titleClass: 'text-amber-400',
    examples: [
      '2 days, 3 weeks, 1 month',
      '1d, 2w, 3mo, 1y, 2h, 30m',
      'half a day, 1.5 weeks',
      '1 week and 2 days',
      'two and a half hours',
      'a couple of days',
    ],
  },
  {
    title: 'Spans',
    bgClass: 'bg-emerald-500/5 border border-emerald-500/10',
    titleClass: 'text-emerald-400',
    examples: [
      'jan 5 to jan 20',
      'last 30 days, next 2 weeks',
      'july 3rd for 10 days',
      'this week, this month, ytd',
      'jan through mar',
      'monday through friday',
    ],
  },
  {
    title: 'Fuzzy Periods',
    bgClass: 'bg-purple-500/5 border border-purple-500/10',
    titleClass: 'text-purple-400',
    examples: [
      'Q1, Q1 2025, first quarter',
      'early january, mid Q1',
      'H1 2025, H2 2025',
      'spring, summer, winter',
      'beginning of month',
      'end of year, start of week',
    ],
  },
  {
    title: 'Business',
    bgClass: 'bg-rose-500/5 border border-rose-500/10',
    titleClass: 'text-rose-400',
    examples: [
      'next business day',
      'in 5 business days',
      'EOD, COB, EOD Friday',
      'close of business Monday',
      'end of day tomorrow',
      '2 business days ago',
    ],
  },
  {
    title: 'Natural Time',
    bgClass: 'bg-cyan-500/5 border border-cyan-500/10',
    titleClass: 'text-cyan-400',
    examples: [
      'half past 4, quarter to 5',
      'noon on Friday, midnight',
      'in a fortnight',
      'week 12, the week of March 15',
      '10 to noon, 5 past 3pm',
      'tomorrow half past 9',
    ],
  },
  {
    title: 'Relative',
    bgClass: 'bg-orange-500/5 border border-orange-500/10',
    titleClass: 'text-orange-400',
    examples: [
      '2 days from now',
      '3 weeks ago',
      'a week from today',
      '1 month from tomorrow',
      'the day before friday',
      '2 weeks after march 1',
    ],
  },
  {
    title: 'With Titles',
    bgClass: 'bg-pink-500/5 border border-pink-500/10',
    titleClass: 'text-pink-400',
    examples: [
      'Team sync - next monday',
      'Sprint Review (next friday)',
      'Deploy fix: tomorrow 9am',
      'Offsite jan 5 to jan 10',
      'Vacation [dec 20 - jan 5]',
      'Meeting on march 15th',
    ],
  },
  {
    title: 'Special',
    bgClass: 'bg-indigo-500/5 border border-indigo-500/10',
    titleClass: 'text-indigo-400',
    examples: [
      'tonight, last night',
      'this weekend, next weekend',
      'sometime next week',
      'around 3pm, about 2 hours',
      'first week of january',
      'later this week',
    ],
  },
  {
    title: 'Ranges',
    bgClass: 'bg-teal-500/5 border border-teal-500/10',
    titleClass: 'text-teal-400',
    examples: [
      'between feb 1 and feb 14',
      'between monday and friday',
      'from jan 1 until jan 15',
      'from now until march',
      'between Q1 and Q3',
      'between january and march',
    ],
  },
  {
    title: 'Past & Coming',
    bgClass: 'bg-lime-500/5 border border-lime-500/10',
    titleClass: 'text-lime-400',
    examples: [
      'over the past 30 days',
      'over the next 2 weeks',
      'in the past month',
      'coming 2 weeks',
      'upcoming week',
      'in the coming weeks',
    ],
  },
  {
    title: 'Boundaries',
    bgClass: 'bg-sky-500/5 border border-sky-500/10',
    titleClass: 'text-sky-400',
    examples: [
      'beginning of march',
      'middle of Q1',
      'end of year',
      'start of next month',
      'middle of the week',
      'end of Q1',
    ],
  },
]

export function ExamplesSection() {
  const [expanded, setExpanded] = useState(false)
  const visibleCards = expanded ? EXAMPLE_CARDS : EXAMPLE_CARDS.slice(0, 6)

  return (
    <section className="py-10">
      <div className="max-w-3xl mx-auto mb-8">
        <p className="text-zinc-500 text-sm mb-6">
          A few examples of what you can parse. See the docs below for the full
          list.
        </p>
      </div>
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm max-w-4xl mx-auto">
          {visibleCards.map((card) => (
            <ExampleCard key={card.title} {...card} />
          ))}
        </div>
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />
        )}
      </div>
      {!expanded && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Show {EXAMPLE_CARDS.length - 6} more categories ↓
          </button>
        </div>
      )}
    </section>
  )
}

export function ExamplesSection() {
  return (
    <section className="py-10">
      <h2 className="text-lg font-bold text-zinc-100 mb-2">Examples</h2>
      <p className="text-zinc-500 text-sm mb-6">
        A few examples of what you can parse. See the docs below for the full list.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1 text-zinc-500">
          <div className="text-blue-400 font-bold mb-2">Dates</div>
          <div>today, tomorrow, yesterday</div>
          <div>next monday at 3pm</div>
          <div>march 15th, end of month</div>
          <div>in 2 hours, in 30 minutes</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-1 text-zinc-500">
          <div className="text-amber-400 font-bold mb-2">Durations</div>
          <div>2 days, 3 weeks, 1 month</div>
          <div>1d, 2w, 3mo, 1y, 2h, 30m</div>
          <div>half a day, 1.5 weeks</div>
          <div>1 week and 2 days</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-1 text-zinc-500">
          <div className="text-emerald-400 font-bold mb-2">Spans</div>
          <div>jan 5 to jan 20</div>
          <div>last 30 days, next 2 weeks</div>
          <div>july 3rd for 10 days</div>
          <div>this week, this month, ytd</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-1 text-zinc-500">
          <div className="text-purple-400 font-bold mb-2">Fuzzy</div>
          <div>Q1, Q1 2025, first quarter</div>
          <div>early january, mid Q1</div>
          <div>H1 2025, H2 2025</div>
          <div>spring, summer, winter</div>
        </div>
      </div>
    </section>
  )
}

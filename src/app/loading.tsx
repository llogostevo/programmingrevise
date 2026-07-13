export default function Loading() {
  return <main className="mx-auto max-w-[1200px] animate-pulse px-4 py-12 sm:px-6 lg:px-8"><div className="h-6 w-32 rounded-full bg-muted" /><div className="mt-5 h-12 max-w-xl rounded-xl bg-muted" /><div className="mt-3 h-5 max-w-2xl rounded bg-muted" /><div className="mt-10 grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-2xl border bg-card" />)}</div></main>;
}

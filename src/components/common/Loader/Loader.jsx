export default function Loader({ label = 'Loading' }) {
  return <div className="skeleton min-h-28 w-full rounded-2xl p-6 text-sm text-[var(--text-secondary)]">{label}</div>
}

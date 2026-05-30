const labels = ['Weak', 'Fair', 'Good', 'Strong']

export default function PasswordStrength({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(score, 4))
  const label = labels[Math.max(0, safeScore - 1)] || 'Weak'

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4 backdrop-blur">
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={[
              'h-2 rounded-full transition',
              step <= safeScore ? '' : 'bg-[var(--border-color)]',
            ].join(' ')}
            style={step <= safeScore ? { background: 'var(--brand-gradient)' } : undefined}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-[var(--text-secondary)]">Password strength: {label}</p>
    </div>
  )
}

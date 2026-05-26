const labels = ['Weak', 'Fair', 'Good', 'Strong']

export default function PasswordStrength({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(score, 4))
  const label = labels[Math.max(0, safeScore - 1)] || 'Weak'

  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur">
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={[
              'h-2 rounded-full transition',
              step <= safeScore ? 'bg-gradient-to-r from-[#f97316] via-[#16a9d8] to-[#10b9a7]' : 'bg-white/10',
            ].join(' ')}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-300">Password strength: {label}</p>
    </div>
  )
}

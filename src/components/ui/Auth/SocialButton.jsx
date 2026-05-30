export default function SocialButton({ icon, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-card-hover)] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export default function SocialButton({ icon, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_26px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#FF6B35]/50 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/70 dark:text-white dark:hover:bg-white/10"
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

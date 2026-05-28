export default function SocialButton({ icon, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/[0.08] dark:text-white dark:shadow-[0_12px_30px_rgba(0,0,0,0.16)] dark:hover:border-cyan-300/55 dark:hover:bg-white/[0.12]"
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

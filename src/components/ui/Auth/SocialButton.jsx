export default function SocialButton({ icon, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/55 hover:bg-white/[0.12] disabled:opacity-60"
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

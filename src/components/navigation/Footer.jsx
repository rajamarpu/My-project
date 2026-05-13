export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 px-6 py-8 text-slate-400 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm">© 2026 Celebrity Academy. Crafted for premium celebrity learning experiences.</p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </div>
    </footer>
  )
}

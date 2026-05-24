import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t px-6 py-8 transition-colors duration-300 dark:backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-400 light:border-black/10 light:bg-white/95 light:text-slate-600">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
          (c) 2026 UptoSkills — Let's Make Freshers Employable
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <Link to="/privacy" className="transition-colors hover:text-cyan-300">Privacy</Link>
          <Link to="/terms" className="transition-colors hover:text-cyan-300">Terms</Link>
          <Link to="/contact" className="transition-colors hover:text-cyan-300">Contact</Link>
        </div>
      </div>
    </footer>
  )
}

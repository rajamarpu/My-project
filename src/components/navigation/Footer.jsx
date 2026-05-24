import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 py-8 text-[var(--text-secondary)] transition-colors duration-300 dark:backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm">
          (c) 2026 UptoSkills - Let's Make Freshers Employable
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/privacy" className="transition-colors hover:text-cyan-500">Privacy</Link>
          <Link to="/terms" className="transition-colors hover:text-cyan-500">Terms</Link>
          <Link to="/contact" className="transition-colors hover:text-cyan-500">Contact</Link>
        </div>
      </div>
    </footer>
  )
}

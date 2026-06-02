import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)]/90 px-4 py-8 text-[var(--text-secondary)] backdrop-blur-xl transition-colors duration-300 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">UptoSkills</p>
          <p className="mt-1 text-sm">Making freshers employable with guided learning.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/privacy" className="action-link">Privacy</Link>
          <Link to="/terms" className="action-link">Terms</Link>
          <Link to="/contact" className="action-link">Contact</Link>
        </div>
      </div>
    </footer>
  )
}

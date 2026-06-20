import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { footerNavigation } from '../../../constants/navigation.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)]/90 px-[clamp(16px,4vw,64px)] py-10 text-[var(--text-secondary)] backdrop-blur transition-colors duration-150">
      <div className="mx-auto grid w-full gap-10 md:grid-cols-[minmax(14rem,1.3fr)_2fr] xl:gap-16">
        <div>
          <Logo to="/" />
          <p className="mt-4 max-w-sm text-sm leading-6">Making freshers employable with guided learning, practical courses, and expert support.</p>
        </div>
        <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Footer navigation">
          {footerNavigation.map((group) => (
            <div key={group.label}>
              <p className="text-sm font-bold text-[var(--text-primary)]">{group.label}</p>
              <ul className="mt-3 grid gap-2.5 text-sm">
                {group.items.map((item) => <li key={item.href}><Link to={item.href} className="transition hover:text-[var(--accent-primary)]">{item.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-10 flex w-full flex-col gap-2 border-t border-[var(--border-color)] pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} UptoSkills. All rights reserved.</p>
        <p>One learning platform for learners, instructors, and administrators.</p>
      </div>
    </footer>
  )
}

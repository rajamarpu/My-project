import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../../hooks/useTheme.js'

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-soft transition-colors duration-150 hover:border-[var(--accent-primary)]/60"
      aria-label={`Theme: ${theme}. Switch to ${nextTheme} theme`}
      title={`Theme: ${theme}. Switch to ${nextTheme}`}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}


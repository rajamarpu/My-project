import { Link } from 'react-router-dom'
import { GraduationCap, TrendingUp } from 'lucide-react'
import { cn } from '../../../utils/classNames.js'

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={cn('group flex min-w-0 items-start gap-1.5 text-[var(--text-primary)]', className)} aria-label="UptoSkills home">
      <span className="relative mt-0.5 h-8 w-8 shrink-0">
        <GraduationCap size={18} strokeWidth={2.15} className="absolute left-0 top-0 text-[#4A90E2] drop-shadow-[0_2px_4px_rgba(74,144,226,0.14)]" />
      </span>
      <span className="min-w-0">
        <span
          className="relative inline-flex h-[1.25em] items-end whitespace-nowrap text-[1.55rem] font-black leading-none tracking-[-0.03em] sm:text-[1.9rem]"
          style={{ fontFamily: '"Arial Rounded MT Bold", "Trebuchet MS", "Nunito Sans", "Aptos Display", Poppins, Inter, Arial, Helvetica, sans-serif' }}
        >
          <span className="inline-flex items-end text-[#2CC7BA]">Upto</span>
          <span className="relative inline-flex items-end text-[#FF7A45]">
            Skills
            <TrendingUp className="absolute -right-4 -top-2 h-3.5 w-3.5 rotate-12 text-[#FF7A45] transition group-hover:-translate-y-0.5 dark:text-[#FF9A6B]" strokeWidth={3} />
          </span>
        </span>
      </span>
    </Link>
  )
}

import { GraduationCap, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../../utils/classNames.js'

export function UptoSkillsMark({ compact = false, iconOnly = false }) {
  const textSize = compact ? 'text-[1.45rem] sm:text-[1.6rem]' : 'text-[1.7rem] sm:text-[2.05rem]'
  const iconSize = compact ? 18 : 20

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center">
        <GraduationCap size={iconSize} strokeWidth={2.2} className="text-[#2D6CDF] drop-shadow-[0_2px_4px_rgba(45,108,223,0.16)]" />
        <TrendingUp size={iconSize - 2} strokeWidth={2.8} className="absolute -right-1 -top-0.5 text-[#FF7A45]" />
      </span>
      {iconOnly ? null : (
        <span
          className={`inline-flex items-baseline font-black leading-none tracking-[-0.04em] ${textSize}`}
          style={{ fontFamily: '"Arial Rounded MT Bold", "Trebuchet MS", "Nunito Sans", "Aptos Display", Poppins, Inter, Arial, sans-serif' }}
        >
          <span className="text-[#27BFB3]">Upto</span>
          <span className="text-[#FF7A45]">Skills</span>
        </span>
      )}
    </span>
  )
}

export default function Logo({ to = '/', className = '', compact = false, iconOnly = false }) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex min-w-0 items-center text-[var(--text-primary)]', className)}
      aria-label="UptoSkills home"
    >
      <UptoSkillsMark compact={compact} iconOnly={iconOnly} />
    </Link>
  )
}

import { cn } from '../../../utils/classNames.js'

export default function Card({ className = '', children }) {
  return <div className={cn('glass-card rounded-xl p-5 sm:p-6', className)}>{children}</div>
}

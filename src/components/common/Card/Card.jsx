import { cn } from '../../../utils/classNames.js'

export default function Card({ className = '', children }) {
  return <div className={cn('glass-card rounded-2xl p-6', className)}>{children}</div>
}

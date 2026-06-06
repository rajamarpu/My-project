import { motion } from 'framer-motion'
import { pageTransition } from '../utils/animationVariants.js'

export default function AuthLayout({ children }) {
  return (
    <motion.main
      className="h-[100dvh] overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]"
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={pageTransition}
    >
      {children}
    </motion.main>
  )
}


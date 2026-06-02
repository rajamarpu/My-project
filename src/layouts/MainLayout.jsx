import { motion } from 'framer-motion'
import Navbar from '../components/ui/Navbar/Navbar.jsx'
import Footer from '../components/ui/Navbar/Footer.jsx'
import { pageTransition } from '../utils/animationVariants.js'

export default function MainLayout({ children }) {
  return (
    <div className="app-shell min-h-screen text-[var(--text-primary)] transition-colors duration-300">
      <Navbar />
      <motion.main
        className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8"
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={pageTransition}
      >
        {children}
      </motion.main>
      <Footer />
    </div>
  )
}


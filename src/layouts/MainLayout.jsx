import { motion } from 'framer-motion'
import Navbar from '../components/navigation/Navbar.jsx'
import Footer from '../components/navigation/Footer.jsx'
import { pageTransition } from '../animations/variants.js'

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-hero-gradient text-slate-100">
      <Navbar />
      <motion.main
        className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-24 pt-8 lg:px-8"
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

import { Link } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center text-center text-slate-100">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-10 shadow-glow">
        <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">404 error</p>
        <h1 className="mt-6 text-5xl font-semibold text-white">Page not found</h1>
        <p className="mt-4 max-w-xl text-slate-400">The route you are looking for is not part of UptoSkills yet. Return to the homepage or open your dashboard.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">Open Login</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

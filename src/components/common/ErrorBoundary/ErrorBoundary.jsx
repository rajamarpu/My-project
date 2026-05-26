import { Component } from 'react'
import Button from '../Button/Button.jsx'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <section className="max-w-md rounded-lg border border-white/10 bg-white/5 p-6 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">Something went wrong</p>
          <h1 className="mt-3 text-2xl font-bold">We could not render this screen.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Refresh the page to retry. If the problem keeps happening, check the browser console and backend logs for the failing route.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </section>
      </main>
    )
  }
}

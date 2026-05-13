import Button from '../../components/ui/Button.jsx'

const certificates = [
  { title: 'Screen Presence Mastery', issuer: 'Alia Bhatt', status: 'Verified' },
  { title: 'Elite Entrepreneur Roadmap', issuer: 'Ranveer Singh', status: 'Verified' },
]

export default function CertificatesPage() {
  return (
    <section className="pb-16">
      <div className="glass-card p-8 shadow-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Certificates</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Your premium achievements</h1>
          </div>
          <Button variant="secondary">Verify certificate</Button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {certificates.map((item) => (
          <div key={item.title} className="glass-card rounded-[2rem] p-8 text-slate-300 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-slate-400">Issued by {item.issuer}</p>
              </div>
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm text-amber-200">{item.status}</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Button variant="secondary">Download PDF</Button>
              <Button>Share LinkedIn</Button>
              <Button variant="secondary">View QR</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

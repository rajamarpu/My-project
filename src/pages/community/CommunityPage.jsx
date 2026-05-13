import Button from '../../components/ui/Button.jsx'

const topics = [
  { title: 'Celebrity Mentors Lounge', members: '12.3k' },
  { title: 'AI Learning Roadmaps', members: '8.9k' },
  { title: 'Live Class Feedback', members: '6.4k' },
]

export default function CommunityPage() {
  return (
    <section className="pb-16">
      <div className="glass-card p-8 shadow-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Community</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Join conversations with learners and celebrity mentors.</h1>
          </div>
          <Button variant="secondary">Create topic</Button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-3">
        {topics.map((topic) => (
          <div key={topic.title} className="glass-card rounded-[2rem] p-6 text-slate-300 shadow-soft">
            <p className="text-lg font-semibold text-white">{topic.title}</p>
            <p className="mt-3 text-sm text-slate-400">{topic.members} members</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">Hot</span>
              <Button variant="secondary">Open</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

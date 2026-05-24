import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import ChatInterface from '../../components/chat/ChatInterface.jsx'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'

const topics = [
  { id: 'celebrity-mentors', title: 'Celebrity Mentors Lounge', members: '12.3k' },
  { id: 'ai-roadmaps', title: 'AI Learning Roadmaps', members: '8.9k' },
  { id: 'live-feedback', title: 'Live Class Feedback', members: '6.4k' },
]

export default function CommunityPage() {
  const navigate = useNavigate()
  const { topicId } = useParams()
  const [activeTopic, setActiveTopic] = useState(topicId || 'celebrity-mentors')
  const [showChat, setShowChat] = useState(!!topicId)

  if (showChat) {
    return (
      <section className="pb-16">
        <div className="glass-card p-8 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Community</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-100">
                {topics.find(t => t.id === activeTopic)?.title || 'Chat Room'}
              </h1>
            </div>
            <Button variant="secondary" onClick={() => setShowChat(false)}>Back to Topics</Button>
          </div>
        </div>
        <div className="mt-8 h-[600px]">
          <ChatInterface courseId="general" roomId={activeTopic} />
        </div>
      </section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-16"
    >
      <div className="glass-card p-8 shadow-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Community</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-100">
              Join conversations with learners and expert instructors.
            </h1>
          </div>
          <Button variant="secondary" onClick={() => navigate('/community/new-topic')}>Create topic</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {topics.map((topic) => (
          <motion.div
            key={topic.id}
            whileHover={{ scale: 1.02 }}
            className="glass-card rounded-[2rem] p-6 shadow-soft bg-white/80 cursor-pointer"
            onClick={() => {
              setActiveTopic(topic.id)
              setShowChat(true)
              navigate(`/community/${topic.id}`)
            }}
          >
            <p className="text-lg font-semibold text-slate-100">{topic.title}</p>
            <p className="mt-3 text-sm text-slate-400">
              {topic.members} members
            </p>

            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                Hot
              </span>
              <Button variant="secondary">Join Chat</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

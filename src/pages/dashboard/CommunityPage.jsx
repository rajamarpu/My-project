import { useState } from 'react'
import Button from '../../components/common/Button/Button.jsx'
import ChatInterface from '../../components/ui/Dashboard/ChatInterface.jsx'
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
  const defaultTopic = topics.some((topic) => topic.id === topicId) ? topicId : 'celebrity-mentors'
  const [activeTopic, setActiveTopic] = useState(defaultTopic)
  const [showChat, setShowChat] = useState(Boolean(topicId && topics.some((topic) => topic.id === topicId)))

  if (showChat) {
    return (
      <section className="pb-16">
        <div className="glass-card p-8 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Community</p>
              <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">
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
            <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Community</p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">
              Join conversations with learners and expert instructors.
            </h1>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setActiveTopic('ai-roadmaps')
              setShowChat(true)
              navigate('/community/ai-roadmaps')
            }}
          >
            Start discussion
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {topics.map((topic) => (
          <motion.div
            key={topic.id}
            whileHover={{ scale: 1.02 }}
            className="glass-card cursor-pointer rounded-[2rem] p-6 shadow-soft"
            onClick={() => {
              setActiveTopic(topic.id)
              setShowChat(true)
              navigate(`/community/${topic.id}`)
            }}
          >
            <p className="text-lg font-semibold text-[var(--text-primary)]">{topic.title}</p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {topic.members} members
            </p>

            <div className="mt-5 flex items-center justify-between">
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                Hot
              </span>
              <Button
                variant="secondary"
                onClick={(event) => {
                  event.stopPropagation()
                  setActiveTopic(topic.id)
                  setShowChat(true)
                  navigate(`/community/${topic.id}`)
                }}
              >
                Join Chat
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}


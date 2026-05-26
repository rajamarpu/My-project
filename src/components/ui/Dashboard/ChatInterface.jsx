import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useChat from '../../../hooks/useChat'
import { fadeInUp } from '../../../utils/animationVariants'

export default function ChatInterface({ courseId, roomId }) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  const { messages, isConnected, isTyping, sendMessage, sendTyping } = useChat(roomId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessage(message, courseId)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e)
    } else {
      sendTyping()
    }
  }

  return (
    <div className="flex flex-col h-full glass-card">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="flex items-start gap-3"
            >
              <img
                src={msg.sender?.profile_image || 'https://via.placeholder.com/40'}
                alt={msg.sender?.full_name || 'User'}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {msg.sender?.full_name || 'Anonymous'}
                </p>
                <p className="text-sm text-slate-400">{msg.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {isTyping && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500">Someone is typing...</p>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-lg bg-slate-800/50 p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            rows={1}
          />
          <button
            type="submit"
            disabled={!message.trim() || !isConnected}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-teal-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {!isConnected && (
          <p className="mt-2 text-xs text-red-400">Connecting...</p>
        )}
      </form>
    </div>
  )
}


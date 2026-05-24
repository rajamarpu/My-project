import { io } from 'socket.io-client'
import { useState, useEffect, useCallback, useRef } from 'react'

const useChat = (roomId) => {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [onlineUsers] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    const token = window.localStorage.getItem('lms-token')
    if (!token) return

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-room', roomId)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message])
    })

    socket.on('user-typing', () => {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 3000)
    })

    return () => {
      socket.disconnect()
    }
  }, [roomId])

  const sendMessage = useCallback((message, courseId) => {
    if (socketRef.current && message.trim()) {
      socketRef.current.emit('send-message', {
        roomId,
        message,
        courseId
      })
    }
  }, [roomId])

  const sendTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { roomId })
    }
  }, [roomId])

  return {
    messages,
    isConnected,
    isTyping,
    onlineUsers,
    sendMessage,
    sendTyping
  }
}

export default useChat

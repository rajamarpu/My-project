import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setLocalTheme] = useState('dark')

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('celebrity-academy-theme')
    if (storedTheme) {
      setLocalTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.classList.toggle('light', theme === 'light')
    document.body.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('celebrity-academy-theme', theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme() {
        const nextTheme = theme === 'dark' ? 'light' : 'dark'
        setLocalTheme(nextTheme)
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

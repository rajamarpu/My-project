import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setTheme } from './slices/authSlice.js'
import ThemeContext from '../hooks/themeContext.js'

const THEME_STORAGE_KEY = 'uptoskills-theme'

function getInitialTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    if (stored === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    // Use the light theme when storage is blocked by the browser.
  }
  return 'light'
}

function applyTheme(preference) {
  const theme = preference
  const root = document.documentElement
  root.classList.add('theme-changing')
  root.dataset.theme = theme
  root.dataset.themePreference = preference
  root.style.colorScheme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.content = theme === 'dark' ? '#0f172a' : '#ffffff'
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Theme remains functional for the current session without persistence.
  }
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      root.classList.remove('theme-changing')
    })
  })
}

export default function ThemeProvider({ children }) {
  const dispatch = useDispatch()
  const [theme, setThemeState] = useState(getInitialTheme)

  useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    dispatch(setTheme(theme))
  }, [dispatch, theme])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY || !['light', 'dark'].includes(event.newValue)) return
      setThemeState(event.newValue)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme: (nextTheme) => {
        const resolvedTheme = typeof nextTheme === 'function' ? nextTheme(theme) : nextTheme
        if (!['light', 'dark'].includes(resolvedTheme)) return
        setThemeState(resolvedTheme)
      },
      toggleTheme: () => {
        setThemeState(theme === 'light' ? 'dark' : 'light')
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}


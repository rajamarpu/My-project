import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setTheme } from '../redux/slices/authSlice.js'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const dispatch = useDispatch()
  const selectedTheme = useSelector((state) => state.auth.theme)
  const [theme, setLocalTheme] = useState(selectedTheme || 'dark')

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('celebrity-academy-theme')
    if (storedTheme) {
      setLocalTheme(storedTheme)
      dispatch(setTheme(storedTheme))
    }
  }, [dispatch])

  useEffect(() => {
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
        dispatch(setTheme(nextTheme))
      },
    }),
    [theme, dispatch],
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

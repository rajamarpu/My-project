import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setTheme } from './redux/slices/authSlice.js'
import ThemeContext from './themeContext.js'

function getInitialTheme() {
  const stored = window.localStorage.getItem('uptoskills-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export default function ThemeProvider({ children }) {
  const dispatch = useDispatch()
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
    window.localStorage.setItem('uptoskills-theme', theme)
    dispatch(setTheme(theme))
  }, [dispatch, theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

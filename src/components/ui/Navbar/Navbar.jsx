import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronDown, LogOut, Menu, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '../../../utils/classNames.js'
import NotificationCenter from './NotificationCenter.jsx'
import ThemeToggleButton from './ThemeToggleButton.jsx'
import { logout } from '../../../store/slices/authSlice.js'
import Logo from './Logo.jsx'
import { fetchCourses } from '../../../api/api.js'
import { resolveCourseThumbnail } from '../../../utils/courseThumbnail.js'
import { accountNavigationForRole, homeForRole, navigationForRole } from '../../../constants/navigation.jsx'

export default function Navbar() {
  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAdminHost = import.meta.env.MODE === 'admin'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const [courses, setCourses] = useState([])
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  const dashboardPath = homeForRole(auth.user ? auth.role : null)
  const navItems = navigationForRole(auth.role, Boolean(auth.user))
  const accountItems = accountNavigationForRole(auth.role)
  const courseSuggestions = useMemo(() => {
    const needle = globalQuery.trim().toLowerCase()
    if (!needle) return []
    return courses
      .filter((course) => [
        course.title,
        course.category,
        course.level,
        course.createdBy?.name,
        course.instructor?.name,
      ].filter(Boolean).join(' ').toLowerCase().includes(needle))
      .slice(0, 6)
  }, [courses, globalQuery])

  useEffect(() => {
    let mounted = true
    fetchCourses()
      .then((response) => {
        if (!mounted) return
        setCourses(response.data?.courses || response.data || [])
      })
      .catch(() => {
        if (mounted) setCourses([])
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const closeOnHistoryNavigation = () => {
      setDrawerOpen(false)
      setProfileOpen(false)
      setSearchFocused(false)
    }
    window.addEventListener('popstate', closeOnHistoryNavigation)
    return () => window.removeEventListener('popstate', closeOnHistoryNavigation)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [drawerOpen])

  useEffect(() => {
    function closeMenus(event) {
      if (event.key !== 'Escape') return
      setDrawerOpen(false)
      setProfileOpen(false)
      setSearchFocused(false)
      setActiveSuggestion(-1)
    }
    window.addEventListener('keydown', closeMenus)
    return () => window.removeEventListener('keydown', closeMenus)
  }, [])

  function submitGlobalSearch(event) {
    event.preventDefault()
    const query = globalQuery.trim()
    if (!query) return
    setDrawerOpen(false)
    navigate(`/explore?search=${encodeURIComponent(query)}`)
  }

  function openCourseSuggestion(course) {
    setSearchFocused(false)
    setDrawerOpen(false)
    setGlobalQuery('')
    navigate(`/course/${course.id}`)
  }

  function updateGlobalQuery(value) {
    setGlobalQuery(value)
    setActiveSuggestion(-1)
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setSearchFocused(false)
      setActiveSuggestion(-1)
      return
    }
    if (!courseSuggestions.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSearchFocused(true)
      setActiveSuggestion((current) => (current + 1) % courseSuggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSearchFocused(true)
      setActiveSuggestion((current) => (current <= 0 ? courseSuggestions.length - 1 : current - 1))
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault()
      openCourseSuggestion(courseSuggestions[activeSuggestion])
    }
  }

  const searchDropdown = searchFocused && globalQuery.trim() ? (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[95] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-2 text-[var(--text-primary)] shadow-glow backdrop-blur-xl" role="listbox" aria-label="Course suggestions">
      {courseSuggestions.length ? courseSuggestions.map((course, index) => (
        <button
          key={course.id}
          type="button"
          onMouseDown={(event) => {
            event.preventDefault()
            openCourseSuggestion(course)
          }}
          onMouseEnter={() => setActiveSuggestion(index)}
          role="option"
          aria-selected={index === activeSuggestion}
          className={cn('flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-[var(--bg-subtle)]', index === activeSuggestion && 'bg-[var(--bg-subtle)]')}
        >
          <img src={resolveCourseThumbnail(course)} alt="" className="h-10 w-14 shrink-0 rounded-lg bg-[var(--bg-subtle)] object-contain" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{course.title}</span>
            <span className="block truncate text-xs text-[var(--text-secondary)]">
              {[course.category || course.level || 'Course', course.createdBy?.name || course.instructor?.name].filter(Boolean).join(' · ')}
            </span>
          </span>
        </button>
      )) : (
        <div className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--text-secondary)]" role="status">
          <Search size={16} className="text-[var(--accent-primary)]" />
          No matching courses found.
        </div>
      )}
    </div>
  ) : null

  return (
    <header className="site-header sticky top-0 z-50 transition-colors duration-150">
      <div>
        <div>
          <div className="mx-auto flex w-full max-w-full items-center justify-between gap-6 px-[clamp(16px,4vw,64px)] py-3">
            <Logo to="/" />

            <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex" aria-label="Primary navigation">
              {!auth.user ? <NavLink to="/" end className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>Home</NavLink> : null}
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) => cn('nav-link gap-2', isActive && 'nav-link-active')}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-3">
              <form onSubmit={submitGlobalSearch} className="relative hidden min-h-11 w-[min(18rem,22vw)] items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 text-[var(--text-secondary)] shadow-sm xl:flex">
                <Search size={16} className="shrink-0 text-[var(--accent-primary)]" />
                <input
                  value={globalQuery}
                  onChange={(event) => updateGlobalQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                  onKeyDown={handleSearchKeyDown}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  placeholder="Search courses"
                  aria-label="Search courses"
                  aria-autocomplete="list"
                  aria-expanded={Boolean(searchDropdown)}
                />
                {searchDropdown}
              </form>
              <ThemeToggleButton />

              <div className="hidden lg:block">
                <NotificationCenter />
              </div>

              {auth.user ? (
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((value) => !value)}
                    className="btn-secondary min-w-[112px] gap-2 whitespace-nowrap rounded-xl px-4"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                  >
                    <span className="max-w-[9rem] truncate">{auth.user.fullName || auth.user.name || auth.user.email || 'Account'}</span>
                    <ChevronDown size={16} className="shrink-0" />
                  </button>
                  {profileOpen ? (
                    <div className="absolute right-0 z-[90] mt-3 w-72 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-2 text-[var(--text-primary)] shadow-glow backdrop-blur-xl animate-upto-fade-slide" role="menu">
                      <button type="button" onClick={() => { setProfileOpen(false); navigate(dashboardPath) }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]">
                        <span className="min-w-0 flex-1 truncate">Open {auth.role === 'instructor' ? 'instructor workspace' : 'dashboard'}</span>
                      </button>
                      {accountItems.map((item) => (
                        <button type="button" key={item.href} onClick={() => { setProfileOpen(false); navigate(item.href) }} className="flex min-h-11 w-full items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                          <item.icon size={16} className="shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </button>
                      ))}
                      <button type="button" onClick={() => { dispatch(logout()); setProfileOpen(false); navigate('/') }} className="flex min-h-11 w-full items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-200">
                        <LogOut size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">Logout</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="hidden items-center gap-2 lg:flex">
                  <button type="button" onClick={() => navigate('/contact')} className="action-link">Contact Us</button>
                  <button type="button" onClick={() => navigate('/login')} className="action-link">Learner Login</button>
                  {isAdminHost ? <button type="button" onClick={() => navigate('/admin-login')} className="action-link">Admin</button> : null}
                  <button type="button" onClick={() => navigate('/register')} className="btn-primary min-h-10 rounded-full px-5 py-2 text-sm">Get Started</button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setDrawerOpen((state) => !state)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm transition hover:border-[var(--accent-primary)]/50 lg:hidden"
                aria-label="Mobile menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-navigation"
              >
                {drawerOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {drawerOpen && (
            <div id="mobile-navigation" className="mobile-drawer animate-upto-fade-slide px-4 py-4 transition-colors duration-150 sm:px-6 lg:hidden">
              <div className="grid gap-2">
                {!auth.user ? <NavLink to="/" end onClick={() => setDrawerOpen(false)} className={({ isActive }) => cn('nav-link w-full justify-start', isActive && 'nav-link-active')}>Home</NavLink> : null}
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) => cn('nav-link w-full justify-start gap-2', isActive && 'nav-link-active')}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </NavLink>
                ))}
                <div className="my-2 h-px bg-[var(--border-color)]" />
                {auth.user ? (
                  <div className="grid gap-1" aria-label="Account navigation">
                    <p className="px-3 pb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Account</p>
                    {accountItems.map((item) => (
                      <NavLink key={item.href} to={item.href} onClick={() => setDrawerOpen(false)} className={({ isActive }) => cn('nav-link w-full justify-start gap-2', isActive && 'nav-link-active')}>
                        <item.icon size={16} />{item.label}
                      </NavLink>
                    ))}
                    <div className="my-2 h-px bg-[var(--border-color)]" />
                  </div>
                ) : null}
                <form onSubmit={submitGlobalSearch} className="relative flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 text-[var(--text-secondary)]">
                  <Search size={16} className="shrink-0 text-[var(--accent-primary)]" />
                  <input
                    value={globalQuery}
                    onChange={(event) => updateGlobalQuery(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                    onKeyDown={handleSearchKeyDown}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                    placeholder="Search courses"
                    aria-label="Search courses"
                    aria-autocomplete="list"
                    aria-expanded={Boolean(searchDropdown)}
                  />
                  {searchDropdown}
                </form>
                {auth.user ? (
                  <button type="button" onClick={() => { dispatch(logout()); setDrawerOpen(false); navigate('/') }} className="action-link w-full py-3 text-[var(--color-danger)]">
                    <LogOut size={16} /> Logout
                  </button>
                ) : (
                  <button type="button" onClick={() => { setDrawerOpen(false); navigate('/login') }} className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold text-white shadow-glow">
                    Login
                  </button>
                )}
                {!auth.user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false)
                      navigate('/register')
                    }}
                    className="action-link w-full py-3"
                  >
                    Register
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

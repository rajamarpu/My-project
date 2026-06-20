import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, UserCircle, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { logout } from '../store/slices/authSlice.js'
import { cn } from '../utils/classNames.js'
import Logo from '../components/ui/Navbar/Logo.jsx'
import ThemeToggleButton from '../components/ui/Navbar/ThemeToggleButton.jsx'
import { Breadcrumbs, RouteProgress } from '../components/common/RouteFeedback/RouteFeedback.jsx'
import { adminNavigationSections } from '../constants/navigation.jsx'

export default function AdminLayout({ children }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem('uptoskills-admin-sidebar') === 'collapsed')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeResult, setActiveResult] = useState(-1)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchableRoutes = useMemo(() => adminNavigationSections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.label }))), [])
  const searchResults = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    if (!needle) return []
    return searchableRoutes.filter((item) => `${item.label} ${item.section}`.toLowerCase().includes(needle)).slice(0, 7)
  }, [searchQuery, searchableRoutes])

  useEffect(() => {
    function closeOverlays(event) {
      if (event.key !== 'Escape') return
      setNavOpen(false)
      setSearchOpen(false)
      setProfileOpen(false)
      setActiveResult(-1)
    }
    window.addEventListener('keydown', closeOverlays)
    return () => window.removeEventListener('keydown', closeOverlays)
  }, [])

  useEffect(() => {
    const closeOnHistoryNavigation = () => {
      setNavOpen(false)
      setSearchOpen(false)
      setProfileOpen(false)
    }
    window.addEventListener('popstate', closeOnHistoryNavigation)
    return () => window.removeEventListener('popstate', closeOnHistoryNavigation)
  }, [])

  useEffect(() => {
    if (!navOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [navOpen])

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem('uptoskills-admin-sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
  }

  function openAdminRoute(href) {
    setSearchOpen(false)
    setSearchQuery('')
    setActiveResult(-1)
    navigate(href)
  }

  function handleAdminSearchKeyDown(event) {
    if (!searchResults.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveResult((current) => (current + 1) % searchResults.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveResult((current) => (current <= 0 ? searchResults.length - 1 : current - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      openAdminRoute(searchResults[Math.max(0, activeResult)].href)
    }
  }

  return (
    <div className="admin-shell min-h-screen text-[var(--text-primary)]" style={{ '--admin-sidebar-width': collapsed ? '84px' : '276px' }}>
      <RouteProgress />
      <div className="min-h-screen lg:block">
        <div className="sticky top-0 z-30 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/95 p-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Logo to="/admin" admin />
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <button
                type="button"
                onClick={() => setNavOpen((current) => !current)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-color)] text-[var(--text-primary)]"
                aria-label={navOpen ? 'Close admin menu' : 'Open admin menu'}
              >
                {navOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {navOpen ? <button type="button" aria-label="Close admin menu overlay" onClick={() => setNavOpen(false)} className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" /> : null}

        <aside className={`${navOpen ? 'flex animate-upto-fade-slide' : 'hidden'} fixed inset-x-3 top-20 z-40 max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 shadow-soft backdrop-blur-xl transition-[width] duration-200 sm:inset-x-4 sm:p-4 lg:inset-y-0 lg:left-0 lg:top-0 lg:flex lg:h-screen ${collapsed ? 'lg:w-[84px] lg:p-4' : 'lg:w-[276px] lg:p-5'} lg:max-h-none lg:rounded-none lg:border-x-0 lg:border-y-0 lg:border-r lg:shadow-none`}>
          <div className="shrink-0 flex items-center justify-between gap-3">
            <Logo to="/admin" admin compact={collapsed} className={collapsed ? 'lg:[&>span:nth-child(2)]:hidden' : ''} />
            {!collapsed ? <div className="hidden lg:block"><ThemeToggleButton /></div> : null}
          </div>
          <button type="button" onClick={toggleCollapsed} className="mt-4 hidden min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] text-xs font-bold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] lg:flex" aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'} aria-expanded={!collapsed}>
            {collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /><span>Collapse sidebar</span></>}
          </button>

          <nav className="admin-scrollbar mt-7 min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 lg:mt-5 lg:space-y-4" aria-label="Admin navigation">
            {adminNavigationSections.map((section) => (
              <div key={section.label}>
                <p className={`${collapsed ? 'lg:sr-only' : ''} px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]`}>{section.label}</p>
                <div className="mt-2 grid gap-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={item.end}
                      onClick={(event) => {
                        event.currentTarget.blur()
                        setNavOpen(false)
                        setSearchOpen(false)
                        setProfileOpen(false)
                      }}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'admin-nav-link',
                          isActive
                            ? 'admin-nav-link-active'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
                        )
                      }
                    >
                      <item.icon size={17} />
                      <span className={`${collapsed ? 'lg:hidden' : ''} truncate`}>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => {
              dispatch(logout())
              navigate('/admin-login')
            }}
            className={`mt-5 shrink-0 flex w-full items-center ${collapsed ? 'lg:justify-center lg:px-2' : 'gap-3 px-4'} rounded-xl border border-red-500/20 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-200`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </aside>

        <main className="admin-main min-w-0 max-w-full px-3 py-4 transition-[margin,width] duration-200 sm:px-5 sm:py-6 lg:px-5 lg:py-0 xl:px-6">
          <header className="sticky top-0 z-20 -mx-5 mb-4 hidden min-h-[4.75rem] items-center justify-between gap-4 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/95 px-5 backdrop-blur-xl lg:flex xl:-mx-6 xl:px-6">
            <div className="relative w-full max-w-xl">
              <form onSubmit={(event) => { event.preventDefault(); if (searchResults.length) openAdminRoute(searchResults[Math.max(0, activeResult)].href) }} className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 text-[var(--text-secondary)] shadow-sm focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
                <Search size={18} aria-hidden="true" />
                <input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setSearchOpen(true); setActiveResult(-1) }} onFocus={() => setSearchOpen(true)} onKeyDown={handleAdminSearchKeyDown} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--input-text)] outline-none placeholder:text-[var(--input-placeholder)]" placeholder="Search admin pages and tools" aria-label="Search admin pages" aria-autocomplete="list" aria-expanded={searchOpen && Boolean(searchQuery.trim())} />
                <kbd className="hidden rounded-md border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2 py-1 text-[0.65rem] font-bold text-[var(--text-muted)] xl:inline">Enter</kbd>
              </form>
              {searchOpen && searchQuery.trim() ? (
                <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-overlay)]" role="listbox" aria-label="Admin search results">
                  {searchResults.length ? searchResults.map((item, index) => (
                    <button key={item.href} type="button" role="option" aria-selected={activeResult === index} onMouseEnter={() => setActiveResult(index)} onMouseDown={(event) => { event.preventDefault(); openAdminRoute(item.href) }} className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition ${activeResult === index ? 'bg-[var(--bg-subtle)]' : 'hover:bg-[var(--bg-subtle)]'}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]"><item.icon size={17} /></span>
                      <span className="min-w-0"><span className="block text-sm font-bold text-[var(--text-primary)]">{item.label}</span><span className="block text-xs text-[var(--text-muted)]">{item.section}</span></span>
                    </button>
                  )) : <p className="px-3 py-4 text-sm font-semibold text-[var(--text-secondary)]">No admin pages match “{searchQuery.trim()}”.</p>}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <p className="hidden text-right 2xl:block"><span className="block text-xs font-bold text-[var(--text-primary)]">{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span><span className="block text-[0.68rem] text-[var(--text-muted)]">Admin workspace</span></p>
              <button type="button" onClick={() => navigate('/admin/notifications')} className="relative grid h-11 w-11 place-items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)]" aria-label="Open admin notifications"><Bell size={18} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--accent-primary)]" aria-hidden="true" /></button>
              <ThemeToggleButton />
              <div className="relative">
                <button type="button" onClick={() => setProfileOpen((current) => !current)} className="flex min-h-11 max-w-[15rem] items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 text-left" aria-haspopup="menu" aria-expanded={profileOpen}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--accent-soft)] text-sm font-black text-[var(--accent-primary)]">{user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.name || user?.fullName || 'A').charAt(0).toUpperCase()}</span>
                  <span className="hidden min-w-0 xl:block"><span className="block truncate text-xs font-bold text-[var(--text-primary)]">{user?.name || user?.fullName || 'Administrator'}</span><span className="block truncate text-[0.68rem] text-[var(--text-muted)]">Administrator</span></span>
                  <ChevronDown size={15} className="hidden xl:block" />
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-overlay)]" role="menu">
                    <button type="button" onClick={() => { setProfileOpen(false); navigate('/admin/profile') }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"><UserCircle size={17} /> Profile</button>
                    <button type="button" onClick={() => { setProfileOpen(false); navigate('/admin/settings') }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"><Settings size={17} /> Settings</button>
                    <button type="button" onClick={() => { dispatch(logout()); navigate('/admin-login') }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-200"><LogOut size={17} /> Logout</button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <Breadcrumbs admin />
          {children}
        </main>
      </div>
    </div>
  )
}

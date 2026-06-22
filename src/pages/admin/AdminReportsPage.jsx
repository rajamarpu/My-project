import { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart3, Download, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { AdminEmptyState, AdminMetricCard, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import { fetchAdminActivityLogs, fetchAdminOverview } from '../../api/api.js'

function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"` }

export default function AdminReportsPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [overview, setOverview] = useState(null)
  const [filters, setFilters] = useState({ from: '', to: '', module: 'ALL', search: '' })
  const [state, setState] = useState({ loading: true, error: '' })

  async function load() {
    try {
      setState({ loading: true, error: '' })
      const [logResponse, overviewResponse] = await Promise.all([fetchAdminActivityLogs(), fetchAdminOverview()])
      setLogs(logResponse.data?.activityLogs || [])
      setOverview(overviewResponse.data || null)
      setState({ loading: false, error: '' })
    } catch (error) { setState({ loading: false, error: error?.response?.data?.message || 'Could not prepare reports.' }) }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [])

  const modules = useMemo(() => [...new Set(logs.map((item) => item.entityType).filter(Boolean))].sort(), [logs])
  const rows = useMemo(() => logs.filter((item) => {
    const created = new Date(item.createdAt)
    if (filters.from && created < new Date(`${filters.from}T00:00:00`)) return false
    if (filters.to && created > new Date(`${filters.to}T23:59:59`)) return false
    if (filters.module !== 'ALL' && item.entityType !== filters.module) return false
    const haystack = `${item.action} ${item.entityType} ${item.user?.name || ''} ${item.user?.email || ''}`.toLowerCase()
    return haystack.includes(filters.search.toLowerCase())
  }), [filters, logs])

  function exportReport() {
    const columns = ['createdAt', 'action', 'entityType', 'entityId', 'actor', 'ipAddress']
    const csv = [columns.map(csvCell).join(','), ...rows.map((row) => [row.createdAt, row.action, row.entityType, row.entityId, row.user?.email || row.user?.name, row.ipAddress].map(csvCell).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `uptoskills-report-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
  }

  const analytics = overview?.analytics || {}
  const reportCards = [
    { label: 'Users', value: analytics.totalUsers ?? 0, detail: 'all platform accounts', icon: TrendingUp, tone: 'blue', href: '/admin/users' },
    { label: 'Courses', value: analytics.totalCourses ?? 0, detail: 'published and draft catalog', icon: BarChart3, tone: 'teal', href: '/admin/courses' },
    { label: 'Matching events', value: rows.length, detail: 'filtered report rows', icon: Activity, tone: 'emerald', href: '/admin/activity-logs' },
    { label: 'Auditable events', value: logs.length, detail: 'tracked platform records', icon: ShieldCheck, tone: 'amber', href: '/admin/activity-logs' },
  ]

  return <section className="space-y-6 pb-12">
    <AdminPageHeader eyebrow="Reports" title="Operational reports" description="Filter auditable platform activity, compare core operational signals, and export a focused report." actions={<><Button variant="secondary" onClick={load} loading={state.loading}><RefreshCw size={16} /> Refresh</Button><Button onClick={exportReport} disabled={!rows.length}><Download size={16} /> Export CSV</Button></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {reportCards.map((item) => (
        <AdminMetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          detail={item.detail}
          icon={item.icon}
          tone={item.tone}
          href={item.href}
        />
      ))}
    </div>
    <div className="admin-panel grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4"><label className="admin-label">From date<input className="admin-input" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label><label className="admin-label">To date<input className="admin-input" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label><label className="admin-label">Module<select className="admin-input" value={filters.module} onChange={(event) => setFilters((current) => ({ ...current, module: event.target.value }))}><option value="ALL">All modules</option>{modules.map((item) => <option key={item}>{item}</option>)}</select></label><label className="admin-label">Search report<input className="admin-input" type="search" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Action or actor" /></label></div>
    {state.error ? <div className="admin-panel p-8 text-center text-red-600 dark:text-red-200">{state.error}</div> : null}
    {!state.loading && !state.error && !rows.length ? <AdminEmptyState title="No matching report rows" message="Change the date, module, or search filters and try again." /> : null}
    {rows.length ? <div className="admin-table-card overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead><tr>{['Date', 'Action', 'Module', 'Actor', 'Entity', 'IP address'].map((label) => <th key={label} className="px-4 py-3 text-xs uppercase tracking-wider text-[var(--text-muted)]">{label}</th>)}</tr></thead><tbody>{rows.slice(0, 250).map((row) => <tr key={row.id} className="border-t border-[var(--border-color)]"><td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(row.createdAt).toLocaleString()}</td><td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{row.action}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{row.entityType || '—'}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{row.user?.email || row.user?.name || 'System'}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{row.entityId || '—'}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{row.ipAddress || '—'}</td></tr>)}</tbody></table></div> : null}
  </section>
}

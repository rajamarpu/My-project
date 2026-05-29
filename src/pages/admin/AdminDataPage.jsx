import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Ban, CheckCircle2, Search, Trash2, XCircle } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { AdminEmptyState, AdminLoadingState, AdminNotice, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import {
  approveAdminUser,
  deleteAdminUser,
  deleteAdminCourse,
  fetchAdminActivityLogs,
  fetchAdminCategories,
  fetchAdminCertificates,
  fetchAdminCourses,
  fetchAdminEnrollments,
  fetchAdminInstructorChanges,
  fetchAdminInstructors,
  fetchAdminLearners,
  fetchAdminNotifications,
  fetchAdminPayments,
  fetchAdminUsers,
  rejectAdminUser,
  suspendAdminUser,
  updateAdminCourse,
} from '../../api/api.js'

const resources = {
  users: {
    eyebrow: 'People',
    title: 'All users',
    description: 'Every account stored in PostgreSQL.',
    load: fetchAdminUsers,
    rows: (data) => data.users || [],
    columns: ['name', 'email', 'role', 'approvalStatus', 'isActive', 'createdAt'],
  },
  learners: {
    eyebrow: 'People',
    title: 'Learners',
    description: 'Learner accounts only.',
    load: fetchAdminLearners,
    rows: (data) => data.learners || data.users || [],
    columns: ['name', 'email', 'role', 'approvalStatus', 'isActive', 'createdAt'],
  },
  instructors: {
    eyebrow: 'People',
    title: 'Instructors',
    description: 'Instructor accounts only. Shows zero when no instructor users exist.',
    load: fetchAdminInstructors,
    rows: (data) => data.instructors || data.users || [],
    columns: ['name', 'email', 'role', 'approvalStatus', 'isActive', 'createdAt'],
  },
  courses: {
    eyebrow: 'Catalog',
    title: 'Courses',
    description: 'All published and unpublished courses.',
    load: fetchAdminCourses,
    rows: (data) => data.courses || [],
    columns: ['title', 'category', 'level', 'isPublished', 'enrollments', 'createdAt'],
    actions: 'courses',
  },
  categories: {
    eyebrow: 'Catalog',
    title: 'Categories',
    description: 'Course categories from the database.',
    load: fetchAdminCategories,
    rows: (data) => data.categories || [],
    columns: ['name', 'slug', 'isActive', 'courses', 'createdAt'],
  },
  enrollments: {
    eyebrow: 'Learning',
    title: 'Enrollments',
    description: 'Real learner-course enrollment records.',
    load: fetchAdminEnrollments,
    rows: (data) => data.enrollments || [],
    columns: ['learner', 'course', 'currentInstructor', 'instructorChanges', 'completionPct', 'hoursStudied', 'enrolledAt'],
  },
  'instructor-changes': {
    eyebrow: 'Learning',
    title: 'Instructor changes',
    description: 'Audit history for learner instructor switches during courses.',
    load: fetchAdminInstructorChanges,
    rows: (data) => data.changes || [],
    columns: ['learner', 'course', 'fromInstructor', 'toInstructor', 'changedBy', 'reason', 'createdAt'],
  },
  certificates: {
    eyebrow: 'Credentialing',
    title: 'Certificates',
    description: 'Certificates issued from PostgreSQL records.',
    load: fetchAdminCertificates,
    rows: (data) => data.certificates || [],
    columns: ['learner', 'course', 'certificateNo', 'status', 'issuedAt'],
  },
  notifications: {
    eyebrow: 'Messaging',
    title: 'Notifications',
    description: 'Notifications saved for platform users.',
    load: fetchAdminNotifications,
    rows: (data) => data.notifications || [],
    columns: ['title', 'body', 'user', 'isRead', 'createdAt'],
  },
  payments: {
    eyebrow: 'Billing',
    title: 'Payments',
    description: 'Payment rows and revenue status.',
    load: fetchAdminPayments,
    rows: (data) => data.payments || [],
    columns: ['user', 'course', 'amount', 'status', 'createdAt'],
  },
  revenue: {
    eyebrow: 'Billing',
    title: 'Revenue',
    description: 'Paid payment rows. Total revenue is calculated from PAID payments only.',
    load: fetchAdminPayments,
    rows: (data) => (data.payments || []).filter((payment) => payment.status === 'PAID'),
    columns: ['user', 'course', 'amount', 'status', 'createdAt'],
  },
  'activity-logs': {
    eyebrow: 'Security',
    title: 'Activity logs',
    description: 'Auth, settings, and operational activity.',
    load: fetchAdminActivityLogs,
    rows: (data) => data.activityLogs || [],
    columns: ['action', 'user', 'entityType', 'ipAddress', 'createdAt'],
  },
  analytics: {
    eyebrow: 'Analytics',
    title: 'Analytics',
    description: 'Use the dashboard charts for real event trends, and reports for tabular operations.',
    load: fetchAdminActivityLogs,
    rows: (data) => data.activityLogs || [],
    columns: ['action', 'user', 'entityType', 'ipAddress', 'createdAt'],
  },
  reports: {
    eyebrow: 'Reports',
    title: 'Reports',
    description: 'Operational report rows from activity logs.',
    load: fetchAdminActivityLogs,
    rows: (data) => data.activityLogs || [],
    columns: ['action', 'user', 'entityType', 'ipAddress', 'createdAt'],
  },
}

const dateColumns = new Set(['createdAt', 'updatedAt', 'deletedAt', 'enrolledAt', 'issuedAt', 'expiresAt', 'completedAt'])

function valueFor(row, column) {
  if (column === 'learner') return row.user?.name || row.user?.email || ''
  if (column === 'user') return row.user?.name || row.user?.email || ''
  if (column === 'course') return row.course?.title || ''
  if (column === 'currentInstructor') return row.currentInstructor?.name || ''
  if (column === 'fromInstructor') return row.fromInstructor?.name || 'Original instructor'
  if (column === 'toInstructor') return row.toInstructor?.name || ''
  if (column === 'changedBy') return row.changedBy?.name || row.changedBy?.email || ''
  if (column === 'instructorChanges') return row.instructorChanges?.length ?? 0
  if (column === 'approvalStatus') return row.approvalStatus || 'APPROVED'
  if (column === 'courses') return row._count?.courses ?? 0
  if (column === 'enrollments') return row._count?.enrollments ?? 0
  if (column === 'amount') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: row.currency || 'INR' }).format((row.amountCents || 0) / 100)
  const value = row[column]
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (dateColumns.has(column) && value) return new Date(value).toLocaleString()
  return value ?? ''
}

export default function AdminDataPage({ resource }) {
  const navigate = useNavigate()
  const location = useLocation()
  const authUser = useSelector((state) => state.auth.user)
  const config = resources[resource] || resources.users
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState('')
  const [notice, setNotice] = useState({ type: '', message: '' })
  const [error, setError] = useState('')
  const hasActions = config.actions || ['users', 'learners', 'instructors', 'categories'].includes(resource)

  async function load() {
    try {
      setLoading(true)
      setError('')
      setNotice({ type: '', message: '' })
      const response = await config.load()
      setRows(config.rows(response.data))
    } catch (err) {
      setRows([])
      setError(err?.response?.data?.message || err.message || `Failed to load ${config.title}.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(initial)
    // The loader intentionally follows the selected resource and query string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, location.search])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
  }, [query, rows])

  async function togglePublish(course) {
    await updateAdminCourse(course.id, { isPublished: !course.isPublished })
    await load()
  }

  async function removeCourse(course) {
    if (!window.confirm(`Delete "${course.title}"?`)) return
    await deleteAdminCourse(course.id)
    await load()
  }

  async function approveUser(user) {
    await moderateUser(user, 'approve')
  }

  async function rejectUser(user) {
    if (!window.confirm(`Reject "${user.name || user.email}" and disable their access?`)) return
    await moderateUser(user, 'reject')
  }

  async function suspendUser(user) {
    if (!window.confirm(`Suspend "${user.name || user.email}" and revoke active sessions?`)) return
    await moderateUser(user, 'suspend')
  }

  async function moderateUser(user, action) {
    const key = `${action}:${user.id}`
    const requestByAction = {
      approve: approveAdminUser,
      reject: rejectAdminUser,
      suspend: suspendAdminUser,
    }
    const pastTense = {
      approve: 'approved',
      reject: 'rejected',
      suspend: 'suspended',
    }
    try {
      setActionKey(key)
      setError('')
      setNotice({ type: '', message: '' })
      const response = await requestByAction[action](user.id)
      const updatedUser = response.data.user
      setRows((currentRows) => currentRows.map((row) => (row.id === updatedUser.id ? { ...row, ...updatedUser } : row)))
      setNotice({ type: 'success', message: `${updatedUser.name || updatedUser.email} ${pastTense[action]} successfully.` })
    } catch (err) {
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || `Could not ${action} user.` })
    } finally {
      setActionKey('')
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Remove "${user.name || user.email}"?`)) return
    await deleteAdminUser(user.id)
    await load()
  }

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={(
          <>
            {resource === 'courses' ? <Button onClick={() => navigate('/admin/upload-course')}>Upload Course</Button> : null}
            {resource === 'categories' ? <Button onClick={() => navigate('/admin/create-category')}>Create Category</Button> : null}
            {resource === 'certificates' ? <Button onClick={() => navigate('/admin/generate-certificate')}>Generate Certificate</Button> : null}
            <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          </>
        )}
      />
      <AdminNotice type="error">{error}</AdminNotice>
      <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>

      <div className="admin-panel p-4">
        <label className="theme-subcard flex items-center gap-3 rounded-lg px-4 py-3 text-[var(--text-secondary)]">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder={`Search ${config.title.toLowerCase()}`} />
        </label>
      </div>

      {loading ? <AdminLoadingState label={`Loading ${config.title.toLowerCase()}...`} /> : null}

      {!loading && !filtered.length ? <AdminEmptyState title={`No ${config.title.toLowerCase()} found`} message="Try another search term or refresh the latest database rows." /> : null}

      {!loading && filtered.length ? (
        <div className="grid gap-3 md:hidden">
          {filtered.map((row) => (
            <div key={row.id} className="admin-panel p-4">
              <div className="grid gap-3">
                {config.columns.map((column) => (
                  <div key={column} className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] pb-2 last:border-0 last:pb-0">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{column}</span>
                    <span className="max-w-[60%] text-right text-sm font-medium text-[var(--text-primary)]">{String(valueFor(row, column))}</span>
                  </div>
                ))}
              </div>
              {hasActions ? <div className="mt-4">{renderActions(row)}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length ? (
      <div className="admin-table-card hidden md:block">
        <div className="admin-scrollbar overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)] text-sm">
            <thead className="bg-[var(--bg-subtle)]">
              <tr>
                {config.columns.map((column) => (
                  <th key={column} className="px-4 py-3 text-left font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{column}</th>
                ))}
                {hasActions ? <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map((row) => (
                <tr key={row.id} className="transition hover:bg-[var(--bg-subtle)]">
                  {config.columns.map((column) => (
                    <td key={column} className="max-w-xs px-4 py-3 text-[var(--text-primary)]">{String(valueFor(row, column))}</td>
                  ))}
                  {hasActions ? <td className="px-4 py-3">{renderActions(row)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}
    </section>
  )

  function renderActions(row) {
    if (config.actions === 'courses') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(`/admin/edit-course/${row.id}`)}>Edit</Button>
          <Button variant="secondary" onClick={() => togglePublish(row)}>{row.isPublished ? 'Unpublish' : 'Publish'}</Button>
          <button type="button" onClick={() => removeCourse(row)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-500/10 dark:text-red-200" aria-label="Delete course">
            <Trash2 size={17} />
          </button>
        </div>
      )
    }

    if (resource === 'users' || resource === 'learners' || resource === 'instructors') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <ModerationButton label="Approve" icon={<CheckCircle2 size={16} />} disabled={actionKey !== '' || (row.approvalStatus === 'APPROVED' && row.isActive)} loading={actionKey === `approve:${row.id}`} onClick={() => approveUser(row)} />
          <ModerationButton label="Suspend" icon={<Ban size={16} />} disabled={actionKey !== '' || row.approvalStatus === 'SUSPENDED' || Number(authUser?.id) === Number(row.id)} loading={actionKey === `suspend:${row.id}`} onClick={() => suspendUser(row)} />
          <ModerationButton label="Reject" icon={<XCircle size={16} />} disabled={actionKey !== '' || row.approvalStatus === 'REJECTED' || Number(authUser?.id) === Number(row.id)} loading={actionKey === `reject:${row.id}`} onClick={() => rejectUser(row)} />
          <button type="button" onClick={() => removeUser(row)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-500/10 dark:text-red-200" aria-label="Remove user">
            <Trash2 size={17} />
          </button>
        </div>
      )
    }

    if (resource === 'categories') {
      return (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(`/admin/edit-category/${row.id}`)}>Edit</Button>
        </div>
      )
    }

    return null
  }
}

function ModerationButton({ label, icon, loading, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {icon}
      {loading ? 'Working...' : label}
    </button>
  )
}

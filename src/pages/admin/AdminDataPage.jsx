import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Trash2 } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import {
  approveAdminUser,
  deleteAdminUser,
  deleteAdminCourse,
  fetchAdminActivityLogs,
  fetchAdminCategories,
  fetchAdminCertificates,
  fetchAdminCourses,
  fetchAdminEnrollments,
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

function valueFor(row, column) {
  if (column === 'learner') return row.user?.name || row.user?.email || ''
  if (column === 'user') return row.user?.name || row.user?.email || ''
  if (column === 'course') return row.course?.title || ''
  if (column === 'currentInstructor') return row.currentInstructor?.name || ''
  if (column === 'instructorChanges') return row.instructorChanges?.length ?? 0
  if (column === 'approvalStatus') return row.approvalStatus || 'APPROVED'
  if (column === 'courses') return row._count?.courses ?? 0
  if (column === 'enrollments') return row._count?.enrollments ?? 0
  if (column === 'amount') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: row.currency || 'INR' }).format((row.amountCents || 0) / 100)
  const value = row[column]
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (column.toLowerCase().includes('at') && value) return new Date(value).toLocaleString()
  return value ?? ''
}

export default function AdminDataPage({ resource }) {
  const navigate = useNavigate()
  const location = useLocation()
  const config = resources[resource] || resources.users
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const hasActions = config.actions || ['users', 'learners', 'instructors', 'categories'].includes(resource)

  async function load() {
    try {
      setLoading(true)
      setError('')
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
    await approveAdminUser(user.id)
    await load()
  }

  async function rejectUser(user) {
    await rejectAdminUser(user.id)
    await load()
  }

  async function suspendUser(user) {
    await suspendAdminUser(user.id)
    await load()
  }

  async function removeUser(user) {
    if (!window.confirm(`Remove "${user.name || user.email}"?`)) return
    await deleteAdminUser(user.id)
    await load()
  }

  return (
    <section className="space-y-6 pb-16">
      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">{config.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{config.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {resource === 'courses' ? <Button onClick={() => navigate('/admin/upload-course')}>Upload Course</Button> : null}
            {resource === 'categories' ? <Button onClick={() => navigate('/admin/create-category')}>Create Category</Button> : null}
            <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          </div>
        </div>
        {error ? <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-slate-300">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" placeholder={`Search ${config.title.toLowerCase()}`} />
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/80">
              <tr>
                {config.columns.map((column) => (
                  <th key={column} className="px-4 py-3 text-left font-semibold uppercase tracking-[0.12em] text-slate-400">{column}</th>
                ))}
                {hasActions ? <th className="px-4 py-3 text-right font-semibold uppercase tracking-[0.12em] text-slate-400">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr><td colSpan={config.columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-slate-400">Loading database rows...</td></tr>
              ) : filtered.length ? filtered.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.03]">
                  {config.columns.map((column) => (
                    <td key={column} className="max-w-xs px-4 py-3 text-slate-200">{String(valueFor(row, column))}</td>
                  ))}
                  {config.actions === 'courses' ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => navigate(`/admin/edit-course/${row.id}`)}>Edit</Button>
                        <Button variant="secondary" onClick={() => togglePublish(row)}>{row.isPublished ? 'Unpublish' : 'Publish'}</Button>
                        <button type="button" onClick={() => removeCourse(row)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-400/30 text-red-200 hover:bg-red-500/10" aria-label="Delete course">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  ) : (resource === 'users' || resource === 'learners' || resource === 'instructors') ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="secondary" onClick={() => approveUser(row)}>Approve</Button>
                        <Button variant="secondary" onClick={() => suspendUser(row)}>Suspend</Button>
                        <Button variant="secondary" onClick={() => rejectUser(row)}>Reject</Button>
                        <button type="button" onClick={() => removeUser(row)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-400/30 text-red-200 hover:bg-red-500/10" aria-label="Remove user">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  ) : resource === 'categories' ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => navigate(`/admin/edit-category/${row.id}`)}>Edit</Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              )) : (
                <tr><td colSpan={config.columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-slate-400">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

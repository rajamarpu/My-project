import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Ban, CheckCircle2, Trash2, XCircle } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import { AdminEmptyState, AdminModal, AdminNotice, AdminPageHeader, AdminToastStack } from '../../components/admin/AdminUI.jsx'
import {
  approveAdminUser,
  deleteAdminCertificate,
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
import { formatRupeesFromPaise } from '../../utils/money.js'

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
    columns: ['title', 'category', 'level', 'priceCents', 'isPublished', 'enrollments', 'createdAt'],
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
    actions: 'certificates',
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
  if (column === 'priceCents') return formatRupeesFromPaise(row.priceCents)
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
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState('')
  const [notice, setNotice] = useState({ type: '', message: '' })
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [toasts, setToasts] = useState([])
  const hasActions = config.actions || ['users', 'learners', 'instructors', 'categories'].includes(resource)

  function toast(type, message) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const duration = { success: 3000, error: 5000, warning: 4000 }[type] || 4000
    setToasts((current) => [...current, { id, type, message }])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), duration)
  }

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

  async function togglePublish(course) {
    await updateAdminCourse(course.id, { isPublished: !course.isPublished })
    toast('success', `${course.title} ${course.isPublished ? 'unpublished' : 'published'}.`)
    await load()
  }

  function confirmDelete(items) {
    const rowsToDelete = Array.isArray(items) ? items : [items]
    setModal({
      tone: 'danger',
      title: `Delete ${rowsToDelete.length} selected row${rowsToDelete.length === 1 ? '' : 's'}?`,
      message: 'This action can permanently remove records where the API supports deletion.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setModal(null)
        await deleteRows(rowsToDelete)
      },
    })
  }

  async function approveUser(user) {
    await moderateUser(user, 'approve')
  }

  async function rejectUser(user) {
    setModal({
      tone: 'danger',
      title: `Reject ${user.name || user.email}?`,
      message: 'This disables access for the selected account.',
      confirmLabel: 'Reject',
      onConfirm: async () => {
        setModal(null)
        await moderateUser(user, 'reject')
      },
    })
  }

  async function suspendUser(user) {
    setModal({
      tone: 'danger',
      title: `Suspend ${user.name || user.email}?`,
      message: 'This revokes active sessions for the selected account.',
      confirmLabel: 'Suspend',
      onConfirm: async () => {
        setModal(null)
        await moderateUser(user, 'suspend')
      },
    })
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
      toast('success', `${updatedUser.name || updatedUser.email} ${pastTense[action]}.`)
    } catch (err) {
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || `Could not ${action} user.` })
      toast('error', err?.response?.data?.message || err.message || `Could not ${action} user.`)
    } finally {
      setActionKey('')
    }
  }

  async function deleteRows(items) {
    try {
      const deletable = items.filter((item) => item?.id)
      if (config.actions === 'courses') {
        await Promise.all(deletable.map((item) => deleteAdminCourse(item.id)))
        toast('success', `${deletable.length} course${deletable.length === 1 ? '' : 's'} deleted.`)
        await load()
        return
      }
      if (config.actions === 'certificates') {
        await Promise.all(deletable.map((item) => deleteAdminCertificate(item.id)))
        toast('success', `${deletable.length} certificate${deletable.length === 1 ? '' : 's'} deleted.`)
        await load()
        return
      }
      if (resource === 'users' || resource === 'learners' || resource === 'instructors') {
        await Promise.all(deletable.filter((item) => Number(authUser?.id) !== Number(item.id)).map((item) => deleteAdminUser(item.id)))
        toast('success', `${deletable.length} user row${deletable.length === 1 ? '' : 's'} deleted.`)
        await load()
        return
      }
      toast('warning', 'Delete is not available for this resource yet.')
    } catch (err) {
      toast('error', err?.response?.data?.message || err.message || 'Delete failed.')
    }
  }

  function archiveRows(items) {
    const keys = new Set(items.map((item) => item.id))
    setRows((currentRows) => currentRows.map((row) => (keys.has(row.id) ? { ...row, archived: true } : row)))
    toast('warning', `${items.length} row${items.length === 1 ? '' : 's'} marked archived locally.`)
  }

  function viewRow(row) {
    setModal({
      title: 'Row details',
      message: '',
      confirmLabel: 'Done',
      onConfirm: () => setModal(null),
      children: (
        <pre className="max-h-80 overflow-auto rounded-lg bg-[var(--bg-subtle)] p-3 text-left text-xs text-[var(--text-secondary)]">
          {JSON.stringify(row, null, 2)}
        </pre>
      ),
    })
  }

  function editRow(row) {
    if (resource === 'courses') navigate(`/admin/edit-course/${row.id}`)
    else if (resource === 'categories') navigate(`/admin/edit-category/${row.id}`)
    else toast('warning', 'Inline edit is not configured for this resource yet.')
  }

  return (
    <section className="admin-data-page space-y-5 pb-10">
      <AdminPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={(
          <>
            {resource === 'courses' ? <Button onClick={() => navigate('/admin/upload-course')}>Upload Course</Button> : null}
            {resource === 'categories' ? <Button onClick={() => navigate('/admin/create-category')}>Create Category</Button> : null}
            {resource === 'certificates' ? <Button onClick={() => navigate('/admin/generate-certificate')}>Generate Certificate</Button> : null}
            {resource === 'instructors' ? <Button onClick={() => navigate('/admin/add-instructor')}>Add Instructor</Button> : null}
            <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          </>
        )}
      />
      <AdminNotice type="error">{error}</AdminNotice>
      <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>

      <AdminDataTable
        title={config.title}
        rows={rows}
        columns={config.columns}
        valueFor={valueFor}
        loading={loading}
        error={error}
        onRetry={load}
        emptyState={<AdminEmptyState title={`No ${config.title} Yet`} message={resource === 'courses' ? 'Ready to create your first course?' : 'Try refreshing or clearing filters to see the latest rows.'} />}
        renderActions={hasActions ? renderActions : null}
        onDeleteRows={confirmDelete}
        onArchiveRows={archiveRows}
        onViewRow={viewRow}
        onEditRow={editRow}
        onDeleteRow={confirmDelete}
        onArchiveRow={(row) => archiveRows([row])}
        toast={toast}
      />
      <AdminModal
        open={Boolean(modal)}
        title={modal?.title}
        message={modal?.message}
        confirmLabel={modal?.confirmLabel}
        tone={modal?.tone}
        onConfirm={modal?.onConfirm}
        onClose={() => setModal(null)}
      >
        {modal?.children}
      </AdminModal>
      <AdminToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((item) => item.id !== id))} />
    </section>
  )

  function renderActions(row) {
    if (config.actions === 'courses') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(`/admin/edit-course/${row.id}`)}>Edit</Button>
          <Button variant="secondary" onClick={() => togglePublish(row)}>{row.isPublished ? 'Unpublish' : 'Publish'}</Button>
          <button type="button" onClick={() => confirmDelete(row)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-500/10 dark:text-red-200" aria-label="Delete course">
            <Trash2 size={17} />
          </button>
        </div>
      )
    }

    if (config.actions === 'certificates') {
      return (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => confirmDelete(row)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-500/10 dark:text-red-200" aria-label="Delete certificate">
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
          <button type="button" onClick={() => confirmDelete(row)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-500/10 dark:text-red-200" aria-label="Remove user">
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

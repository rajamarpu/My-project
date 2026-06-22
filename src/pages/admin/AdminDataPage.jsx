import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, Award, Ban, BarChart3, BookOpenCheck, CheckCircle2, Clock3, CreditCard, FolderTree, Gauge, GraduationCap, ShieldCheck, Trash2, TrendingUp, UserCheck, Users, XCircle, Zap } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import { AdminEmptyState, AdminGuidancePanel, AdminInsightStrip, AdminModal, AdminNotice, AdminPageHeader, AdminStatusBadge, AdminToastStack } from '../../components/admin/AdminUI.jsx'
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
  fetchAdminOverview,
  fetchAdminPayments,
  fetchAdminUsers,
  rejectAdminUser,
  requestAdminPaymentRefund,
  suspendAdminUser,
  updateAdminPaymentStatus,
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
    actions: 'payments',
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
    title: 'Learner activity logs',
    description: 'Learner actions, auth, settings, course progress, assessments, practice questions, and operational activity.',
    load: fetchAdminActivityLogs,
    rows: (data) => data.activityLogs || [],
    columns: ['action', 'user', 'entityType', 'entityId', 'details', 'ipAddress', 'createdAt'],
  },
  analytics: {
    eyebrow: 'Analytics',
    title: 'Analytics',
    description: 'Platform growth, learning activity, user moderation actions, completions, and revenue signals.',
    load: fetchAdminOverview,
    rows: (data) => data.analytics?.growth || [],
    columns: ['date', 'registrations', 'userCreations', 'userApprovals', 'userRejections', 'userSuspensions', 'userDeletions', 'enrollments', 'completions', 'revenueCents'],
  },
  reports: {
    eyebrow: 'Reports',
    title: 'Reports',
    description: 'Operational report rows from activity logs.',
    load: fetchAdminActivityLogs,
    rows: (data) => data.activityLogs || [],
    columns: ['action', 'user', 'entityType', 'entityId', 'details', 'ipAddress', 'createdAt'],
  },
}

const dateColumns = new Set(['createdAt', 'updatedAt', 'deletedAt', 'enrolledAt', 'issuedAt', 'expiresAt', 'completedAt'])
const peopleResources = new Set(['users', 'learners', 'instructors'])

function displayName(person) {
  return person?.name || person?.fullName || person?.email || ''
}

function valueFor(row, column) {
  if (column === 'learner') return displayName(row.learner) || displayName(row.user)
  if (column === 'user') return displayName(row.user) || displayName(row.learner)
  if (column === 'course') return row.course?.title || ''
  if (column === 'currentInstructor') return displayName(row.currentInstructor)
  if (column === 'fromInstructor') return displayName(row.fromInstructor) || 'Original instructor'
  if (column === 'toInstructor') return displayName(row.toInstructor)
  if (column === 'changedBy') return displayName(row.changedBy)
  if (column === 'instructorChanges') return row.instructorChanges?.length ?? 0
  if (column === 'approvalStatus') return row.approvalStatus || 'APPROVED'
  if (column === 'courses') return row._count?.courses ?? 0
  if (column === 'enrollments') return row._count?.enrollments ?? 0
  if (column === 'priceCents') return formatRupeesFromPaise(row.priceCents)
  if (column === 'amount') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: row.currency || 'INR' }).format((row.amountCents || 0) / 100)
  if (column === 'revenueCents') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((row.revenueCents || 0) / 100)
  if (column === 'details') return summarizeMetadata(row.metadata)
  const value = row[column]
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (dateColumns.has(column) && value) return new Date(value).toLocaleString()
  return value ?? ''
}

function summarizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return ''
  const preferred = [
    ['courseTitle', 'Course'],
    ['courseId', 'Course'],
    ['assignmentName', 'Assessment'],
    ['assignmentId', 'Assessment'],
    ['submissionId', 'Submission'],
    ['questionId', 'Question'],
    ['questionType', 'Type'],
    ['status', 'Status'],
    ['result', 'Result'],
    ['percentage', 'Score'],
    ['percentComplete', 'Progress'],
    ['watchedSeconds', 'Watch'],
    ['instructorName', 'Instructor'],
    ['roomId', 'Room'],
    ['fields', 'Fields'],
  ]
  return preferred
    .filter(([key]) => metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '')
    .map(([key, label]) => {
      const value = Array.isArray(metadata[key]) ? metadata[key].join(', ') : metadata[key]
      if (key === 'percentage' || key === 'percentComplete') return `${label}: ${value}%`
      if (key === 'watchedSeconds') return `${label}: ${Math.round(Number(value || 0))}s`
      return `${label}: ${value}`
    })
    .join(' | ')
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
  const insights = buildInsights(resource, rows)
  const guidance = buildGuidance(resource)
  const enterpriseSignals = peopleResources.has(resource) ? null : buildEnterpriseSignals(resource, rows)

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

  function viewRow(row) {
    setModal({
      title: `${config.title} quick view`,
      message: '',
      confirmLabel: 'Done',
      onConfirm: () => setModal(null),
      children: peopleResources.has(resource)
        ? <UserDetailsArea user={row} />
        : <RecordQuickView row={row} resource={resource} columns={config.columns} />,
    })
  }

  function editRow(row) {
    if (resource === 'courses') navigate(`/admin/edit-course/${row.id}`)
    else if (resource === 'categories') navigate(`/admin/edit-category/${row.id}`)
    else viewRow(row)
  }

  async function updatePayment(row, status) {
    try {
      setActionKey(`${status}-${row.id}`)
      const response = await updateAdminPaymentStatus(row.id, status)
      setRows((items) => items.map((item) => item.id === row.id ? { ...item, ...response.data.payment } : item))
      toast('success', `Payment marked ${status.toLowerCase()}.`)
    } catch (err) { toast('error', err?.response?.data?.message || 'Could not update payment.') }
    finally { setActionKey('') }
  }

  function confirmRefund(row) {
    setModal({
      title: 'Request payment refund',
      message: `Request a full provider refund for ${valueFor(row, 'amount')}? The payment will remain refund-pending until the provider confirms it.`,
      confirmLabel: 'Request refund',
      tone: 'danger',
      onConfirm: async () => {
        try { setActionKey(`refund-${row.id}`); const response = await requestAdminPaymentRefund(row.id, { reason: 'Admin-requested refund' }); setRows((items) => items.map((item) => item.id === row.id ? { ...item, ...response.data.payment } : item)); toast('success', 'Refund request recorded for provider processing.'); setModal(null) }
        catch (err) { toast('error', err?.response?.data?.message || 'Could not request refund.') }
        finally { setActionKey('') }
      },
    })
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
            <Button variant="secondary" onClick={load} loading={loading} loadingLabel="Loading...">Refresh</Button>
          </>
        )}
      />
      <AdminNotice type="error">{error}</AdminNotice>
      <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>

      <AdminInsightStrip items={insights} />
      <EnterpriseOperationsPanel signals={enterpriseSignals} />
      {resource === 'users' ? null : <AdminGuidancePanel title="Productivity workflow" items={guidance} />}

      <AdminDataTable
        title={config.title}
        rows={rows}
        columns={config.columns}
        valueFor={valueFor}
        loading={loading}
        error={error}
        onRetry={load}
        emptyState={<AdminEmptyState title={`No ${config.title} Yet`} message={emptyMessage(resource)} actionLabel={emptyAction(resource)?.label} onAction={emptyAction(resource)?.onClick ? () => navigate(emptyAction(resource).onClick) : undefined} />}
        renderActions={hasActions ? renderActions : null}
        onDeleteRows={confirmDelete}
        onArchiveRows={null}
        onViewRow={viewRow}
        onEditRow={editRow}
        onDeleteRow={confirmDelete}
        onArchiveRow={null}
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
    if (config.actions === 'payments') {
      return <div className="flex flex-wrap justify-end gap-2">{row.status === 'PENDING' ? <Button variant="secondary" loading={actionKey === `CANCELLED-${row.id}`} onClick={() => updatePayment(row, 'CANCELLED')}>Cancel</Button> : null}{row.status === 'PAID' ? <Button variant="secondary" loading={actionKey === `refund-${row.id}`} onClick={() => confirmRefund(row)}>Request refund</Button> : null}</div>
    }
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

function EnterpriseOperationsPanel({ signals }) {
  if (!signals) return null
  return (
    <div className="admin-panel p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Enterprise command layer</p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{signals.title}</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-secondary)]">{signals.summary}</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))]">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Score</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{signals.score}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Operational health rating</p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Priority</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{signals.priority}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">What the team should do next</p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Risk</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{signals.risk}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Current watch-out for this view</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Automation</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{signals.automation}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Review note</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{signals.review}</p>
        </div>
      </div>
    </div>
  )
}

function buildEnterpriseSignals(resource, rows) {
  const total = rows.length
  const base = {
    title: 'Operational readiness',
    summary: 'Use this view to spot work queues, reduce manual checking, and keep the platform moving cleanly.',
    score: total ? 8 : 6,
    tone: total ? 'good' : 'watch',
    priority: 'Review the newest records, then export filtered rows for team follow-up.',
    risk: total ? 'No severe pattern detected from this table view.' : 'No live rows are available, so the admin team has limited operational visibility.',
    automation: 'Use filters and bulk actions to reduce repeated one-row admin work.',
    review: 'Open quick view before editing or deleting records.',
    cards: [
      { label: 'Rows monitored', value: total, detail: 'records loaded into this module', icon: BarChart3, tone: 'blue' },
      { label: 'Productivity', value: total > 25 ? 'High' : 'Normal', detail: 'table tools are ready for sorting, filtering, and export', icon: Zap, tone: 'teal' },
      { label: 'Governance', value: 'Tracked', detail: 'quick view and export support admin review', icon: ShieldCheck, tone: 'orange' },
    ],
  }

  if (peopleResources.has(resource)) {
    const approved = rows.filter((row) => String(row.approvalStatus || 'APPROVED').toUpperCase() === 'APPROVED').length
    const pending = rows.filter((row) => String(row.approvalStatus || '').toUpperCase() === 'PENDING').length
    const suspended = rows.filter((row) => row.isActive === false || String(row.approvalStatus || '').toUpperCase() === 'SUSPENDED').length
    const score = total ? Math.max(5, Math.min(10, Math.round(((approved - suspended) / Math.max(total, 1)) * 10))) : 6
    return {
      ...base,
      title: 'People operations health',
      summary: 'Account moderation, approval status, and access risk are summarized before admins enter the table.',
      score,
      tone: suspended ? 'risk' : pending ? 'watch' : 'good',
      priority: pending ? `Review ${pending} pending account${pending === 1 ? '' : 's'} before onboarding slows down.` : 'Keep the approved directory current and remove stale access quickly.',
      risk: suspended ? `${suspended} account${suspended === 1 ? '' : 's'} need access-state review.` : 'No suspended access state is visible in this module.',
      automation: 'Use filtered exports for weekly onboarding, approval, and learner success queues.',
      review: 'Check quick view before approve, suspend, reject, or delete actions.',
      cards: [
        { label: 'Approved rate', value: `${total ? Math.round((approved / total) * 100) : 0}%`, detail: `${approved}/${total} accounts approved`, icon: UserCheck, tone: 'blue' },
        { label: 'Pending queue', value: pending, detail: 'accounts awaiting admin decision', icon: Clock3, tone: 'amber' },
        { label: 'Access risk', value: suspended, detail: 'inactive or suspended records', icon: AlertTriangle, tone: 'rose' },
      ],
    }
  }

  if (resource === 'courses') {
    const published = rows.filter((row) => row.isPublished).length
    const drafts = Math.max(0, total - published)
    const enrollments = rows.reduce((sum, row) => sum + Number(row._count?.enrollments ?? row.enrollments ?? 0), 0)
    const score = total ? Math.max(5, Math.min(10, Math.round((published / total) * 10))) : 6
    return {
      ...base,
      title: 'Catalog quality command center',
      summary: 'Publishing quality, catalog depth, and demand signals are highlighted so admins can protect learner trust.',
      score,
      tone: drafts > published ? 'watch' : 'good',
      priority: drafts ? `Move ${drafts} draft course${drafts === 1 ? '' : 's'} through quality review or archive stale drafts.` : 'Keep published courses fresh with lessons, assessments, and certificate paths.',
      risk: drafts > published ? 'Draft volume is higher than published catalog depth.' : 'Catalog publishing ratio looks healthy from this view.',
      automation: 'Use saved filtered exports for draft review, published catalog QA, and high-demand course planning.',
      review: 'Before publishing, check title, category, thumbnail, lessons, assignments, and certificate readiness.',
      cards: [
        { label: 'Publish rate', value: `${total ? Math.round((published / total) * 100) : 0}%`, detail: `${published}/${total} courses visible`, icon: CheckCircle2, tone: 'blue' },
        { label: 'Demand', value: enrollments, detail: 'enrollments across visible rows', icon: TrendingUp, tone: 'teal' },
        { label: 'Draft risk', value: drafts, detail: 'courses not yet published', icon: Clock3, tone: 'amber' },
      ],
    }
  }

  if (resource === 'enrollments') {
    const completed = rows.filter((row) => Number(row.completionPct || 0) >= 100).length
    const atRisk = rows.filter((row) => Number(row.completionPct || 0) < 25).length
    const avg = total ? Math.round(rows.reduce((sum, row) => sum + Number(row.completionPct || 0), 0) / total) : 0
    return {
      ...base,
      title: 'Learner success intervention center',
      summary: 'Completion risk and progress health are surfaced so admins can improve course completion rates.',
      score: total ? Math.max(4, Math.min(10, Math.round(avg / 10))) : 6,
      tone: atRisk ? 'risk' : avg >= 70 ? 'excellent' : 'watch',
      priority: atRisk ? `Prioritize outreach to ${atRisk} low-progress enrollment${atRisk === 1 ? '' : 's'}.` : 'Keep learners moving with reminders and assessment nudges.',
      risk: atRisk ? 'Learners below 25% progress may churn without intervention.' : 'No low-progress enrollment is visible in this table.',
      automation: 'Export at-risk cohorts for reminder campaigns or mentor follow-up.',
      review: 'Compare completion percentage, hours studied, and instructor assignment before intervention.',
      cards: [
        { label: 'Average progress', value: `${avg}%`, detail: 'mean completion across rows', icon: Gauge, tone: 'blue' },
        { label: 'Completed', value: completed, detail: 'enrollments at 100%', icon: Award, tone: 'emerald' },
        { label: 'At risk', value: atRisk, detail: 'below 25% progress', icon: AlertTriangle, tone: 'rose' },
      ],
    }
  }

  if (resource === 'payments') {
    const paid = rows.filter((row) => String(row.status || '').toUpperCase() === 'PAID')
    const pending = rows.filter((row) => String(row.status || '').toUpperCase() === 'PENDING')
    const failed = rows.filter((row) => String(row.status || '').toUpperCase() === 'FAILED')
    return {
      ...base,
      title: 'Billing operations snapshot',
      summary: 'Transaction status, payment exceptions, and support follow-up are separated so finance can work faster.',
      score: failed.length ? 7 : paid.length ? 9 : 6,
      tone: failed.length ? 'risk' : pending.length ? 'watch' : 'good',
      priority: failed.length ? `Investigate ${failed.length} failed payment${failed.length === 1 ? '' : 's'} before reconciliation.` : 'Review pending transactions for support follow-up.',
      risk: pending.length ? `${pending.length} pending payment${pending.length === 1 ? '' : 's'} may still need closure.` : 'No pending payment state is visible in this module.',
      automation: 'Create filtered finance exports for paid, pending, and failed payment queues.',
      review: 'Confirm learner, course, amount, and status before refund or payment resolution decisions.',
      cards: [
        { label: 'Transactions', value: rows.length, detail: 'payment records in view', icon: CreditCard, tone: 'blue' },
        { label: 'Paid', value: paid.length, detail: 'successful payments', icon: CheckCircle2, tone: 'emerald' },
        { label: 'Pending', value: pending.length, detail: 'awaiting closure', icon: Clock3, tone: 'amber' },
        { label: 'Failed', value: failed.length, detail: 'payment exceptions', icon: AlertTriangle, tone: 'rose' },
      ],
    }
  }

  if (resource === 'revenue') {
    const paid = rows.filter((row) => String(row.status || '').toUpperCase() === 'PAID')
    const pending = rows.filter((row) => String(row.status || '').toUpperCase() === 'PENDING')
    const failed = rows.filter((row) => String(row.status || '').toUpperCase() === 'FAILED')
    const revenue = paid.reduce((sum, row) => sum + Number(row.amountCents || 0), 0)
    const averageTicket = paid.length ? revenue / paid.length : 0
    const paidRate = total ? Math.round((paid.length / total) * 100) : 0
    return {
      ...base,
      title: 'Revenue operations snapshot',
      summary: 'Earnings, average ticket size, and paid throughput are surfaced so leadership can read growth at a glance.',
      score: revenue > 0 ? (failed.length ? 8 : 9) : 6,
      tone: failed.length ? 'watch' : revenue > 0 ? 'good' : 'risk',
      priority: revenue > 0 ? 'Track paid revenue and ticket size before running weekly finance summaries.' : 'Drive more paid transactions so revenue has a stronger signal.',
      risk: pending.length ? `${pending.length} pending payment${pending.length === 1 ? '' : 's'} may delay revenue recognition.` : 'No pending payments are visible in this module.',
      automation: 'Export revenue by paid transaction, average ticket, and settlement rate for reporting.',
      review: 'Review paid totals, average ticket, and settlement status before finance close.',
      cards: [
        { label: 'Total revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue / 100), detail: 'paid revenue only', icon: TrendingUp, tone: 'violet' },
        { label: 'Paid transactions', value: paid.length, detail: 'closed payment rows', icon: CheckCircle2, tone: 'emerald' },
        { label: 'Average ticket', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(averageTicket / 100), detail: 'mean paid order value', icon: CreditCard, tone: 'sky' },
        { label: 'Paid rate', value: `${paidRate}%`, detail: 'paid vs total rows', icon: ShieldCheck, tone: 'blue' },
      ],
    }
  }

  if (resource === 'analytics') {
    const registrations = rows.reduce((sum, row) => sum + Number(row.registrations || 0), 0)
    const userActions = rows.reduce((sum, row) => sum + Number(row.userCreations || 0) + Number(row.userApprovals || 0) + Number(row.userRejections || 0) + Number(row.userSuspensions || 0) + Number(row.userDeletions || 0), 0)
    const enrollments = rows.reduce((sum, row) => sum + Number(row.enrollments || 0), 0)
    const completions = rows.reduce((sum, row) => sum + Number(row.completions || 0), 0)
    const revenue = rows.reduce((sum, row) => sum + Number(row.revenueCents || 0), 0)
    const activeDays = rows.filter((row) => Number(row.registrations || 0) || Number(row.userCreations || 0) || Number(row.userApprovals || 0) || Number(row.userRejections || 0) || Number(row.userSuspensions || 0) || Number(row.userDeletions || 0) || Number(row.enrollments || 0) || Number(row.completions || 0) || Number(row.revenueCents || 0)).length
    return {
      ...base,
      title: 'Platform growth intelligence',
      summary: 'Today-onward growth rows show whether learner acquisition, enrollment demand, completion momentum, and paid revenue are moving together.',
      score: activeDays ? Math.max(6, Math.min(10, Math.round((activeDays / Math.max(total, 1)) * 10))) : 5,
      tone: completions || revenue ? 'good' : enrollments ? 'watch' : 'risk',
      priority: enrollments ? 'Compare enrollment spikes with completions to find courses that need learner support.' : 'Create enrollment momentum so analytics has enough signal for trend review.',
      risk: registrations > enrollments ? 'Registrations are ahead of enrollments; review onboarding and course discovery.' : 'No major acquisition-to-enrollment gap is visible in this window.',
      automation: 'Export weekly growth rows for leadership trend reviews and course demand planning.',
      review: 'Read registrations, enrollments, completions, and revenue together before making catalog decisions.',
      cards: [
        { label: 'Registrations', value: registrations, detail: 'new users in this window', icon: Users, tone: 'blue' },
        { label: 'User actions', value: userActions, detail: 'admin moderation events', icon: ShieldCheck, tone: 'teal' },
        { label: 'Enrollments', value: enrollments, detail: 'course starts tracked daily', icon: GraduationCap, tone: 'orange' },
        { label: 'Completions', value: completions, detail: 'learning outcomes recorded', icon: Award, tone: 'emerald' },
        { label: 'Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue / 100), detail: 'paid revenue by day', icon: CreditCard, tone: 'violet' },
      ],
    }
  }

  if (resource === 'reports' || resource === 'activity-logs') {
    const actors = new Set(rows.map((row) => row.user?.id || row.user?.email).filter(Boolean)).size
    const modules = new Set(rows.map((row) => row.entityType || row.action).filter(Boolean)).size
    const loginEvents = rows.filter((row) => String(row.action || '').toLowerCase().includes('login')).length
    return {
      ...base,
      title: resource === 'reports' ? 'Executive report readiness' : 'Platform activity intelligence',
      summary: 'Audit events are translated into governance, security, and operating signals for faster admin decisions.',
      score: total ? 8 : 6,
      tone: loginEvents > Math.max(12, total * 0.5) ? 'watch' : 'good',
      priority: total ? 'Filter by module or actor to turn audit rows into a focused investigation or report.' : 'Connect more activity data so leadership reports have stronger signal.',
      risk: loginEvents ? `${loginEvents} login-related event${loginEvents === 1 ? '' : 's'} should be reviewed during security checks.` : 'No login-related event is visible in this slice.',
      automation: 'Export module-specific audit rows for weekly security, support, and operations reviews.',
      review: 'Use actor, module, IP address, and timestamp together before drawing conclusions.',
      cards: [
        { label: 'Audit events', value: total, detail: 'records available for review', icon: Activity, tone: 'blue' },
        { label: 'Actors', value: actors, detail: 'unique users represented', icon: Users, tone: 'teal' },
        { label: 'Modules', value: modules, detail: 'platform areas touched', icon: ShieldCheck, tone: 'orange' },
      ],
    }
  }

  return base
}

function buildInsights(resource, rows) {
  const total = rows.length
  if (peopleResources.has(resource)) {
    const approved = rows.filter((row) => String(row.approvalStatus || 'APPROVED').toUpperCase() === 'APPROVED').length
    const inactive = rows.filter((row) => row.isActive === false || String(row.approvalStatus || '').toUpperCase() === 'SUSPENDED').length
      return [
        { label: 'Directory size', value: total, detail: 'accounts in this view', icon: Users, tone: 'blue', href: '/admin/users' },
        { label: 'Approved', value: approved, detail: 'ready for platform access', icon: UserCheck, tone: 'teal', href: '/admin/users' },
        { label: 'Needs attention', value: Math.max(0, total - approved), detail: 'pending or rejected state', icon: ShieldCheck, tone: 'orange', href: '/admin/users' },
        { label: 'Risk flags', value: inactive, detail: 'inactive or suspended accounts', icon: Activity, tone: 'rose', href: '/admin/users' },
      ]
  }
  if (resource === 'courses') {
    const published = rows.filter((row) => row.isPublished).length
    const enrollments = rows.reduce((sum, row) => sum + Number(row._count?.enrollments ?? row.enrollments ?? 0), 0)
      return [
        { label: 'Catalog size', value: total, detail: 'courses in database', icon: BookOpenCheck, tone: 'blue', href: '/admin/courses' },
        { label: 'Published', value: published, detail: `${total ? Math.round((published / total) * 100) : 0}% publish rate`, icon: CheckCircle2, tone: 'emerald', href: '/admin/courses' },
        { label: 'Enrollments', value: enrollments, detail: 'visible demand signal', icon: TrendingUp, tone: 'violet', href: '/admin/enrollments' },
        { label: 'Draft risk', value: Math.max(0, total - published), detail: 'unpublished courses', icon: Clock3, tone: 'amber', href: '/admin/courses' },
      ]
  }
  if (resource === 'categories') {
    const active = rows.filter((row) => row.isActive !== false).length
    const courseCount = rows.reduce((sum, row) => sum + Number(row._count?.courses ?? 0), 0)
      return [
        { label: 'Categories', value: total, detail: 'catalog groups', icon: FolderTree, tone: 'blue', href: '/admin/categories' },
        { label: 'Active', value: active, detail: 'available for browsing', icon: CheckCircle2, tone: 'teal', href: '/admin/categories' },
        { label: 'Course links', value: courseCount, detail: 'distribution across categories', icon: BarChart3, tone: 'sky', href: '/admin/categories' },
        { label: 'Empty groups', value: rows.filter((row) => Number(row._count?.courses ?? 0) === 0).length, detail: 'need course assignment', icon: BookOpenCheck, tone: 'orange', href: '/admin/categories' },
      ]
  }
  if (resource === 'enrollments') {
    const completed = rows.filter((row) => Number(row.completionPct || 0) >= 100).length
    const atRisk = rows.filter((row) => Number(row.completionPct || 0) < 25).length
    const avg = total ? Math.round(rows.reduce((sum, row) => sum + Number(row.completionPct || 0), 0) / total) : 0
      return [
        { label: 'Enrollments', value: total, detail: 'learner-course records', icon: GraduationCap, tone: 'blue', href: '/admin/enrollments' },
        { label: 'Completed', value: completed, detail: '100% progress', icon: Award, tone: 'emerald', href: '/admin/enrollments' },
        { label: 'At risk', value: atRisk, detail: 'below 25% progress', icon: Activity, tone: 'rose', href: '/admin/enrollments' },
        { label: 'Average progress', value: `${avg}%`, detail: 'completion forecast signal', icon: TrendingUp, tone: 'teal', href: '/admin/enrollments' },
      ]
  }
  if (resource === 'payments') {
    const paid = rows.filter((row) => String(row.status || '').toUpperCase() === 'PAID')
      return [
        { label: 'Transactions', value: total, detail: 'payment records', icon: CreditCard, tone: 'blue', href: '/admin/payments' },
        { label: 'Paid', value: paid.length, detail: 'successful payments', icon: CheckCircle2, tone: 'emerald', href: '/admin/payments' },
        { label: 'Pending', value: rows.filter((row) => String(row.status || '').toUpperCase() === 'PENDING').length, detail: 'awaiting closure', icon: Clock3, tone: 'orange', href: '/admin/payments' },
        { label: 'Failed', value: rows.filter((row) => String(row.status || '').toUpperCase() === 'FAILED').length, detail: 'payment exceptions', icon: Activity, tone: 'rose', href: '/admin/payments' },
      ]
  }
  if (resource === 'revenue') {
    const paid = rows.filter((row) => String(row.status || '').toUpperCase() === 'PAID')
    const revenue = paid.reduce((sum, row) => sum + Number(row.amountCents || 0), 0)
    const averageTicket = paid.length ? revenue / paid.length : 0
    const paidRate = total ? Math.round((paid.length / total) * 100) : 0
      return [
        { label: 'Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue / 100), detail: 'paid revenue', icon: TrendingUp, tone: 'violet', href: '/admin/revenue' },
        { label: 'Paid transactions', value: paid.length, detail: 'successful payments', icon: CheckCircle2, tone: 'emerald', href: '/admin/revenue' },
        { label: 'Average ticket', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(averageTicket / 100), detail: 'mean paid order value', icon: CreditCard, tone: 'sky', href: '/admin/revenue' },
        { label: 'Paid rate', value: `${paidRate}%`, detail: 'paid vs total rows', icon: ShieldCheck, tone: 'blue', href: '/admin/revenue' },
      ]
  }
  if (resource === 'certificates') {
      return [
        { label: 'Certificates', value: total, detail: 'issued credential rows', icon: Award, tone: 'blue', href: '/admin/certificates' },
        { label: 'Verified status', value: rows.filter((row) => String(row.status || 'ISSUED').toUpperCase() === 'ISSUED').length, detail: 'ready to share', icon: CheckCircle2, tone: 'emerald', href: '/admin/certificates' },
        { label: 'Course coverage', value: new Set(rows.map((row) => row.course?.id || row.course?.title).filter(Boolean)).size, detail: 'courses represented', icon: BookOpenCheck, tone: 'sky', href: '/admin/courses' },
        { label: 'Learners certified', value: new Set(rows.map((row) => row.user?.id || row.user?.email).filter(Boolean)).size, detail: 'unique recipients', icon: Users, tone: 'violet', href: '/admin/certificates' },
      ]
  }
  if (resource === 'analytics') {
    const registrations = rows.reduce((sum, row) => sum + Number(row.registrations || 0), 0)
    const userActions = rows.reduce((sum, row) => sum + Number(row.userCreations || 0) + Number(row.userApprovals || 0) + Number(row.userRejections || 0) + Number(row.userSuspensions || 0) + Number(row.userDeletions || 0), 0)
    const enrollments = rows.reduce((sum, row) => sum + Number(row.enrollments || 0), 0)
    const completions = rows.reduce((sum, row) => sum + Number(row.completions || 0), 0)
    const revenue = rows.reduce((sum, row) => sum + Number(row.revenueCents || 0), 0)
      return [
        { label: 'Registrations', value: registrations, detail: 'new users in this window', icon: Users, tone: 'blue', href: '/admin/users' },
        { label: 'User actions', value: userActions, detail: 'admin actions from users pages', icon: ShieldCheck, tone: 'teal', href: '/admin/users' },
        { label: 'Enrollments', value: enrollments, detail: 'course starts in this window', icon: GraduationCap, tone: 'orange', href: '/admin/enrollments' },
        { label: 'Completions', value: completions, detail: 'finished courses', icon: Award, tone: 'emerald', href: '/admin/enrollments' },
        { label: 'Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue / 100), detail: 'paid revenue', icon: TrendingUp, tone: 'violet', href: '/admin/revenue' },
      ]
  }
  if (resource === 'activity-logs' || resource === 'reports') {
      return [
        { label: 'Log events', value: total, detail: 'audit records in view', icon: Activity, tone: 'blue', href: '/admin/activity-logs' },
        { label: 'Actors', value: new Set(rows.map((row) => row.user?.id || row.user?.email).filter(Boolean)).size, detail: 'unique users', icon: Users, tone: 'teal', href: '/admin/activity-logs' },
        { label: 'Modules', value: new Set(rows.map((row) => row.entityType || row.action).filter(Boolean)).size, detail: 'areas touched', icon: ShieldCheck, tone: 'orange', href: '/admin/activity-logs' },
        { label: 'Security review', value: rows.filter((row) => String(row.action || '').toLowerCase().includes('login')).length, detail: 'login-related events', icon: Clock3, tone: 'rose', href: '/admin/activity-logs' },
      ]
  }
  return [
    { label: 'Rows', value: total, detail: 'records in this view', icon: BarChart3, tone: 'blue' },
    { label: 'Current status', value: loadingLabel(total), detail: 'latest API response', icon: CheckCircle2, tone: 'teal' },
  ]
}

function loadingLabel(total) {
  return total ? 'Ready' : 'Empty'
}

function buildGuidance(resource) {
  const map = {
    users: ['Review pending accounts first.', 'Use quick view before rejecting or suspending.', 'Export filtered rows for weekly user operations.'],
    learners: ['Sort by activity and status to find at-risk learners.', 'Use progress and certificate signals before intervention.', 'Export cohorts for learner success follow-up.'],
    instructors: ['Check workload before assigning more courses.', 'Review instructor profile completeness.', 'Monitor ownership and approval status together.'],
    courses: ['Keep draft courses low to improve catalog trust.', 'Review enrollment demand before unpublishing.', 'Use edit flow for content and metadata quality.'],
    categories: ['Avoid empty categories in learner catalog.', 'Use course distribution to balance discovery.', 'Keep inactive categories hidden from browsing.'],
    enrollments: ['Prioritize learners below 25% progress.', 'Use completion and hours studied together.', 'Export cohorts for intervention campaigns.'],
    'instructor-changes': ['Audit frequent switches by course.', 'Compare original and new instructor ownership.', 'Use reason text to spot operational issues.'],
    revenue: ['Review month-end paid rows.', 'Compare pending payments against paid revenue.', 'Export finance-ready reports regularly.'],
    payments: ['Filter failed or pending transactions daily.', 'Use quick view for transaction context.', 'Export rows before refund reconciliation.'],
    certificates: ['Verify learner and course before reissuing.', 'Use certificate ID for support requests.', 'Track course coverage for credential quality.'],
    notifications: ['Separate urgent learning reminders from general updates.', 'Check read status before resending.', 'Use categories for learner relevance.'],
    analytics: ['Compare registrations with enrollments before changing campaigns.', 'Review completion trend before adding more courses.', 'Use revenue by day for leadership snapshots.'],
    reports: ['Filter by actor, module, or date before exporting.', 'Use audit rows for weekly operations reviews.', 'Compare reports with analytics before leadership decisions.'],
    'activity-logs': ['Filter by actor for investigations.', 'Review login and password events first.', 'Export audit trails for security reviews.'],
  }
  return map[resource] || ['Use filters to narrow the operational view.', 'Open quick view before taking action.', 'Export rows for offline review when needed.']
}

function emptyMessage(resource) {
  if (resource === 'courses') return 'Create the first course to start building a catalog learners can enroll in.'
  if (resource === 'categories') return 'Create categories so learners can browse courses by topic.'
  if (resource === 'certificates') return 'Generate certificates after learners complete courses and assessments.'
  if (peopleResources.has(resource)) return 'No accounts match this view yet. Try refreshing or add a new user.'
  return 'Try refreshing or clearing filters to see the latest rows.'
}

function emptyAction(resource) {
  if (resource === 'courses') return { label: 'Upload course', onClick: '/admin/upload-course' }
  if (resource === 'categories') return { label: 'Create category', onClick: '/admin/create-category' }
  if (resource === 'certificates') return { label: 'Generate certificate', onClick: '/admin/generate-certificate' }
  if (resource === 'instructors') return { label: 'Add instructor', onClick: '/admin/add-instructor' }
  if (resource === 'learners' || resource === 'users') return { label: 'Add learner', onClick: '/admin/add-learner' }
  return null
}

function RecordQuickView({ row, resource, columns }) {
  return (
    <div className="max-h-[70vh] overflow-auto text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        {columns.map((column) => (
          <div key={column} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{column.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}</p>
            <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
              {['status', 'approvalStatus', 'isActive', 'isPublished', 'isRead'].includes(column)
                ? <AdminStatusBadge value={valueFor(row, column)} />
                : String(valueFor(row, column) || 'Not provided')}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Recommended next action</p>
        <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{quickViewRecommendation(resource, row)}</p>
      </div>
    </div>
  )
}

function UserDetailsArea({ user }) {
  const name = user.name || user.fullName || 'Unnamed user'
  const status = user.approvalStatus || (user.isActive === false ? 'SUSPENDED' : 'APPROVED')
  const joined = user.createdAt ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(user.createdAt)) : 'Not available'
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)]">
      <div className="flex flex-col items-center gap-4 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] p-6 text-center sm:flex-row sm:text-left">
        <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-3xl font-bold text-[var(--accent-primary)]">
          {user.avatarUrl ? <img src={user.avatarUrl} alt={`${name} profile`} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-[var(--text-primary)]">{name}</h3>
          <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">{user.email || 'Email not provided'}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent-primary)]">{user.role || 'Learner'}</span>
            <AdminStatusBadge value={status} />
          </div>
        </div>
      </div>
      <dl className="grid gap-px bg-[var(--border-color)] sm:grid-cols-2">
        {[
          ['Name', name], ['Email', user.email || 'Not provided'], ['Role', user.role || 'Learner'],
          ['Status', status], ['Join date', joined],
        ].map(([label, value]) => (
          <div key={label} className="bg-[var(--bg-elevated)] p-4 last:sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</dt>
            <dd className="mt-2 break-words text-sm font-semibold text-[var(--text-primary)]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function quickViewRecommendation(resource, row) {
  if (peopleResources.has(resource)) return `Review ${row.email || 'this account'} status, role, and activity before moderation.`
  if (resource === 'enrollments') return 'Use progress and hours studied to decide whether this learner needs outreach.'
  if (resource === 'payments' || resource === 'revenue') return 'Confirm payment status and course context before finance export or support follow-up.'
  if (resource === 'certificates') return 'Verify certificate ID, learner, and course before sharing or reissuing.'
  if (resource === 'analytics') return 'Compare this day with nearby days before treating it as a trend.'
  if (resource === 'reports') return 'Correlate actor, module, IP address, and timestamp before using this report row.'
  if (resource === 'activity-logs') return 'Correlate actor, IP address, and action before treating this as a security event.'
  return 'Use this quick view to confirm context before editing, deleting, or exporting records.'
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

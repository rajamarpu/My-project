import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { Activity, Award, Ban, BarChart3, BookOpenCheck, CheckCircle2, Clock3, CreditCard, FolderTree, GraduationCap, ShieldCheck, Trash2, TrendingUp, UserCheck, Users, XCircle } from 'lucide-react'
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
const peopleResources = new Set(['users', 'learners', 'instructors'])

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
  const insights = buildInsights(resource, rows)
  const guidance = buildGuidance(resource)

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
      title: `${config.title} quick view`,
      message: '',
      confirmLabel: 'Done',
      onConfirm: () => setModal(null),
      children: (
        <RecordQuickView row={row} resource={resource} columns={config.columns} />
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

      <AdminInsightStrip items={insights} />
      <AdminGuidancePanel title="Productivity workflow" items={guidance} />

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

function buildInsights(resource, rows) {
  const total = rows.length
  if (peopleResources.has(resource)) {
    const approved = rows.filter((row) => String(row.approvalStatus || 'APPROVED').toUpperCase() === 'APPROVED').length
    const inactive = rows.filter((row) => row.isActive === false || String(row.approvalStatus || '').toUpperCase() === 'SUSPENDED').length
    return [
      { label: 'Directory size', value: total, detail: 'accounts in this view', icon: Users },
      { label: 'Approved', value: approved, detail: 'ready for platform access', icon: UserCheck },
      { label: 'Needs attention', value: Math.max(0, total - approved), detail: 'pending or rejected state', icon: ShieldCheck },
      { label: 'Risk flags', value: inactive, detail: 'inactive or suspended accounts', icon: Activity },
    ]
  }
  if (resource === 'courses') {
    const published = rows.filter((row) => row.isPublished).length
    const enrollments = rows.reduce((sum, row) => sum + Number(row._count?.enrollments ?? row.enrollments ?? 0), 0)
    return [
      { label: 'Catalog size', value: total, detail: 'courses in database', icon: BookOpenCheck },
      { label: 'Published', value: published, detail: `${total ? Math.round((published / total) * 100) : 0}% publish rate`, icon: CheckCircle2 },
      { label: 'Enrollments', value: enrollments, detail: 'visible demand signal', icon: TrendingUp },
      { label: 'Draft risk', value: Math.max(0, total - published), detail: 'unpublished courses', icon: Clock3 },
    ]
  }
  if (resource === 'categories') {
    const active = rows.filter((row) => row.isActive !== false).length
    const courseCount = rows.reduce((sum, row) => sum + Number(row._count?.courses ?? 0), 0)
    return [
      { label: 'Categories', value: total, detail: 'catalog groups', icon: FolderTree },
      { label: 'Active', value: active, detail: 'available for browsing', icon: CheckCircle2 },
      { label: 'Course links', value: courseCount, detail: 'distribution across categories', icon: BarChart3 },
      { label: 'Empty groups', value: rows.filter((row) => Number(row._count?.courses ?? 0) === 0).length, detail: 'need course assignment', icon: BookOpenCheck },
    ]
  }
  if (resource === 'enrollments') {
    const completed = rows.filter((row) => Number(row.completionPct || 0) >= 100).length
    const atRisk = rows.filter((row) => Number(row.completionPct || 0) < 25).length
    const avg = total ? Math.round(rows.reduce((sum, row) => sum + Number(row.completionPct || 0), 0) / total) : 0
    return [
      { label: 'Enrollments', value: total, detail: 'learner-course records', icon: GraduationCap },
      { label: 'Completed', value: completed, detail: '100% progress', icon: Award },
      { label: 'At risk', value: atRisk, detail: 'below 25% progress', icon: Activity },
      { label: 'Average progress', value: `${avg}%`, detail: 'completion forecast signal', icon: TrendingUp },
    ]
  }
  if (resource === 'payments' || resource === 'revenue') {
    const paid = rows.filter((row) => String(row.status || '').toUpperCase() === 'PAID')
    const revenue = paid.reduce((sum, row) => sum + Number(row.amountCents || 0), 0)
    return [
      { label: 'Transactions', value: total, detail: 'payment records', icon: CreditCard },
      { label: 'Paid', value: paid.length, detail: 'successful payments', icon: CheckCircle2 },
      { label: 'Pending or failed', value: Math.max(0, total - paid.length), detail: 'monitor closely', icon: Activity },
      { label: 'Revenue', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revenue / 100), detail: 'from paid rows', icon: TrendingUp },
    ]
  }
  if (resource === 'certificates') {
    return [
      { label: 'Certificates', value: total, detail: 'issued credential rows', icon: Award },
      { label: 'Verified status', value: rows.filter((row) => String(row.status || 'ISSUED').toUpperCase() === 'ISSUED').length, detail: 'ready to share', icon: CheckCircle2 },
      { label: 'Course coverage', value: new Set(rows.map((row) => row.course?.id || row.course?.title).filter(Boolean)).size, detail: 'courses represented', icon: BookOpenCheck },
      { label: 'Learners certified', value: new Set(rows.map((row) => row.user?.id || row.user?.email).filter(Boolean)).size, detail: 'unique recipients', icon: Users },
    ]
  }
  if (resource === 'activity-logs' || resource === 'analytics' || resource === 'reports') {
    return [
      { label: 'Log events', value: total, detail: 'audit records in view', icon: Activity },
      { label: 'Actors', value: new Set(rows.map((row) => row.user?.id || row.user?.email).filter(Boolean)).size, detail: 'unique users', icon: Users },
      { label: 'Modules', value: new Set(rows.map((row) => row.entityType || row.action).filter(Boolean)).size, detail: 'areas touched', icon: ShieldCheck },
      { label: 'Security review', value: rows.filter((row) => String(row.action || '').toLowerCase().includes('login')).length, detail: 'login-related events', icon: Clock3 },
    ]
  }
  return [
    { label: 'Rows', value: total, detail: 'records in this view', icon: BarChart3 },
    { label: 'Current status', value: loadingLabel(total), detail: 'latest API response', icon: CheckCircle2 },
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

function quickViewRecommendation(resource, row) {
  if (peopleResources.has(resource)) return `Review ${row.email || 'this account'} status, role, and activity before moderation.`
  if (resource === 'enrollments') return 'Use progress and hours studied to decide whether this learner needs outreach.'
  if (resource === 'payments' || resource === 'revenue') return 'Confirm payment status and course context before finance export or support follow-up.'
  if (resource === 'certificates') return 'Verify certificate ID, learner, and course before sharing or reissuing.'
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

export const DASHBOARD_REFRESH_EVENT = 'uptoskills:dashboard-refresh'

export function notifyDashboardRefresh(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT, { detail }))
}

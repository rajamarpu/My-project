export function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_URL
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '')

  if (typeof window === 'undefined') return '/api'

  const { hostname, protocol } = window.location
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'

  if (isLocalHost) {
    return `${protocol}//localhost:5000/api`
  }

  return '/api'
}

export const API_BASE_URL = resolveApiBaseUrl()
export const BACKEND_PORT = 5000

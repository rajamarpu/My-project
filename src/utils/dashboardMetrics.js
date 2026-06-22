export function compactNumber(value) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

export function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0) / 100)
}

export function percentChange(current, previous) {
  const currentValue = Number(current || 0)
  const previousValue = Number(previous || 0)
  if (!previousValue) {
    if (!currentValue) return 0
    return currentValue > 0 ? 100 : -100
  }
  return Math.round(((currentValue - previousValue) / previousValue) * 100)
}

export function formatTrend(change) {
  const value = Number(change || 0)
  return `${value >= 0 ? '+' : ''}${value}%`
}

function windowSum(rows, key, start, end) {
  return rows.slice(start, end).reduce((sum, row) => sum + Number(row?.[key] || 0), 0)
}

export function trendFromSeries(rows = [], key, windowSize = 7) {
  if (!Array.isArray(rows) || !rows.length) return 0
  const end = rows.length
  const currentStart = Math.max(0, end - windowSize)
  const previousStart = Math.max(0, currentStart - windowSize)
  const current = windowSum(rows, key, currentStart, end)
  const previous = windowSum(rows, key, previousStart, currentStart)
  return percentChange(current, previous)
}

export function trendFromItems(items = [], dateField = 'submittedAt', windowSize = 7, valueFn = () => 1) {
  if (!Array.isArray(items) || !items.length) return 0
  const sorted = [...items].sort((a, b) => new Date(a?.[dateField] || 0) - new Date(b?.[dateField] || 0))
  const start = Math.max(0, sorted.length - windowSize * 2)
  const relevant = sorted.slice(start)
  const current = relevant.slice(-windowSize).reduce((sum, item) => sum + Number(valueFn(item) || 0), 0)
  const previous = relevant.slice(0, Math.max(0, relevant.length - windowSize)).reduce((sum, item) => sum + Number(valueFn(item) || 0), 0)
  return percentChange(current, previous)
}

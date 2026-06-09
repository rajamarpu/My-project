import { useMemo, useState } from 'react'
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  Edit,
  Eye,
  Filter,
  MoreVertical,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import Button from '../common/Button/Button.jsx'
import { cn } from '../../utils/classNames.js'
import { AdminStatusBadge } from './AdminUI.jsx'

function rowKey(row, index) {
  return String(row?.id ?? row?.certificateNo ?? `${index}`)
}

function normalize(value) {
  return String(value ?? '').toLowerCase()
}

function columnLabel(column) {
  return String(column || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function exportCsv(rows, columns, valueFor, filename) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [
    columns.map(escape).join(','),
    ...rows.map((row) => columns.map((column) => escape(valueFor(row, column))).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function highlightedText(value, query) {
  const text = String(value ?? '')
  const needle = query.trim()
  if (!needle) return text
  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (index === -1) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-orange-200 px-0.5 text-slate-950">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}

const statusColumns = new Set(['status', 'approvalStatus', 'isActive', 'isPublished', 'isRead'])

function renderCellValue(column, value, query) {
  if (statusColumns.has(column)) return <AdminStatusBadge value={value} />
  return highlightedText(value, query)
}

export default function AdminDataTable({
  title,
  rows,
  columns,
  valueFor,
  loading,
  error,
  onRetry,
  emptyState,
  renderActions,
  onDeleteRows,
  onArchiveRows,
  onViewRow,
  onEditRow,
  onDeleteRow,
  onArchiveRow,
  toast,
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ column: columns[0], direction: 'asc' })
  const [filters, setFilters] = useState({})
  const [openFilter, setOpenFilter] = useState('')
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openMenu, setOpenMenu] = useState('')

  const filterOptions = useMemo(() => {
    const next = {}
    columns.forEach((column) => {
      next[column] = [...new Set(rows.map((row) => String(valueFor(row, column) ?? '')).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 24)
    })
    return next
  }, [columns, rows, valueFor])

  const visibleRows = useMemo(() => {
    const searched = rows.filter((row) => {
      const haystack = columns.map((column) => valueFor(row, column)).join(' ')
      return !query.trim() || normalize(haystack).includes(normalize(query))
    })
    const filtered = searched.filter((row) => columns.every((column) => {
      const active = filters[column] || []
      if (!active.length) return true
      return active.includes(String(valueFor(row, column) ?? ''))
    }))
    return [...filtered].sort((a, b) => {
      const left = valueFor(a, sort.column)
      const right = valueFor(b, sort.column)
      const numericLeft = Number(String(left).replace(/[^0-9.-]/g, ''))
      const numericRight = Number(String(right).replace(/[^0-9.-]/g, ''))
      const result = Number.isFinite(numericLeft) && Number.isFinite(numericRight) && String(left).match(/\d/) && String(right).match(/\d/)
        ? numericLeft - numericRight
        : String(left ?? '').localeCompare(String(right ?? ''))
      return sort.direction === 'asc' ? result : -result
    })
  }, [columns, filters, query, rows, sort, valueFor])

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const pageKeys = pageRows.map(rowKey)
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((key) => selected.includes(key))
  const hasFilters = query.trim() || Object.values(filters).some((items) => items?.length)
  const activeFilterChips = useMemo(() => {
    const chips = []
    if (query.trim()) chips.push({ key: 'query', label: 'Search', value: query.trim() })
    Object.entries(filters).forEach(([column, values]) => {
      values.forEach((value) => chips.push({ key: `${column}:${value}`, column, label: columnLabel(column), value }))
    })
    return chips
  }, [filters, query])

  function toggleSort(column) {
    setSort((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function toggleSelected(key) {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  function selectedRows() {
    return rows.filter((row, index) => selected.includes(rowKey(row, index)))
  }

  function clearFilters() {
    setQuery('')
    setFilters({})
    setOpenFilter('')
    setPage(1)
  }

  function removeFilterChip(chip) {
    if (chip.key === 'query') {
      setQuery('')
    } else {
      setFilters((current) => ({
        ...current,
        [chip.column]: (current[chip.column] || []).filter((value) => value !== chip.value),
      }))
    }
    setPage(1)
  }

  function handleExport(items = visibleRows) {
    exportCsv(items, columns, valueFor, `${title.toLowerCase().replace(/\s+/g, '-')}.csv`)
    toast?.('success', 'Export ready.')
  }

  function handleArchive(items) {
    onArchiveRows?.(items)
    setSelected([])
  }

  function handleDelete(items) {
    onDeleteRows?.(items)
    setSelected([])
  }

  if (loading) return <AdminTableSkeleton columns={columns.length + 2} />

  if (error) {
    return (
      <div className="admin-panel grid min-h-[260px] place-items-center p-8 text-center">
        <div>
          <X className="mx-auto text-red-500" size={54} />
          <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">Unable to Load {title}</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">We encountered an error. Please try again or contact support if it continues.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={onRetry}>Retry</Button>
            <Button variant="secondary" onClick={() => toast?.('warning', 'Support contact workflow is not configured yet.')}>Contact Support</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="admin-panel p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex min-h-11 flex-1 items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 text-[var(--text-secondary)] focus-within:ring-4 focus-within:ring-[#FF6B35]/20">
            <Search size={20} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              placeholder={`Search ${title.toLowerCase()} across all columns`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {visibleRows.length}/{rows.length} visible
            </span>
            {hasFilters ? <Button variant="secondary" onClick={clearFilters}><X size={16} /> Clear Filters</Button> : null}
            <Button variant="secondary" onClick={() => handleExport()}><Download size={16} /> Export</Button>
          </div>
        </div>
        {activeFilterChips.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => removeFilterChip(chip)}
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#FF6B35]/30 bg-[#FFF5F0] px-3 text-xs font-semibold text-[#9A3412] transition hover:border-[#FF6B35] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] dark:bg-orange-500/10 dark:text-orange-100"
                aria-label={`Remove ${chip.label} filter ${chip.value}`}
              >
                <span>{chip.label}: {chip.value}</span>
                <X size={14} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {selected.length ? (
        <div className="admin-panel flex flex-col gap-3 border-[#FF6B35]/40 bg-orange-50/90 p-4 dark:bg-orange-500/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{selected.length} row{selected.length === 1 ? '' : 's'} selected</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => handleExport(selectedRows())}><Download size={16} /> Export</Button>
            <Button variant="secondary" onClick={() => handleArchive(selectedRows())}><Archive size={16} /> Archive</Button>
            <Button variant="secondary" onClick={() => handleDelete(selectedRows())} className="border-red-400/40 text-red-700 dark:text-red-100"><Trash2 size={16} /> Delete Selected</Button>
          </div>
        </div>
      ) : null}

      {!visibleRows.length ? emptyState : null}

      {visibleRows.length ? (
        <>
          <div className="admin-table-card hidden md:block">
            <div className="admin-scrollbar overflow-x-auto">
              <table className="admin-premium-table min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={() => {
                          setSelected((current) => allPageSelected ? current.filter((key) => !pageKeys.includes(key)) : [...new Set([...current, ...pageKeys])])
                        }}
                        aria-label="Select all rows on this page"
                      />
                    </th>
                    {columns.map((column) => (
                      <th key={column} className={cn('relative min-w-36 whitespace-nowrap px-4 py-3 text-left align-top', sort.column === column && 'text-[#FF6B35]')} aria-sort={sort.column === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleSort(column)} className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded px-1 font-semibold uppercase tracking-[0.08em] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]">
                            {columnLabel(column)}
                            {sort.column === column ? <ChevronDown className={sort.direction === 'asc' ? 'rotate-180' : ''} size={16} /> : <ChevronsUpDown size={16} />}
                          </button>
                          <button type="button" onClick={() => setOpenFilter(openFilter === column ? '' : column)} className="grid h-11 w-11 shrink-0 place-items-center rounded hover:bg-[#FFF5F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" aria-label={`Filter ${columnLabel(column)}`} aria-expanded={openFilter === column}>
                            <Filter size={16} />
                          </button>
                        </div>
                        {openFilter === column ? (
                          <FilterMenu
                            options={filterOptions[column] || []}
                            selected={filters[column] || []}
                            onChange={(next) => {
                              setFilters((current) => ({ ...current, [column]: next }))
                              setPage(1)
                            }}
                          />
                        ) : null}
                      </th>
                    ))}
                    <th className="min-w-44 whitespace-nowrap px-4 py-3 text-right font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => {
                    const key = rowKey(row, index)
                    const checked = selected.includes(key)
                    return (
                      <tr key={key} className={cn(checked && 'admin-row-selected')}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={checked} onChange={() => toggleSelected(key)} aria-label="Select row" />
                        </td>
                        {columns.map((column) => (
                          <td key={column} className="max-w-xs whitespace-nowrap px-4 py-3 text-[var(--text-primary)]">
                            <span>{renderCellValue(column, valueFor(row, column), query)}</span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          {renderActions ? renderActions(row) : null}
                          <RowMenu
                            open={openMenu === key}
                            onOpen={() => setOpenMenu(openMenu === key ? '' : key)}
                            onView={() => onViewRow?.(row)}
                            onEdit={() => onEditRow?.(row)}
                            onDelete={() => onDeleteRow?.(row)}
                            onArchive={() => onArchiveRow?.(row)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {pageRows.map((row, index) => {
              const key = rowKey(row, index)
              const checked = selected.includes(key)
              return (
                <article key={key} className={cn('admin-panel admin-panel-hover overflow-hidden p-4 transition', checked && 'admin-row-selected')}>
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <input type="checkbox" checked={checked} onChange={() => toggleSelected(key)} />
                      Select
                    </label>
                    <RowMenu
                      open={openMenu === key}
                      onOpen={() => setOpenMenu(openMenu === key ? '' : key)}
                      onView={() => onViewRow?.(row)}
                      onEdit={() => onEditRow?.(row)}
                      onDelete={() => onDeleteRow?.(row)}
                      onArchive={() => onArchiveRow?.(row)}
                    />
                  </div>
                  <div className="mt-3 grid gap-3">
                    {columns.map((column) => (
                      <div key={column} className="grid grid-cols-1 items-start gap-1 border-b border-[var(--border-color)] pb-2 min-[420px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] min-[420px]:gap-3 last:border-0 last:pb-0">
                        <span className="min-w-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{columnLabel(column)}</span>
                        <span className="min-w-0 whitespace-normal break-words text-left text-sm font-medium text-[var(--text-primary)] min-[420px]:text-right">{renderCellValue(column, valueFor(row, column), query)}</span>
                      </div>
                    ))}
                  </div>
                  {renderActions ? <div className="mt-4">{renderActions(row)}</div> : null}
                </article>
              )
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalRows={visibleRows.length}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function FilterMenu({ options, selected, onChange }) {
  return (
    <div className="absolute left-4 top-14 z-20 w-64 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 text-sm shadow-soft animate-upto-dropdown">
      <div className="max-h-56 space-y-2 overflow-y-auto">
        {options.length ? options.map((option) => (
          <label key={option} className="flex min-h-11 items-center gap-2 rounded px-2 hover:bg-[#FFF5F0] dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])}
            />
            <span className="truncate">{option}</span>
          </label>
        )) : <p className="p-2 text-[var(--text-muted)]">No filter options</p>}
      </div>
    </div>
  )
}

function RowMenu({ open, onOpen, onView, onEdit, onDelete, onArchive }) {
  const items = [
    ['View', Eye, onView],
    ['Edit', Edit, onEdit],
    ['Archive', Archive, onArchive],
    ['Delete', Trash2, onDelete],
  ].filter(([, , handler]) => Boolean(handler))
  if (!items.length) return null
  return (
    <span className="relative ml-2 inline-flex">
      <button type="button" onClick={onOpen} className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-color)] hover:bg-[#FFF5F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]" aria-label="Open row actions">
        <MoreVertical size={18} />
      </button>
      {open ? (
        <span className="absolute right-0 top-11 z-20 grid w-40 gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-2 text-left shadow-soft animate-upto-dropdown">
          {items.map(([label, Icon, handler]) => (
            <button key={label} type="button" onClick={handler} className="flex min-h-11 items-center gap-2 rounded px-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[#FFF5F0] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] dark:hover:bg-white/5">
              <Icon size={16} />
              {label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  )
}

function Pagination({ currentPage, totalPages, pageSize, totalRows, onPageChange, onPageSizeChange }) {
  const start = totalRows ? (currentPage - 1) * pageSize + 1 : 0
  const end = Math.min(totalRows, currentPage * pageSize)
  return (
    <div className="admin-panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-[var(--text-secondary)]">Showing {start}-{end} of {totalRows} results</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          Rows
          <select className="admin-input min-h-11 w-24 py-2" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {[10, 25, 50].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--border-color)] disabled:opacity-45">
          <ChevronLeft size={18} />
        </button>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          Page
          <input className="admin-input min-h-11 w-20 py-2" type="number" min="1" max={totalPages} value={currentPage} onChange={(event) => onPageChange(Math.min(totalPages, Math.max(1, Number(event.target.value) || 1)))} />
          of {totalPages}
        </label>
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--border-color)] disabled:opacity-45">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

function AdminTableSkeleton({ columns }) {
  return (
    <div className="admin-table-card overflow-hidden p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <span className="skeleton h-11 w-full rounded-lg lg:max-w-xl" />
        <span className="skeleton h-11 w-40 rounded-lg" />
      </div>
      <div className="hidden overflow-hidden rounded-lg border border-[var(--border-color)] md:block">
        <div className="grid gap-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] p-4" style={{ gridTemplateColumns: `repeat(${Math.min(columns, 6)}, minmax(0, 1fr))` }}>
          {Array.from({ length: Math.min(columns, 6) }).map((_, column) => <span key={column} className="skeleton h-5 rounded" />)}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid gap-3 border-b border-[var(--border-color)] p-4 last:border-0" style={{ gridTemplateColumns: `repeat(${Math.min(columns, 6)}, minmax(0, 1fr))` }}>
            {Array.from({ length: Math.min(columns, 6) }).map((__, column) => (
              <span key={column} className="skeleton h-6 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="rounded-lg border border-[var(--border-color)] p-4">
            <span className="skeleton block h-5 w-36 rounded" />
            <span className="skeleton mt-4 block h-4 w-full rounded" />
            <span className="skeleton mt-3 block h-4 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

import Button from '../../components/common/Button/Button.jsx'
import { useEffect, useState } from 'react'
import { Award } from 'lucide-react'
import { fetchCertificates } from '../../api/api.js'

export default function CertificatesPage() {
  const [activeCertificate, setActiveCertificate] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadCertificates() {
      try {
        setLoading(true)
        setError('')
        const response = await fetchCertificates()
        if (mounted) setCertificates(response.data?.certificates || [])
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || err.message || 'Could not load certificates.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void loadCertificates()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="pb-16">
      <div className="glass-card p-8 shadow-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Certificates</p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">Your premium achievements</h1>
          </div>
          <Button variant="secondary" onClick={() => setActiveCertificate('Verification portal opened')}>Verify certificate</Button>
        </div>
      </div>
      {activeCertificate ? (
        <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
          {activeCertificate}
        </div>
      ) : null}
      {error ? <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-100">{error}</div> : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center text-[var(--text-muted)]">Loading certificates...</div>
        ) : certificates.length ? certificates.map((item) => {
          const studentName = item.user?.name || 'Student Name'
          const courseName = item.course?.title || 'Course Name'
          const instructorName = item.course?.createdBy?.name || 'Course Instructor'
          const issuedDate = item.issuedAt ? new Date(item.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date'
          return (
          <div key={item.id} className="glass-card rounded-[2rem] p-8 text-[var(--text-secondary)] shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{courseName}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Certificate ID: {item.certificateNo}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Instructor: {instructorName}</p>
              </div>
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm text-amber-700 dark:text-amber-200">{item.status || 'ISSUED'}</span>
            </div>
            <div className="mt-6 rounded-lg border border-[var(--border-color)] bg-white p-5 text-slate-800">
              <p className="text-center text-sm font-bold uppercase tracking-[0.22em] text-orange-600">Certificate of Completion</p>
              <p className="mt-4 text-sm leading-6">
                This is to certify that <strong>{studentName}</strong> has successfully completed the course <strong>"{courseName}"</strong> offered by <strong>UptoSkills</strong>.
              </p>
              <p className="mt-3 text-sm leading-6">
                This certificate is awarded in recognition of the successful completion of all required coursework and assessments.
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p><strong>Date of Completion:</strong> {issuedDate}</p>
                <p><strong>Certificate ID:</strong> {item.certificateNo}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => window.print()}>Print</Button>
              <Button onClick={() => setActiveCertificate(`${courseName} certificate is ready to share. Certificate ID: ${item.certificateNo}`)}>Share LinkedIn</Button>
              <Button variant="secondary" onClick={() => setActiveCertificate(`${item.certificateNo} is ${item.status || 'ISSUED'} by UptoSkills.`)}>Verify</Button>
            </div>
          </div>
          )
        }) : (
          <div className="col-span-full rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center">
            <Award className="mx-auto text-[var(--text-muted)]" size={34} />
            <p className="mt-3 font-semibold text-[var(--text-primary)]">No certificates issued yet</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Certificates generated by admin will appear here.</p>
          </div>
        )}
      </div>
    </section>
  )
}


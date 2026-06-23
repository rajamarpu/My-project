import Button from '../../components/common/Button/Button.jsx'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, BookOpenCheck, CheckCircle2, Download, ExternalLink, ShieldCheck, X } from 'lucide-react'
import { fetchCertificates } from '../../api/api.js'
import { UptoSkillsMark } from '../../components/ui/Navbar/Logo.jsx'

export default function CertificatesPage() {
  const [activeCertificate, setActiveCertificate] = useState(null)
  const [verifyMessage, setVerifyMessage] = useState('')
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

  const activeCertificateDownload = useMemo(() => {
    if (!activeCertificate) return null
    return buildCertificateSvg(activeCertificate)
  }, [activeCertificate])

  function openCertificate(certificate) {
    setActiveCertificate(certificate)
    setVerifyMessage('')
  }

  function downloadActiveCertificate() {
    if (!activeCertificateDownload) return
    const blob = new Blob([activeCertificateDownload], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `uptoskills-certificate-${String(activeCertificate?.certificateNo || 'certificate').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.svg`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 500)
  }

  return (
    <section className="pb-16">
      <div className="admin-panel p-8 shadow-glow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Certificates</p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">Your premium achievements</h1>
          </div>
          <Button variant="secondary" onClick={() => setVerifyMessage('Click any certificate below to view it fullscreen and download the SVG version.')}>Verify certificate</Button>
        </div>
      </div>
      {verifyMessage ? (
        <div className="mt-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-[var(--success)]">
          {verifyMessage}
        </div>
      ) : null}
      {error ? <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-100">{error}</div> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <CertificateMetric icon={Award} label="Certificates" value={certificates.length} href="/certificates" />
        <CertificateMetric icon={ShieldCheck} label="Verification ready" value={certificates.filter((item) => String(item.status || 'ISSUED').toUpperCase() === 'ISSUED').length} href="/certificates" />
        <CertificateMetric icon={BookOpenCheck} label="Courses represented" value={new Set(certificates.map((item) => item.course?.id || item.course?.title).filter(Boolean)).size} href="/courses" />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full admin-panel p-8 text-center text-[var(--text-muted)]">Loading certificates...</div>
        ) : certificates.length ? certificates.map((item) => {
          const studentName = item.learnerSnapshot?.name || item.user?.name || 'Student Name'
          const courseName = item.courseSnapshot?.title || item.course?.title || 'Course Name'
          const instructorName = item.courseSnapshot?.instructor?.name || item.course?.createdBy?.name || item.issueMetadata?.provided?.instructorName || 'Course Instructor'
          const completionSource = item.completionDate || item.issueMetadata?.completionDate || item.issuedAt || null
          const issuedDate = completionSource
            ? new Date(completionSource).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'Date'
          return (
          <button key={item.id} type="button" onClick={() => openCertificate(item)} className="admin-panel admin-panel-hover rounded-[2rem] p-8 text-left text-[var(--text-secondary)] shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{courseName}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Certificate ID: {item.certificateNo}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Verification Code: {item.verificationCode}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Instructor: {instructorName}</p>
              </div>
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm text-amber-700 dark:text-amber-200">{item.status || 'ISSUED'}</span>
            </div>
            <div className="mt-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 text-[var(--text-primary)]">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-primary)]">Certificate summary</p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Verified record</p>
              </div>
              <p className="mt-4 text-center text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent-primary)]">Certificate of Completion</p>
              <p className="mt-4 text-sm leading-6">
                This is to certify that <strong>{studentName}</strong> has successfully completed the course <strong>"{courseName}"</strong> offered by <strong>UptoSkills</strong>.
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p><strong>Date of Completion:</strong> {issuedDate}</p>
                <p><strong>Certificate ID:</strong> {item.certificateNo}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--success)]" size={18} />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Verification status</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">This certificate can be verified using certificate ID {item.certificateNo} and code {item.verificationCode}.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)]">
                <ExternalLink size={15} /> Open full screen
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)]">
                <Download size={15} /> Download available
              </span>
            </div>
          </button>
          )
        }) : (
          <div className="col-span-full rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center">
            <Award className="mx-auto text-[var(--text-muted)]" size={34} />
            <p className="mt-3 font-semibold text-[var(--text-primary)]">No certificates issued yet</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Certificates generated by admin will appear here.</p>
          </div>
        )}
      </div>

      {activeCertificate ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Certificate viewer">
          <div className="flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--bg-elevated)] shadow-[0_30px_120px_rgba(15,23,42,0.4)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Certificate viewer</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{activeCertificate.courseSnapshot?.title || activeCertificate.course?.title || 'Certificate'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={downloadActiveCertificate}>
                  <Download size={16} /> Download
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  Print
                </Button>
                <Button variant="secondary" onClick={() => setActiveCertificate(null)} aria-label="Close certificate viewer">
                  <X size={16} /> Close
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.02))] p-3 sm:p-6">
              <div className="mx-auto flex min-h-full w-full max-w-[1400px] items-center justify-center">
                <CertificatePreview certificate={activeCertificate} fullscreen />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CertificateMetric({ icon: Icon, label, value, href }) {
  const content = (
    <div className="admin-panel rounded-xl p-5 shadow-soft">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={18} /></span>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{value}</p>
    </div>
  )

  if (!href) return content

  return (
    <Link to={href} className="block h-full w-full text-left">
      {content}
    </Link>
  )
}

function CertificatePreview({ certificate, fullscreen = false }) {
  const studentName = certificate.learnerSnapshot?.name || certificate.user?.name || 'Student Name'
  const courseName = certificate.courseSnapshot?.title || certificate.course?.title || 'Course Name'
  const instructorName = certificate.courseSnapshot?.instructor?.name || certificate.course?.createdBy?.name || certificate.issueMetadata?.provided?.instructorName || 'Course Instructor'
  const completionSource = certificate.completionDate || certificate.issueMetadata?.completionDate || certificate.issuedAt || null
  const issuedDate = completionSource
    ? new Date(completionSource).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date'

  return (
    <article className={`relative overflow-hidden rounded-[18px] border border-[#98d5ff] bg-white p-6 text-slate-700 shadow-soft ${fullscreen ? 'w-full max-w-[1200px] aspect-[16/11]' : 'min-w-[860px]'}`}>
      <div className="absolute inset-4 rounded-[14px] border border-[#f7b28e]" />
      <div className="absolute inset-0 rounded-[18px] border-2 border-[#8fe0db]" />
      <div className="relative z-10 flex h-full min-h-full flex-col rounded-[12px] p-3 sm:p-4">
        <div className="flex items-start justify-between gap-4">
          <UptoSkillsMark compact />
          <div className="pt-2 text-right text-xs font-semibold uppercase tracking-[0.42em] text-[#2962ff]">Verified Certificate</div>
        </div>

        <div className="flex-1">
          <div className="mt-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.5em] text-[#ff4f96]">Certificate of Completion</p>
            <h2 className="mt-10 text-4xl font-semibold text-[#21b8b1] sm:text-5xl">{studentName}</h2>
            <div className="mx-auto mt-5 h-px w-60 bg-[#c9ecea]" />
            <p className="mx-auto mt-10 max-w-4xl text-lg leading-9 text-slate-600">
              This is to certify that <span className="font-semibold text-slate-800">{studentName}</span> has successfully completed the course <span className="font-semibold text-slate-800">"{courseName}"</span> offered by UptoSkills.
            </p>
            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-slate-600">
              During this course, the learner demonstrated dedication, commitment, and proficiency in the concepts, practical skills, and industry-relevant knowledge covered throughout the program.
            </p>
            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-slate-600">
              This certificate is awarded in recognition of the successful completion of all required coursework and assessments.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-slate-500">Date of Completion</p>
              <p className="text-xl font-semibold text-slate-800">{issuedDate}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-slate-500">Certificate ID</p>
              <p className="text-xl font-semibold text-slate-800">{certificate.certificateNo || 'Certificate Number'}</p>
            </div>
          </div>

          <p className="mx-auto mt-16 max-w-4xl text-center text-lg leading-9 text-slate-600">
            We congratulate {studentName} on this achievement and wish them continued success in their learning journey and future career endeavors.
          </p>
        </div>

        <div className="mt-16 grid gap-8 border-t border-transparent pt-2 sm:grid-cols-3 sm:items-end">
          <div className="space-y-2">
            <UptoSkillsMark compact />
            <p className="text-sm font-semibold text-[#1b8f87]">Empowering Learners. Building Futures.</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 h-px w-48 bg-slate-900/85" />
            <p className="font-semibold text-slate-800">Authorized Signature</p>
            <p className="mt-1 text-sm text-slate-500">UptoSkills</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-3 h-px w-48 bg-slate-900/85" />
            <p className="font-semibold text-slate-800">Course Instructor</p>
            <p className="mt-1 text-sm text-slate-500">{instructorName}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function buildCertificateSvg(certificate) {
  const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const studentName = escape(certificate.learnerSnapshot?.name || certificate.user?.name || 'Student Name')
  const courseName = escape(certificate.courseSnapshot?.title || certificate.course?.title || 'Course Name')
  const instructorName = escape(certificate.courseSnapshot?.instructor?.name || certificate.course?.createdBy?.name || certificate.issueMetadata?.provided?.instructorName || 'Course Instructor')
  const issuedDate = escape(certificate.completionDate || certificate.issueMetadata?.completionDate || certificate.issuedAt || '')
  const certificateNo = escape(certificate.certificateNo || 'Certificate Number')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100">
  <defs>
    <style>
      .brand { font: 800 44px Arial, sans-serif; }
      .body { font: 400 26px Arial, sans-serif; fill: #5b6a82; }
      .small { font: 700 20px Arial, sans-serif; letter-spacing: 6px; }
      .label { font: 700 18px Arial, sans-serif; letter-spacing: 4px; fill: #5b6a82; }
      .value { font: 700 24px Arial, sans-serif; fill: #273142; }
    </style>
  </defs>
  <rect width="1600" height="1100" rx="32" fill="#ffffff"/>
  <rect x="16" y="16" width="1568" height="1068" rx="22" fill="none" stroke="#9ad9ff" stroke-width="2"/>
  <rect x="32" y="32" width="1536" height="1036" rx="18" fill="none" stroke="#f7b28e" stroke-width="1.5"/>
  <rect x="48" y="48" width="1504" height="1004" rx="16" fill="none" stroke="#8fe0db" stroke-width="1.5"/>
  <text x="86" y="116" class="brand" fill="#21b8b1">Upto</text>
  <text x="211" y="116" class="brand" fill="#ff7a45">Skills</text>
  <text x="1510" y="114" class="small" text-anchor="end" fill="#2962ff">VERIFIED CERTIFICATE</text>
  <text x="800" y="260" class="small" text-anchor="middle" fill="#ff4f96">CERTIFICATE OF COMPLETION</text>
  <text x="800" y="376" text-anchor="middle" fill="#21b8b1" style="font: 700 60px Arial, sans-serif;">${studentName}</text>
  <line x1="595" y1="402" x2="1005" y2="402" stroke="#c9ecea" stroke-width="2"/>
  <text x="800" y="503" text-anchor="middle" class="body">This is to certify that <tspan font-weight="700" fill="#273142">${studentName}</tspan> has successfully completed the course</text>
  <text x="800" y="540" text-anchor="middle" class="body"><tspan font-weight="700" fill="#273142">"${courseName}"</tspan> offered by UptoSkills.</text>
  <text x="800" y="623" text-anchor="middle" class="body">During this course, the learner demonstrated dedication, commitment, and proficiency in the concepts,</text>
  <text x="800" y="660" text-anchor="middle" class="body">practical skills, and industry-relevant knowledge covered throughout the program.</text>
  <text x="800" y="746" text-anchor="middle" class="body">This certificate is awarded in recognition of the successful completion of all required coursework and</text>
  <text x="800" y="783" text-anchor="middle" class="body">assessments.</text>
  <text x="92" y="934" class="label">DATE OF COMPLETION</text>
  <text x="92" y="973" class="value">${issuedDate || 'Date'}</text>
  <text x="1508" y="934" class="label" text-anchor="end">CERTIFICATE ID</text>
  <text x="1508" y="973" class="value" text-anchor="end">${certificateNo}</text>
  <text x="800" y="879" text-anchor="middle" class="body">We congratulate ${studentName} on this achievement and wish them continued success in their learning</text>
  <text x="800" y="916" text-anchor="middle" class="body">journey and future career endeavors.</text>
  <text x="88" y="991" fill="#21b8b1" style="font: 800 20px Arial, sans-serif;">Empowering Learners. Building Futures.</text>
  <text x="800" y="1002" text-anchor="middle" fill="#273142" style="font: 700 24px Arial, sans-serif;">Authorized Signature</text>
  <text x="800" y="1036" text-anchor="middle" fill="#5b6a82" style="font: 400 19px Arial, sans-serif;">UptoSkills</text>
  <text x="1264" y="1002" text-anchor="middle" fill="#273142" style="font: 700 24px Arial, sans-serif;">Course Instructor</text>
  <text x="1264" y="1036" text-anchor="middle" fill="#5b6a82" style="font: 400 19px Arial, sans-serif;">${instructorName}</text>
</svg>`
}


import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
/* eslint-disable no-unreachable -- Legacy page versions remain below the active returns temporarily to preserve user-authored work. */
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { AlertCircle, ArrowRight, Award, BadgeCheck, BarChart3, Bell, BookOpenCheck, Bookmark, BriefcaseBusiness, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, Compass, CreditCard, FileQuestion, GraduationCap, Headphones, Layers3, LifeBuoy, LockKeyhole, Mail, MessageSquare, MonitorPlay, Newspaper, PlayCircle, RefreshCw, Rocket, Search, Send, Settings, ShieldCheck, Sparkles, Star, Target, Trophy, UserPlus, Users, Video } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { createAdminUser, createCertificate, createCheckout, createCommunityPost, createLiveSession, fetchAdminCourses, fetchAdminLearners, fetchCommunityPosts, fetchCourses, fetchInstructors, fetchInstructorCourses, fetchLearnerReport, fetchLiveSessions, fetchPaymentHistory, fetchPlatformSettings, fetchPortalNotifications, fetchPreferences, fetchSavedCourses, markPortalNotificationRead, removeSavedCourseRequest, reportCommunityPost, savePlatformSettings, savePreferences as savePreferencesRequest, submitContactRequest, uploadAdminCourseAsset } from '../../api/api.js'
import { AdminNotice, AdminPageHeader, FieldError } from '../../components/admin/AdminUI.jsx'
import MetricCard from '../../components/ui/Dashboard/MetricCard.jsx'
import { useTheme } from '../../hooks/useTheme.js'

const SUPPORT_EMAIL = 'rajamarpu05@gmail.com'

function Shell({ eyebrow, title, description, children, action }) {
  return (
    <section className="space-y-8 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.26em] text-cyan-700 dark:text-cyan-300">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">{title}</h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          {action}
        </div>
      </div>
      {children}
    </section>
  )
}

function useLiveCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadCourses() {
      try {
        const response = await fetchCourses()
        if (isMounted) setCourses(response.data?.courses || response.data || [])
      } catch (error) {
        console.error('Failed to load live courses:', error)
        if (isMounted) setCourses([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void loadCourses()
    return () => {
      isMounted = false
    }
  }, [])

  return { courses, loading }
}

function getLevelRank(level) {
  const normalized = String(level || '').trim().toUpperCase()
  if (normalized.includes('BEGINNER')) return 1
  if (normalized.includes('INTERMEDIATE')) return 2
  if (normalized.includes('ADVANCED')) return 3
  return 2
}

function CardGrid({ items }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="glass-card p-6 shadow-soft">
          <item.icon className="text-cyan-700 dark:text-cyan-300" size={26} />
          <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.text}</p>
        </div>
      ))}
    </div>
  )
}

function FeatureTile({ icon: Icon, title, text, tone = 'from-cyan-500 to-teal-600' }) {
  return (
    <article className="glass-card group flex h-full min-h-[15rem] flex-col rounded-xl p-6 shadow-soft transition hover:-translate-y-1">
      <div className={`grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br ${tone} text-white shadow-soft`}>
        <Icon size={22} />
      </div>
      <h3 className="mt-5 min-h-7 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
    </article>
  )
}

function MetricStrip({ metrics }) {
  const tones = ['blue', 'teal', 'orange', 'rose', 'emerald', 'sky']
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.label}
          title={metric.label}
          value={metric.value}
          detail={metric.detail || ''}
          tone={tones[index % tones.length]}
          variant="learner"
          className="min-h-[150px]"
        />
      ))}
    </div>
  )
}

export function AboutPage() {
  const pillars = [
    {
      icon: GraduationCap,
      title: 'Career-first learning',
      text: 'Programs are shaped around employability, practical projects, assessment readiness, and the confidence freshers need before interviews.',
      tone: 'from-orange-500 to-amber-500',
    },
    {
      icon: Target,
      title: 'Guided skill growth',
      text: 'Learners move through structured paths with measurable progress, feedback loops, and recommendations that keep the next step clear.',
      tone: 'from-cyan-500 to-teal-600',
    },
    {
      icon: Trophy,
      title: 'Verified outcomes',
      text: 'Certificates, completion history, and assessment records help learners show credible proof of work to mentors, teams, and employers.',
      tone: 'from-emerald-500 to-teal-600',
    },
  ]

  const metrics = [
    { value: '500K+', label: 'learners supported' },
    { value: '1K+', label: 'industry mentors' },
    { value: '5K+', label: 'learning resources' },
    { value: '95%', label: 'reported satisfaction' },
  ]

  return (
    <Shell
      eyebrow="About UptoSkills"
      title="Transforming Education Through Expert-Led Learning"
      description="UptoSkills helps learners turn interest into employable skill through expert content, guided practice, assessments, certificates, and dashboards that keep every role focused."
      action={
        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[42rem]">
          {[
            [BookOpenCheck, 'Structured courses', 'Clear paths from discovery to completion.'],
            [Target, 'Practice-led growth', 'Assignments and progress keep learning active.'],
            [Award, 'Proof of skill', 'Certificates and records support career outcomes.'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="rounded-lg border border-[var(--border-color)] bg-white/70 p-4 text-left shadow-sm dark:bg-slate-950/40">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                <Icon size={18} />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-950 dark:text-white">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      }
    >
      <div className="space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-card rounded-xl p-6 shadow-soft sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Our mission</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Make freshers job-ready with learning that feels practical from day one.</h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              We bridge the gap between academic theory and industry expectations by combining clear course structure, hands-on assignments, mentor-style guidance, and proof of progress.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['Role-based dashboards', 'Practical assessments', 'Verified certificates', 'AI-assisted learning'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-slate-950 p-6 text-white shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Platform focus</p>
                <h3 className="mt-2 text-2xl font-semibold">Learn. Prove. Grow.</h3>
              </div>
              <Rocket className="text-orange-300" size={34} />
            </div>
            <div className="mt-8 space-y-4">
              {['Discover the right course path', 'Practice with real assignments', 'Track progress across modules', 'Share completion proof'].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-slate-950">{index + 1}</span>
                  <p className="text-sm leading-6 text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => <FeatureTile key={pillar.title} {...pillar} />)}
        </div>

        <MetricStrip metrics={metrics} />
      </div>
    </Shell>
  );
}

export function ServicesPage() {
  const services = [
    {
      icon: BarChart3,
      title: 'Learning analytics',
      text: 'Track completion, engagement, assessment performance, and learner momentum with useful dashboard insights.',
      tone: 'from-cyan-500 to-teal-600',
    },
    {
      icon: ClipboardCheck,
      title: 'Skill assessments',
      text: 'Run quizzes, assignments, question practice, retakes, and evaluations that make progress measurable.',
      tone: 'from-emerald-500 to-teal-600',
    },
    {
      icon: MonitorPlay,
      title: 'Course delivery',
      text: 'Publish structured lessons, videos, resources, learning modules, and premium content in one learning flow.',
      tone: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Users,
      title: 'Community learning',
      text: 'Support peer discussion, study groups, instructor updates, and collaborative learning moments.',
      tone: 'from-orange-500 to-amber-500',
    },
    {
      icon: Award,
      title: 'Certification',
      text: 'Issue verified certificates with learner, course, date, grade, and validation details for career proof.',
      tone: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Settings,
      title: 'Personalized paths',
      text: 'Adapt recommendations, settings, role experiences, and learning journeys around each learner goal.',
      tone: 'from-teal-500 to-cyan-600',
    },
  ]

  const workflow = [
    ['Plan', 'Choose the learner goal, course sequence, and assessment milestones.'],
    ['Deliver', 'Keep videos, resources, and practice tasks organized inside each course.'],
    ['Measure', 'Use dashboards, scores, progress, and certificates to show outcomes.'],
  ]

  return (
    <Shell eyebrow="Services" title="Complete Learning Platform Services" description="Access the tools needed to manage learning from enrollment to measurable outcomes: course delivery, skill tracking, certification, analytics, and learner support.">
      <div className="space-y-8">
        <section className="grid gap-5 md:grid-cols-3">
          {workflow.map(([title, text], index) => (
            <div key={title} className="glass-card rounded-xl p-6 shadow-soft">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-primary)]">{index + 1}</span>
              <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => <FeatureTile key={service.title} {...service} />)}
        </section>

        <section className="rounded-xl border border-[var(--border-color)] bg-white/75 p-6 shadow-soft dark:bg-slate-950/45 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Built for teams</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">One platform for learners, instructors, and admins.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Protected course access', 'Admin course management', 'Learner progress views', 'Instructor-ready content'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-white/80 p-4 text-sm font-semibold text-slate-700 dark:bg-slate-900/55 dark:text-slate-200">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}

export function FeaturesPage() {
  const features = [
    {
      icon: Bell,
      title: 'Smart notifications',
      text: 'Real-time course updates, deadlines, alerts, and learner activity keep everyone aware of what needs attention.',
      tone: 'from-orange-500 to-amber-500',
    },
    {
      icon: Settings,
      title: 'Personal settings',
      text: 'Theme controls, notification preferences, privacy choices, and account tools make the experience feel owned.',
      tone: 'from-emerald-500 to-teal-600',
    },
    {
      icon: CreditCard,
      title: 'Secure payments',
      text: 'Purchase flows support encrypted transactions, receipts, invoices, and subscription-friendly account records.',
      tone: 'from-cyan-500 to-teal-600',
    },
    {
      icon: Compass,
      title: 'Advanced discovery',
      text: 'Search, filters, categories, and recommendations help learners find the right course without friction.',
      tone: 'from-blue-500 to-cyan-600',
    },
    {
      icon: LockKeyhole,
      title: 'Role-based security',
      text: 'JWT authentication, protected routes, role checks, and secure dashboards keep sensitive workflows controlled.',
      tone: 'from-amber-500 to-red-600',
    },
    {
      icon: MessageSquare,
      title: 'Collaborative learning',
      text: 'Discussion surfaces, groups, instructor touchpoints, and peer support make learning less isolated.',
      tone: 'from-teal-500 to-cyan-600',
    },
  ]

  const platformLayers = [
    ['Experience', 'Responsive design, dark mode, accessible states, and smooth navigation across public and protected pages.'],
    ['Learning core', 'Courses, lessons, assessments, practice questions, progress tracking, and certificates.'],
    ['Operations', 'Admin controls, course forms, learner records, analytics, evaluations, and notification-ready flows.'],
  ]

  return (
    <Shell eyebrow="Features" title="Everything Expected from a Modern SaaS LMS" description="UptoSkills delivers a complete learning ecosystem with protected content, advanced search, notifications, dashboards, profile management, assessments, and responsive design.">
      <div className="space-y-8">
        <section className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => <FeatureTile key={feature.title} {...feature} />)}
        </section>

        <section className="grid items-stretch gap-5 lg:grid-cols-2">
          <div className="glass-card flex h-full flex-col rounded-xl p-6 shadow-soft sm:p-8">
            <Sparkles className="text-orange-500" size={30} />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">Designed to feel complete, not patched together.</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
              The platform connects public discovery, authenticated learning, admin operations, and assessment workflows so the product feels consistent across the full learner lifecycle.
            </p>
            <div className="mt-auto grid gap-3 pt-6 sm:grid-cols-3">
              {['Learner-first', 'Admin-ready', 'Mobile-safe'].map((item) => (
                <span key={item} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-2 text-center text-xs font-bold text-[var(--text-primary)]">{item}</span>
              ))}
            </div>
          </div>
          <div className="grid h-full auto-rows-fr gap-4">
            {platformLayers.map(([title, text]) => (
              <div key={title} className="theme-subcard flex h-full rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <Layers3 className="mt-1 shrink-0 text-cyan-600 dark:text-cyan-300" size={22} />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

export function TeamPage() {
  const leaders = [
    { icon: GraduationCap, title: 'Learning Experience', text: 'Designs career-first curricula, assessments, and learner journeys that feel practical from day one.', tone: 'from-orange-500 to-amber-500' },
    { icon: MonitorPlay, title: 'Platform Engineering', text: 'Ships dashboards, protected learning flows, analytics surfaces, and reliable course delivery.', tone: 'from-cyan-500 to-teal-600' },
    { icon: Headphones, title: 'Learner Success', text: 'Guides learners, instructors, and teams through every milestone with fast, human support.', tone: 'from-emerald-500 to-teal-600' },
  ]
  const culture = [
    ['Outcome obsessed', 'Every course, dashboard, and certificate is judged by whether it helps learners move closer to work-ready skill.'],
    ['Craft matters', 'We care about interface polish, copy clarity, assessment quality, and the small details learners feel every day.'],
    ['Built together', 'Instructors, admins, support, and learners share one platform language so operations stay smooth.'],
  ]

  return (
    <Shell eyebrow="Team" title="The People Building Career-Ready Learning" description="A focused team of learning designers, engineers, instructors, and success specialists shaping UptoSkills into a premium learning platform.">
      <div className="space-y-8">
        <section className="grid gap-5 md:grid-cols-3">
          {leaders.map((leader) => <FeatureTile key={leader.title} {...leader} />)}
        </section>
        <section className="rounded-xl border border-[var(--border-color)] bg-slate-950 p-6 text-white shadow-glow sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">How we work</p>
              <h2 className="mt-3 text-2xl font-semibold">Small teams, clear ownership, measurable outcomes.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                We design every learner touchpoint around clarity: what to learn, what to practice, what to prove, and what to do next.
              </p>
            </div>
            <div className="grid gap-3">
              {culture.map(([title, text]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Shell>
  )

  return (
    <Shell eyebrow="Team" title="Meet the UptoSkills Team" description="Get to know the dedicated professionals behind our mission to make freshers employable through expert-led education.">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                <span className="text-white text-xl">👨‍🏫</span>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Learning Experience Designer</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">UptoSkills</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-xl">💻</span>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Full Stack Developer</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">UptoSkills</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center">
                <span className="text-white text-xl">🎧</span>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Content Specialist</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">UptoSkills</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-center">
           <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                 <span className="text-white text-xl">📊</span>
               </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Data Analyst</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">UptoSkills</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Growth Manager</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">UptoSkills</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white text-xl">🛡️</span>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Security Engineer</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">UptoSkills</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white mb-6">Our Culture</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Innovation</h3>
              <p className="text-slate-600 dark:text-slate-300">
                We continuously innovate to bring the latest educational technologies and methodologies to our learners.
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Accessibility</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Education should be accessible to everyone, regardless of background, location, or financial situation.
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Excellence</h3>
              <p className="text-slate-600 dark:text-slate-300">
                We strive for excellence in everything we do, from course content to user experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function FaqPage() {
  const faqs = [
    ['Is UptoSkills free to use?', 'UptoSkills offers both free and premium courses. You can access many introductory courses at no cost, while specialized certification programs require enrollment.'],
    ['Do I get a certificate after completing a course?', 'Yes! Upon successful completion of any paid course, you receive a verifiable certificate with a unique ID that employers can validate.'],
    ['Can I learn at my own pace?', 'Absolutely. All courses are self-paced, allowing you to learn according to your schedule and revisit materials as needed.'],
    ['What payment methods are accepted?', 'We accept all major credit/debit cards, UPI, net banking, and digital wallets through secure payment gateways.'],
    ['How do I contact support?', 'You can reach our support team through the contact page, email, or in-app messaging for assistance with technical or course-related questions.'],
    ['Is my data secure on UptoSkills?', 'Yes, we use industry-standard encryption, JWT authentication, and regular security audits to protect your personal and learning data.'],
    ['Can employers verify my certificates?', 'Yes, each certificate includes a unique verification code and QR code that employers can use to validate authenticity through our verification portal.'],
    ['Are courses updated regularly?', 'Our instructors and content team regularly update courses to reflect current industry trends, tools, and best practices.']
  ];
  return (
    <Shell eyebrow="FAQ" title="Answers Before You Commit" description="Clear answers about access, certificates, support, payments, security, and how UptoSkills helps learners show real progress.">
      <div className="grid gap-4 lg:grid-cols-2">
        {faqs.map(([question, answer], index) => (
          <article key={question} className="glass-card rounded-xl p-6 shadow-soft">
            <div className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-primary)]">{index + 1}</span>
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{answer}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  )

  return (
    <Shell eyebrow="FAQ" title="Frequently Asked Questions" description="Find answers to common questions about the UptoSkills learning platform, features, and policies.">
      <div className="space-y-6">
        {faqs.map(([question, answer], index) => (
          <div key={index} className="glass-card p-6 border-2 border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-shrink-0">
                <Bell className="text-cyan-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{question}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function BlogPage() {
  const navigate = useNavigate()
  const columns = [
    { icon: BriefcaseBusiness, title: 'Career playbooks', text: 'Interview prep, resumes, portfolios, and job-readiness guides for early-career learners.', tone: 'from-orange-500 to-amber-500' },
    { icon: Sparkles, title: 'Technology shifts', text: 'Practical explainers on AI, data, web, cloud, and the tools changing modern teams.', tone: 'from-cyan-500 to-teal-600' },
    { icon: GraduationCap, title: 'Learning strategy', text: 'How to practice, retain, assess, and turn course progress into visible career proof.', tone: 'from-emerald-500 to-teal-600' },
  ]
  const articles = [
    ['Campus to career without the guesswork', 'A practical roadmap for converting coursework into portfolio-ready projects and interview stories.'],
    ['How AI changes beginner learning paths', 'Where AI helps, where fundamentals still matter, and how learners can use both responsibly.'],
    ['Certificates that actually carry signal', 'What employers look for when a learner shares completion proof, projects, and assessment results.'],
  ]

  return (
    <Shell eyebrow="Blog" title="Learning and Career Insights" description="Practical, career-aware writing that supports the learning journey instead of floating beside it.">
      <div className="space-y-8">
        <section className="grid gap-5 md:grid-cols-3">
          {columns.map((item) => <FeatureTile key={item.title} {...item} />)}
        </section>
        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="glass-card rounded-xl p-6 shadow-soft sm:p-8">
            <Newspaper className="text-orange-500" size={30} />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">Featured reads for serious learners.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Guides are written around decisions learners actually face: what to study, how to practice, and how to prove it.
            </p>
            <Button className="mt-6" onClick={() => navigate('/explore')}>Explore Courses</Button>
          </div>
          <div className="grid gap-4">
            {articles.map(([title, text]) => (
              <article key={title} className="rounded-xl border border-[var(--border-color)] bg-white/75 p-5 shadow-sm dark:bg-slate-950/45">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  )

  return (
    <Shell eyebrow="Blog" title="Learning & Career Insights" description="Stay updated with the latest trends in education, technology, and career development through our expert-written articles and guides.">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Newspaper className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Career Development</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Expert advice on resume building, interview preparation, skill gap analysis, and job search strategies tailored to today's market demands.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Newspaper className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Technology Trends</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Stay ahead of the curve with insights on emerging technologies, programming languages, frameworks, and industry best practices.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Newspaper className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Learning Strategies</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Proven techniques for effective learning, time management, knowledge retention, and skill application in real-world scenarios.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white mb-6">Featured Articles</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">From Campus to Corporation: Bridging the Skill Gap</h3>
              <p className="text-slate-600 dark:text-slate-300">
                How recent graduates can transition successfully from academic environments to professional workplaces through targeted upskilling.
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">The Future of AI in Education</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Exploring how artificial intelligence is transforming learning experiences, personalization, and assessment methodologies.
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Building Your Personal Brand Online</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Strategies for establishing a professional online presence that attracts opportunities and showcases your expertise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function CareersPage() {
  const navigate = useNavigate()
  const roles = [
    { icon: BriefcaseBusiness, title: 'Frontend Engineer', text: 'Build polished dashboards, catalog surfaces, and premium learner workflows.', tone: 'from-cyan-500 to-teal-600' },
    { icon: Users, title: 'Course Success Manager', text: 'Help instructors launch high-quality programs and improve learner outcomes.', tone: 'from-orange-500 to-amber-500' },
    { icon: LifeBuoy, title: 'Support Specialist', text: 'Give learners and teams fast, human help across platform and course questions.', tone: 'from-emerald-500 to-teal-600' },
  ]

  return (
    <Shell eyebrow="Careers" title="Build the Future of Online Learning" description="Join a team improving how freshers learn, practice, prove skills, and move into career opportunities.">
      <div className="space-y-8">
        <section className="grid gap-5 md:grid-cols-3">
          {roles.map((role) => <FeatureTile key={role.title} {...role} />)}
        </section>
        <section className="rounded-xl border border-[var(--border-color)] bg-white/75 p-6 shadow-soft dark:bg-slate-950/45 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Work on a product where craft meets impact.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">We value clear thinking, strong execution, learner empathy, and the patience to make complex systems feel simple.</p>
            </div>
            <Button onClick={() => navigate('/contact')}>Contact Hiring Team</Button>
          </div>
        </section>
      </div>
    </Shell>
  )

  return (
    <Shell eyebrow="Careers" title="Build the future of online learning" description="A careers page ready for hiring instructors, engineers, designers, and support specialists.">
      <CardGrid items={[
        { icon: BriefcaseBusiness, title: 'Frontend Engineer', text: 'Build responsive dashboards and premium learning surfaces.' },
        { icon: Users, title: 'Course Success Manager', text: 'Help instructors launch high-quality learning programs.' },
        { icon: LifeBuoy, title: 'Support Specialist', text: 'Support learners and teams with fast, human help.' },
      ]} />
    </Shell>
  )
}

export function HelpCenterPage() {
  const navigate = useNavigate()
  const topics = [
    { icon: LifeBuoy, title: 'Getting started', text: 'Create your account, explore courses, enroll, and understand your learner dashboard.', tone: 'from-cyan-500 to-teal-600' },
    { icon: FileQuestion, title: 'Certificates', text: 'Learn how completion, verification IDs, and certificate eligibility work.', tone: 'from-emerald-500 to-teal-600' },
    { icon: CreditCard, title: 'Billing and access', text: 'Resolve payment, subscription, enrollment, and protected-content questions.', tone: 'from-orange-500 to-amber-500' },
  ]
  const quickLinks = [
    ['Browse the catalog', '/explore'],
    ['Read the FAQ', '/faq'],
    ['Contact support', '/contact'],
  ]

  return (
    <Shell eyebrow="Help Center" title="Fast Answers for Learners and Teams" description="Find the right guide, solve access issues, and get a clear next step without digging through a generic support wall.">
      <div className="space-y-8">
        <section className="grid gap-5 md:grid-cols-3">
          {topics.map((topic) => <FeatureTile key={topic.title} {...topic} />)}
        </section>
        <section className="glass-card rounded-xl p-6 shadow-soft sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Quick actions</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">Jump directly to the page that solves the problem.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {quickLinks.map(([label, route]) => (
                <Button key={route} variant="secondary" onClick={() => navigate(route)}>{label}</Button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Shell>
  )

  return (
    <Shell eyebrow="Help Center" title="Get Help & Support" description="Find answers to common questions, access tutorials, and contact our support team for assistance with any aspect of the UptoSkills platform.">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <LifeBuoy className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Getting Started</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Learn how to create your account, explore courses, enroll in programs, and start your learning journey with our step-by-step guides.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <FileQuestion className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Certificates & Accreditation</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Understand how our certification system works, how to verify certificates, and what accreditations our courses hold.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Technical Support</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Get help with platform issues, payment problems, video playback, or any technical difficulties you encounter.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Community Help</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Connect with other learners, ask questions in our forums, and benefit from peer-to-peer support and knowledge sharing.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white mb-6">Contact Support</h2>
          <p className="mb-4 text-slate-600 dark:text-slate-300">
            Still need help? Our support team is available 24/7 to assist you with any questions or issues.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Email Support</h3>
              <p className="text-slate-600 dark:text-slate-300">
                support@uptoskills.com
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Live Chat</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Available Monday-Friday, 9AM-6PM IST
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Help Center</h3>
              <p className="text-slate-600 dark:text-slate-300">
                comprehensive FAQs and troubleshooting guides
              </p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function SupportPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'Learning support',
    message: '',
  })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const supportOptions = [
    { icon: FileQuestion, title: 'FAQ', text: 'Find quick answers to common course, account, payment, and certificate questions.', action: () => navigate('/faq'), actionLabel: 'Browse questions' },
    { icon: LifeBuoy, title: 'Help Center', text: 'Follow guided troubleshooting for learning, enrollment, playback, and access.', action: () => navigate('/help'), actionLabel: 'Open help center' },
    { icon: BookOpenCheck, title: 'Documentation', text: 'Review platform guidance, learning workflows, and account instructions.', action: () => navigate('/help'), actionLabel: 'Read documentation' },
    { icon: ClipboardCheck, title: 'Raise Ticket', text: 'Submit a detailed support request through the existing contact workflow.', action: () => document.getElementById('support-ticket')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), actionLabel: 'Create ticket' },
    { icon: Mail, title: 'Contact Support', text: `Email the support team directly at ${SUPPORT_EMAIL}.`, action: () => navigate('/contact'), actionLabel: 'Contact the team' },
  ]
  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (status.message) setStatus({ type: '', message: '' })
  }
  const handleSupportSubmit = async (event) => {
    event.preventDefault()
    const email = form.email.trim()
    const message = form.message.trim()
    if (!email || !message) {
      setStatus({ type: 'error', message: 'Please enter your email and support message before sending.' })
      return
    }

    setSubmitting(true)
    try {
      await submitContactRequest({
        name: form.name.trim(),
        email,
        message: `[${form.topic}] ${message}`,
      })
      setStatus({ type: 'success', message: 'Your support ticket was submitted successfully. The team can now review it.' })
      setForm((current) => ({ ...current, message: '' }))
    } catch (error) {
      console.error('Support request failed:', error)
      setStatus({ type: 'warning', message: `We could not save the request. Please retry or email ${SUPPORT_EMAIL}.` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Shell
      eyebrow="Support"
      title="Get Help From the UptoSkills Team"
      description="Send learning, account, course, certificate, or platform questions directly to support."
      action={<Button variant="secondary" onClick={() => navigate('/faq')}>Browse FAQ</Button>}
    >
      <div className="space-y-8">
        <section className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {supportOptions.map((option) => (
            <button key={option.title} type="button" onClick={option.action} className="enterprise-glow-card platform-card group flex min-h-[17rem] flex-col p-5 text-left transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><option.icon size={22} /></span>
              <h2 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">{option.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-secondary)]">{option.text}</p>
              <span className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${option.placeholder ? 'text-[var(--text-muted)]' : 'text-[var(--accent-primary)]'}`}>{option.actionLabel}<ArrowRight size={15} /></span>
            </button>
          ))}
        </section>
        <section className="grid items-stretch gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="glass-card flex h-full flex-col p-6 shadow-soft">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-soft">
              <Mail size={22} />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[var(--text-primary)]">Direct support contact</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Send your question to the support inbox. Include your course name, account email, page, and the action that needs help so the issue can be handled faster.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=UptoSkills%20support%20request`}
              className="mt-5 inline-flex break-all rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)]"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
              Note: the app saves support requests through the existing contact endpoint when available. Email delivery opens the user&apos;s mail app so they can send it directly to your inbox.
            </p>
            <div className="mt-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Need a quick answer?</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Check common help topics before sending a request.</p>
              <Button variant="secondary" className="mt-4" onClick={() => navigate('/faq')}>Open FAQ</Button>
            </div>
          </div>

          <form id="support-ticket" onSubmit={handleSupportSubmit} className="glass-card grid scroll-mt-28 content-start gap-5 p-6 shadow-soft">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-primary)]">Send a request</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Tell us what you need help with</h2>
            </div>

            {status.message ? (
              <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                status.type === 'error'
                  ? 'border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-100'
                  : status.type === 'warning'
                    ? 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-100'
                    : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
              }`}>
                {status.message}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-[var(--text-primary)]">
                Your name
                <input
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--input-text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                  placeholder="Enter your name"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-[var(--text-primary)]">
                Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm('email', event.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--input-text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                  placeholder="you@example.com"
                  required
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-semibold text-[var(--text-primary)]">
              Support topic
              <select
                value={form.topic}
                onChange={(event) => updateForm('topic', event.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--input-text)] outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
              >
                <option>Learning support</option>
                <option>Login or account issue</option>
                <option>Course access</option>
                <option>Payment or enrollment</option>
                <option>Certificate issue</option>
                <option>Admin or instructor help</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-[var(--text-primary)]">
              Message
              <textarea
                value={form.message}
                onChange={(event) => updateForm('message', event.target.value)}
                className="min-h-36 w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-sm leading-6 text-[var(--input-text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                placeholder="Describe the issue, course name, page, or action where you need help."
                required
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="submit" loading={submitting} loadingLabel="Preparing email..." disabled={submitting}>
                <Send size={16} className="mr-2" /> Submit support ticket
              </Button>
              <Button type="button" variant="secondary" onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}?subject=UptoSkills%20support%20request` }}>
                Open email app
              </Button>
            </div>
          </form>
        </section>
      </div>
    </Shell>
  )

  return (
    <Shell eyebrow="Support" title="Expert Help When You Need It" description="Get personalized assistance with your learning journey, technical issues, account management, and course-related questions from our dedicated support team.">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Headphones className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Learning Support</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Get help with course concepts, assignments, projects, and skill development from our expert learning assistants.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Technical Assistance</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Resolve platform issues, payment problems, video playback difficulties, and access concerns with our technical team.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <UserPlus className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Account Help</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Manage your profile, subscription, notifications, and privacy settings with guidance from our support specialists.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white mb-6">Support Channels</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Email</h3>
              <p className="text-slate-600 dark:text-slate-300">
                support@uptoskills.com
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Live Chat</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Available 24/7 for urgent issues
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Phone</h3>
              <p className="text-slate-600 dark:text-slate-300">
                +91-1800-UPTOSKILL (Mon-Fri, 9AM-6PM IST)
              </p>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Community Forum</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Peer-to-peer help and knowledge sharing
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Support Hours</h3>
            <p className="text-slate-600 dark:text-slate-300">
              Our support team is available to help you succeed in your learning journey.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <Shell eyebrow="Access Restricted" title="You Don't Have Permission" description="This area of UptoSkills is restricted to specific user roles. Please check your account permissions or contact support if you believe this is an error.">
      <div className="space-y-8">
        <div className="glass-card p-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <ShieldCheck className="text-red-500" size={24} />
          </div>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white mb-4">
            Access to this area is restricted
          </h2>
          <p className="mb-6 text-slate-600 dark:text-slate-300 max-w-xl">
            You're trying to access a section that requires specific permissions. This could be an admin-only area, instructor resources, or premium content that requires enrollment or subscription.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">What you can do</h3>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                • Return to your dashboard or home page<br/>
                • Check if you're logged in with the correct account<br/>
                • Verify your account type and permissions<br/>
                • Contact support if you need access to this area
              </p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Common Reasons</h3>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                • Trying to access admin features as a learner<br/>
                • Attempting to view instructor-only content<br/>
                • Accessing premium courses without enrollment<br/>
                • Attempting to modify another user's account
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-center space-x-4">
              <Button onClick={() => navigate('/')}>
                Go to Home
              </Button>
              <Button variant="secondary" onClick={() => navigate('/login')}>
                Login with Different Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [filter, setFilter] = useState('All')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const role = String(user?.role || '').toLowerCase()

  async function loadNotifications() {
    try {
      setLoading(true)
      setError('')
      const response = await fetchPortalNotifications({ pageSize: 50 })
      setNotifications((response.data?.notifications || []).map((item) => ({
        ...item,
        icon: Bell,
        text: item.body,
        time: new Date(item.createdAt).toLocaleString(),
        badge: item.isRead ? 'Read' : 'New',
        category: 'Account',
        priority: 'Medium',
        unread: !item.isRead,
        action: 'Mark as read',
      })))
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { const timer = window.setTimeout(() => { void loadNotifications() }, 0); return () => window.clearTimeout(timer) }, [])

  async function openNotification(notification) {
    if (notification.unread) {
      await markPortalNotificationRead(notification.id)
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, unread: false, isRead: true, badge: 'Read' } : item))
    }
  }

  const categories = ['All', 'Unread']
  const visibleNotifications = notifications.filter((item) => {
    if (filter === 'All') return true
    if (filter === 'Unread') return item.unread
    return true
  })

  return (
    <Shell eyebrow={role === 'instructor' ? 'Instructor notifications' : 'Notifications'} title={role === 'instructor' ? 'Teaching and Course Updates' : 'Your Learning Updates'} description="Review persisted account, course, assessment, and platform notifications.">
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <NotificationMetric label="Unread" value={notifications.filter((item) => item.unread).length} />
          <NotificationMetric label="Total" value={notifications.length} />
          <NotificationMetric label="Status" value={loading ? 'Loading' : 'Current'} />
        </div>
        <div className="glass-card p-5 shadow-soft sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(34rem,0.95fr)] xl:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Notification Preferences</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Customize how and when you receive updates from UptoSkills.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ToggleInput 
                label="Email Notifications" 
                description="Get updates via email"
                defaultChecked={true}
              />
              <ToggleInput 
                label="Push Notifications" 
                description="Receive browser notifications"
                defaultChecked={true}
              />
              <ToggleInput 
                label="SMS Alerts" 
                description="Get urgent updates via text"
                defaultChecked={false}
              />
            </div>
          </div>
        </div>
        
        <section className="space-y-4 border-t border-[var(--border-color)] pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Inbox</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Recent Updates</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button key={category} type="button" onClick={() => setFilter(category)} className={`min-h-10 rounded-lg border px-3 text-sm font-semibold transition ${filter === category ? 'border-cyan-400 bg-cyan-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-cyan-400/50'}`}>
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {loading ? Array.from({ length: 3 }).map((_, index) => <span key={index} className="skeleton h-28 rounded-xl" />) : null}
            {!loading && error ? <div className="glass-card rounded-xl p-6 text-center"><AlertCircle className="mx-auto text-red-500" /><p className="mt-3 text-sm text-[var(--text-secondary)]">{error}</p><Button className="mt-4" variant="secondary" onClick={loadNotifications}><RefreshCw size={16} /> Retry</Button></div> : null}
            {!loading && !error && visibleNotifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onOpen={() => openNotification(notification)} />
            ))}
            {!loading && !error && !visibleNotifications.length ? <div className="glass-card rounded-xl p-8 text-center"><Bell className="mx-auto text-[var(--accent-primary)]" /><p className="mt-3 font-bold text-[var(--text-primary)]">No notifications in this view</p><p className="mt-1 text-sm text-[var(--text-secondary)]">New account and learning updates will appear here.</p></div> : null}
          </div>
        </section>
        
        <div className="border-t border-[var(--border-color)] pt-8">
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => navigate('/settings')}>
              Manage All Notifications
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function NotificationMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 text-[var(--text-primary)] shadow-soft dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.18),rgba(20,184,166,0.18),rgba(255,107,53,0.2))]">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)] dark:text-white/90">{label}</p>
      <p className="mt-2 text-2xl font-black text-[var(--text-primary)] dark:text-white">{value}</p>
    </div>
  )
}

function NotificationRow({ notification, onOpen }) {
  const Icon = notification.icon
  const toneClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-200',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-200',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  }

  return (
    <article className="glass-card grid gap-4 rounded-xl p-4 shadow-soft transition hover:-translate-y-0.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${toneClasses[notification.tone] || toneClasses.cyan}`}>
        <Icon size={21} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">{notification.title}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[notification.tone] || toneClasses.cyan}`}>
            {notification.badge}
          </span>
          <span className="rounded-full border border-[var(--border-color)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">{notification.category}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${notification.priority === 'High' ? 'bg-red-500/10 text-red-700 dark:text-red-100' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'}`}>{notification.priority}</span>
          {notification.unread ? <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" aria-label="Unread notification" /> : null}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.text}</p>
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{notification.time}</p>
      </div>
      <Button variant="secondary" onClick={onOpen}>
        {notification.action}
      </Button>
    </article>
  )
}

// Helper component for toggle inputs
function ToggleInput({ label, description, defaultChecked, checked: controlledChecked, onChange }) {
  const [localChecked, setLocalChecked] = useState(defaultChecked)
  const checked = controlledChecked ?? localChecked
  const updateChecked = (next) => {
    if (onChange) onChange(next)
    else setLocalChecked(next)
  }
  
  return (
    <label className="group flex min-h-[4.75rem] cursor-pointer items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition hover:border-cyan-300 hover:shadow-sm dark:hover:border-cyan-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => updateChecked(e.target.checked)}
        className="peer sr-only"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
        <p className="text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
      </div>
      <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:bg-cyan-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-500 peer-focus-visible:ring-offset-2 dark:bg-slate-700" />
    </label>
  );
}

export function SettingsPage() {
  const user = useSelector((state) => state.auth.user)
  const isInstructor = String(user?.role || '').toLowerCase() === 'instructor'
  const { theme, setTheme } = useTheme()
  const defaults = useMemo(() => ({
    emailNotifications: true,
    learningReminders: true,
    productUpdates: false,
    weeklyGoals: true,
    autoplay: false,
    practiceRecommendations: true,
    compactCards: true,
    showStreaks: true,
    recommendations: true,
    profileVisibility: true,
    securityAlerts: true,
    certificateSharing: true,
    loginAlerts: true,
    twoFactorPrompts: true,
    inAppNotifications: true,
    certificateAutoDownload: false,
    certificateNameVerification: true,
    paymentReceipts: true,
    paymentReminders: true,
    savePaymentMethod: false,
    language: 'English',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  }), [])
  const [preferences, setPreferences] = useState(() => {
    try {
      return { ...defaults, ...JSON.parse(window.localStorage.getItem('uptoskills-preferences') || '{}') }
    } catch {
      return defaults
    }
  })
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let mounted = true
    fetchPreferences().then((response) => {
      if (mounted) setPreferences((current) => ({ ...current, ...(response.data?.settings || {}) }))
    }).catch(() => {}).finally(() => {})
    return () => { mounted = false }
  }, [])
  const groups = [
    ...(isInstructor ? [{
      title: 'Teaching workspace',
      icon: GraduationCap,
      items: [
        ['weeklyGoals', 'Session planning reminders', 'Receive reminders before scheduled teaching sessions.'],
        ['practiceRecommendations', 'Submission alerts', 'Show new learner submissions requiring evaluation.'],
        ['recommendations', 'Course performance summaries', 'Receive engagement and completion summaries for assigned courses.'],
      ],
    }] : []),
    {
      title: 'Learning experience',
      icon: BookOpenCheck,
      items: [
        ['weeklyGoals', 'Weekly goal reminders', 'Keep study momentum visible on the dashboard.'],
        ['autoplay', 'Autoplay next lesson', 'Move smoothly through course modules.'],
        ['practiceRecommendations', 'Practice recommendations', 'Show assessment prompts after lessons.'],
      ],
    },
    {
      title: 'Dashboard & discovery',
      icon: Settings,
      items: [
        ['compactCards', 'Compact dashboard cards', 'Use cleaner LMS summaries on smaller screens.'],
        ['showStreaks', 'Show learning streaks', 'Highlight rhythm, progress, and milestones.'],
        ['recommendations', 'Course recommendations', 'Personalize suggestions from enrolled activity.'],
      ],
    },
    {
      title: 'Privacy & security',
      icon: ShieldCheck,
      items: [
        ['profileVisibility', 'Profile visibility', 'Control what other learners can see.'],
        ['securityAlerts', 'Security alerts', 'Notify me about password and session activity.'],
        ['loginAlerts', 'New login alerts', 'Send an alert when a new browser signs in.'],
        ['twoFactorPrompts', 'OTP security prompts', 'Use email verification for sensitive account recovery.'],
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        ['emailNotifications', 'Email notifications', 'Receive live class and task reminders.'],
        ['inAppNotifications', 'In-app notifications', 'Show course and account updates in the LMS.'],
        ['learningReminders', 'Learning reminders', 'Nudge me when courses or assessments are due.'],
        ['productUpdates', 'Product updates', 'Get new feature and content release notes.'],
      ],
    },
    {
      title: 'Certificates',
      icon: Award,
      items: [
        ['certificateSharing', 'Certificate sharing', 'Allow verified certificate links from your profile.'],
        ['certificateAutoDownload', 'Automatic download', 'Prepare certificates for download after course completion.'],
        ['certificateNameVerification', 'Verify certificate name', 'Use your saved profile name on new credentials.'],
      ],
    },
    {
      title: 'Payments',
      icon: CreditCard,
      items: [
        ['paymentReceipts', 'Payment receipts', 'Send a receipt after successful course payments.'],
        ['paymentReminders', 'Payment reminders', 'Notify me about pending or incomplete payments.'],
        ['savePaymentMethod', 'Remember payment preference', 'Remember the preferred payment type on this device.'],
      ],
    },
  ]

  async function savePreferences() {
    setSaving(true)
    window.localStorage.setItem('uptoskills-preferences', JSON.stringify(preferences))
    try {
      await savePreferencesRequest(preferences)
      setNotice('Settings saved and synchronized successfully.')
    } catch {
      setNotice('Settings saved on this device. Server synchronization is temporarily unavailable.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell eyebrow={isInstructor ? 'Instructor settings' : 'Settings'} title={isInstructor ? 'Teaching workspace preferences' : 'Your learning preferences'} description={isInstructor ? 'Configure teaching notifications, course summaries, session reminders, security, and account preferences.' : 'Personalize how you learn, receive updates, and manage your account.'} action={<Button variant="secondary" onClick={() => window.location.assign(isInstructor ? '/instructor/profile' : '/profile')}>Edit profile</Button>}>
      <div className="grid gap-6">
        <aside className="glass-card grid gap-5 rounded-2xl p-5 shadow-soft md:grid-cols-2 sm:p-6 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Account readiness</p>
          <h2 className="mt-3 text-2xl font-black text-[var(--text-primary)]">{user?.fullName || user?.name || 'Learner'} settings</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Keep the learning portal comfortable, secure, and tuned for daily course progress.</p>
            <div className="mt-5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Signed in as</p>
              <p className="mt-2 break-all text-sm font-bold text-[var(--text-primary)]">{user?.email || 'Account email not available'}</p>
            </div>
          </div>
          <div className="grid content-start gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
            {['Profile details saved', 'Notifications configured', 'Security alerts enabled', 'Theme follows selected mode'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-[var(--bg-secondary)] p-3 text-sm font-semibold text-[var(--text-primary)]">
                <CheckCircle2 className="text-emerald-500" size={17} />
                {item}
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-primary)]">Theme Settings</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Choose a light or dark appearance.</p>
            <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Theme preference">
              {['light', 'dark'].map((option) => (
                <button key={option} type="button" onClick={() => setTheme(option)} aria-pressed={theme === option} className={`min-h-11 rounded-lg border px-2 text-xs font-bold capitalize transition ${theme === option ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4 md:col-span-2 xl:col-span-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-primary)]">Language Settings</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Language<select value={preferences.language} onChange={(event) => setPreferences((current) => ({ ...current, language: event.target.value }))} className="admin-input mt-2"><option>English</option><option>Hindi</option></select></label>
              <label className="text-sm font-semibold text-[var(--text-primary)]">Timezone<select value={preferences.timezone} onChange={(event) => setPreferences((current) => ({ ...current, timezone: event.target.value }))} className="admin-input mt-2"><option value="Asia/Kolkata">India Standard Time</option><option value="UTC">UTC</option><option value="Asia/Dubai">Gulf Standard Time</option></select></label>
              <label className="text-sm font-semibold text-[var(--text-primary)]">Currency<select value={preferences.currency} onChange={(event) => setPreferences((current) => ({ ...current, currency: event.target.value }))} className="admin-input mt-2"><option value="INR">INR — Indian Rupee</option><option value="USD">USD — US Dollar</option></select></label>
            </div>
          </div>
        </aside>
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Preferences</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Turn features on or off whenever you need.</p>
          </div>
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const GroupIcon = group.icon
            return (
              <section key={group.title} className="glass-card rounded-2xl p-5 shadow-soft sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[var(--accent-soft)] p-2.5 text-[var(--accent-primary)]"><GroupIcon size={20} /></div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{group.title}</h3>
                </div>
                <div className="mt-5 grid gap-3">
                  {group.items.map(([key, title, text]) => (
                    <ToggleInput key={key} label={title} description={text} checked={preferences[key]} onChange={(checked) => setPreferences((current) => ({ ...current, [key]: checked }))} />
                  ))}
                </div>
              </section>
            )
          })}
          </div>
        </div>
      </div>
      <div className="glass-card sticky bottom-4 z-20 flex flex-col gap-4 rounded-2xl border border-[var(--border-color)] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm font-semibold text-[var(--text-secondary)]" role="status">{notice || 'Changes stay on this device until you save them.'}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => { setPreferences(defaults); setTheme('light'); window.localStorage.removeItem('uptoskills-preferences'); setNotice('Settings reset to defaults.') }}>Reset</Button>
          <Button onClick={savePreferences} loading={saving} loadingLabel="Saving...">Save settings</Button>
        </div>
      </div>
    </Shell>
  )
}

export function CategoriesPage() {
  const { courses, loading } = useLiveCourses()
  const counts = courses.reduce((acc, course) => {
    const category = course.category || 'Uncategorized'
    acc.set(category, (acc.get(category) || 0) + 1)
    return acc
  }, new Map())
  const categories = Array.from(counts, ([name, count]) => ({ name, count }))
  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-5 pb-12">
      <div className="platform-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Categories</p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Browse by skill area</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Jump directly into focused course collections without scrolling through the full catalog.
            </p>
          </div>
          <Button onClick={() => window.location.assign('/courses')}>View all courses</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="platform-card-muted p-4">
          <p className="text-2xl font-black text-[var(--accent-primary)]">{courses.length}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Total courses</p>
        </div>
        <div className="platform-card-muted p-4">
          <p className="text-2xl font-black text-[var(--accent-primary)]">{categories.length}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Skill categories</p>
        </div>
        <div className="platform-card-muted p-4">
          <p className="text-2xl font-black text-[var(--accent-primary)]">{categories[0]?.name || 'Start'}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Most active area</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="platform-empty-state sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <div>
              <Layers3 className="mx-auto text-[var(--accent-primary)]" size={34} />
              <p className="mt-3 font-bold text-[var(--text-primary)]">Loading categories</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Organizing courses by skill area.</p>
            </div>
          </div>
        ) : null}
        {!loading && categories.length === 0 ? (
          <div className="platform-empty-state sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <div>
              <BookOpenCheck className="mx-auto text-[var(--text-muted)]" size={34} />
              <p className="mt-3 font-bold text-[var(--text-primary)]">No categories yet</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Published courses will appear here automatically once categories are available.</p>
            </div>
          </div>
        ) : null}
        {categories.map((category, index) => {
          const Icon = [BookOpenCheck, Layers3, Target, Trophy][index % 4]
          return (
            <Link
              key={category.name}
              to={`/explore?category=${encodeURIComponent(category.name)}`}
              className="theme-subcard theme-subcard-hover flex min-h-[7.5rem] items-center gap-4 rounded-lg p-4"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-[var(--text-primary)]">{category.name}</span>
                <span className="mt-1 block text-sm text-[var(--text-secondary)]">{category.count} course{category.count === 1 ? '' : 's'}</span>
                <span className="mt-2 inline-flex text-xs font-bold text-[var(--accent-primary)]">Explore category</span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function MentorsPage() {
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const selectedSlug = params.get('mentor') || ''
  const [liveInstructors, setLiveInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    let mounted = true
    async function loadInstructors() {
      try {
        const response = await fetchInstructors()
        if (mounted) setLiveInstructors(response.data?.instructors || [])
      } catch {
        if (mounted) setLiveInstructors([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void loadInstructors()
    return () => {
      mounted = false
    }
  }, [])

  const mentors = useMemo(() => mergeMentors(liveInstructors, fallbackMentors), [liveInstructors])
  const categories = useMemo(() => {
    const values = mentors.map((mentor) => textValue(mentor.courseCategory || mentor.expertise || profileForMentor(mentor).category)).filter(Boolean)
    return ['All', ...Array.from(new Set(values))]
  }, [mentors])
  const filteredMentors = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return mentors.filter((mentor) => {
      const profile = profileForMentor(mentor)
      const matchesCategory = category === 'All' || [mentor.courseCategory, mentor.expertise, profile.category].some((value) => textValue(value).toLowerCase() === category.toLowerCase())
      const haystack = [
        textValue(mentor.name),
        textValue(mentor.email),
        textValue(mentor.expertise),
        textValue(mentor.courseCategory),
        textValue(mentor.bio),
        profile.role,
        profile.quote,
        profile.category,
        ...listValue(profile.expertise),
      ].filter(Boolean).join(' ').toLowerCase()
      return matchesCategory && (!needle || haystack.includes(needle))
    })
  }, [category, mentors, query])
  const liveCount = mentors.filter((mentor) => mentor.isLiveInstructor).length
  const featuredCount = mentors.length - liveCount
  const selectedMentor = selectedSlug ? mentors.find((mentor) => mentorSlug(mentor.name) === selectedSlug || mentorSlug(mentor.id) === selectedSlug) : null

  if (selectedMentor) {
    return (
      <MentorDetailPage
        mentor={selectedMentor}
        onBack={() => navigate('/mentors')}
        onExplore={() => navigate('/courses')}
      />
    )
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-6 pb-14">
      <div className="enterprise-mesh-panel relative overflow-hidden rounded-xl border border-[var(--border-color)] p-5 shadow-glow sm:p-7 lg:p-8">
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] lg:items-end">
          <div className="max-w-4xl">
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.22em]">Mentor network</p>
            <h1 className="mt-3 text-[clamp(2rem,5vw,4.5rem)] font-black leading-[1.02] text-white">
              Learn with mentors built for career momentum.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
              Browse UptoSkills instructors and featured mentor profiles by expertise, mindset, and learning outcome. New instructors added in admin appear here automatically.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => window.location.assign('/courses')}>Explore Courses <ArrowRight size={16} /></Button>
              <Button variant="secondary" onClick={() => window.location.assign('/contact')}>Request Mentor</Button>
            </div>
          </div>
          <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200"><BadgeCheck size={20} /></span>
              <div>
                <p className="font-bold text-white">{liveCount} live instructor{liveCount === 1 ? '' : 's'}</p>
                <p className="text-sm text-slate-300">Synced from admin panel</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-pink-400/15 text-pink-200"><Star size={20} /></span>
              <div>
                <p className="font-bold text-white">{featuredCount} featured profile{featuredCount === 1 ? '' : 's'}</p>
                <p className="text-sm text-slate-300">Curated fallback mentors</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="platform-card-muted p-4">
          <p className="text-2xl font-black text-[var(--accent-primary)]">{mentors.length}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Total profiles</p>
        </div>
        <div className="platform-card-muted p-4">
          <p className="text-2xl font-black text-[var(--accent-primary)]">{liveCount}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Admin instructors</p>
        </div>
        <div className="platform-card-muted p-4">
          <p className="text-2xl font-black text-[var(--accent-primary)]">{categories.length - 1}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Expertise tracks</p>
        </div>
        <div className="platform-card-muted p-4">
          <p className="text-2xl font-black text-[var(--accent-primary)]">1M+</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">Learners guided</p>
        </div>
      </div>

      <div className="platform-card grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input
            aria-label="Search mentors"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="platform-input min-h-12 rounded-xl pl-11 pr-4"
            placeholder="Search by mentor, expertise, category, or outcome"
          />
        </label>
        <select aria-label="Filter mentors by category" value={category} onChange={(event) => setCategory(event.target.value)} className="platform-select min-h-12 rounded-xl px-4">
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <MentorSkeleton key={index} />)}
        </div>
      ) : null}

      {!loading && !filteredMentors.length ? (
        <div className="platform-empty-state">
          <div>
            <p className="text-xl font-bold text-[var(--text-primary)]">No mentors match this filter.</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Try another keyword or category to explore the full mentor network.</p>
            <Button className="mt-5" variant="secondary" onClick={() => { setQuery(''); setCategory('All') }}>Clear filters</Button>
          </div>
        </div>
      ) : null}

      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
        {!loading && filteredMentors.map((mentor) => <MentorCard key={mentorIdentity(mentor)} mentor={mentor} />)}
      </div>
    </section>
  )
}

function MentorDetailPage({ mentor, onBack, onExplore }) {
  const profile = profileForMentor(mentor)
  const expertise = listValue(profile.expertise).length ? listValue(profile.expertise) : ['Guided Learning', 'Career Growth']
  const mentorName = textValue(mentor.name) || 'AI Mentor'

  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-6 pb-14">
      <button type="button" onClick={onBack} className="action-link min-h-11 rounded-full px-5">
        Back to mentors
      </button>

      <div className="enterprise-mesh-panel relative overflow-hidden rounded-xl border border-[var(--border-color)] p-5 shadow-glow sm:p-7 lg:p-8">
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.84fr)_minmax(20rem,0.46fr)] lg:items-center">
          <div>
            <p className="theme-eyebrow text-xs font-black uppercase tracking-[0.24em]">AI Celebrity Mentor</p>
            <h1 className="mt-3 text-[clamp(2.3rem,6vw,5.25rem)] font-black leading-none text-white">{mentorName}</h1>
            <p className="mt-4 max-w-3xl text-xl font-bold text-cyan-100">{expertise.slice(0, 3).join(' • ')}</p>
            <p className="mt-5 max-w-4xl text-base leading-8 text-slate-200 sm:text-lg">{textValue(profile.longBio || profile.quote)}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={onExplore}>Explore Related Courses <ArrowRight size={16} /></Button>
              <Button variant="secondary" onClick={onBack}>View All Mentors</Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[var(--brand-gradient)] opacity-25 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-950/50 p-4 shadow-2xl backdrop-blur">
              <div className="aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-white/8">
                <img src={mentor.avatarUrl || '/favicon.svg'} alt={mentorName} className="h-full w-full object-contain object-center p-3" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-white/10 bg-white/8 p-3">
                  <p className="text-lg font-black text-white">4.9</p>
                  <p className="text-xs text-slate-300">Rating</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/8 p-3">
                  <p className="text-lg font-black text-white">{textValue(profile.courses)}</p>
                  <p className="text-xs text-slate-300">Programs</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/8 p-3">
                  <p className="text-lg font-black text-white">{textValue(profile.learners)}</p>
                  <p className="text-xs text-slate-300">Reach</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(18rem,0.28fr)]">
        <div className="platform-card p-5 sm:p-6">
          <p className="theme-eyebrow text-xs font-black uppercase tracking-[0.2em]">Mentorship focus</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">What learners develop with {mentorName}</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{textValue(profile.longBio || profile.quote)}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {expertise.map((item) => (
              <div key={item} className="theme-subcard flex items-center gap-3 rounded-xl p-4">
                <span className="theme-icon-badge grid h-10 w-10 place-items-center rounded-lg"><CheckCircle2 size={18} /></span>
                <span className="font-bold text-[var(--text-primary)]">{textValue(item)}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="platform-card p-5 sm:p-6">
          <p className="theme-eyebrow text-xs font-black uppercase tracking-[0.2em]">Profile</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Category</p>
              <p className="mt-1 font-black text-[var(--text-primary)]">{textValue(profile.category)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Role</p>
              <p className="mt-1 font-black text-[var(--text-primary)]">{textValue(profile.role)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Availability</p>
              <p className="mt-1 font-black text-[var(--text-primary)]">{mentor.isLiveInstructor ? 'Live instructor' : 'Featured AI mentor'}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function MentorSkeleton() {
  return (
    <div className="platform-card overflow-hidden p-0">
      <div className="skeleton aspect-[16/10] rounded-none" />
      <div className="space-y-4 p-5">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton h-9" />
          <div className="skeleton h-9" />
        </div>
      </div>
    </div>
  )
}

function mergeMentors(liveInstructors, fallbackItems) {
  const map = new Map()
  liveInstructors.forEach((instructor) => {
    const identity = mentorIdentity(instructor)
    if (!identity) return
    const expertise = textValue(instructor.expertise)
    const normalized = {
      ...instructor,
      name: textValue(instructor.name) || 'UptoSkills Instructor',
      email: textValue(instructor.email),
      bio: textValue(instructor.bio),
      expertise,
      courseCategory: expertise || 'Professional Learning',
      isLiveInstructor: true,
    }
    const existing = map.get(identity)
    map.set(identity, existing ? { ...existing, ...normalized, avatarUrl: normalized.avatarUrl || existing.avatarUrl } : normalized)
  })

  fallbackItems.forEach((mentor) => {
    const identity = mentorIdentity(mentor)
    if (!identity) return
    const existing = map.get(identity)
    map.set(identity, existing ? { ...mentor, ...existing, avatarUrl: existing.avatarUrl || mentor.avatarUrl } : mentor)
  })

  return Array.from(map.values())
}

const mentorAliases = {
  'mahendra-singh-dhoni': 'ms-dhoni',
  'mahendra-dhoni': 'ms-dhoni',
  'dhoni': 'ms-dhoni',
  'shahrukh-khan': 'shah-rukh-khan',
  srk: 'shah-rukh-khan',
}

function mentorIdentity(mentor) {
  const avatarName = String(mentor?.avatarUrl || '').split('/').pop()?.replace(/\.[a-z0-9]+$/i, '')
  const emailName = String(mentor?.email || '').split('@')[0]
  const candidates = [mentor?.name, avatarName, emailName, mentor?.id].map(mentorSlug).filter(Boolean)
  const known = candidates.find((candidate) => mentorProfiles[candidate.replace(/-/g, ' ')] || mentorAliases[candidate])
  return mentorAliases[known] || known || candidates[0] || ''
}

function profileForMentor(mentor) {
  return mentorProfiles[String(mentor.name || '').toLowerCase()] || {
    role: textValue(mentor.expertise) || 'Expert Learning Mentor',
    quote: textValue(mentor.bio) || `Explore guided learning with ${textValue(mentor.name) || 'this mentor'} through focused courses and practical outcomes.`,
    expertise: [textValue(mentor.expertise), textValue(mentor.courseCategory), 'Guided Learning', 'Career Growth'].filter(Boolean).slice(0, 4),
    category: textValue(mentor.courseCategory) || textValue(mentor.expertise) || 'Professional Learning',
    courses: mentor.isLiveInstructor ? 'Live Instructor' : 'Course Mentor',
    learners: mentor.isLiveInstructor ? 'Available Now' : 'Active Learners',
  }
}

function textValue(value) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    return textValue(value.name || value.label || value.title || value.value || Object.values(value).map(textValue).filter(Boolean).join(', '))
  }
  return String(value)
}

function listValue(value) {
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean)
  const text = textValue(value)
  return text ? [text] : []
}

function mentorSlug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function relatedCoursesUrl(mentor) {
  const profile = profileForMentor(mentor)
  const terms = [
    textValue(mentor.name),
    textValue(profile.category),
    ...listValue(profile.expertise),
  ]
    .filter(Boolean)
    .join(' ')
  return `/courses?search=${encodeURIComponent(terms || 'career growth')}`
}

const fallbackMentors = [
  {
    id: 'python-programming',
    name: 'Virat Kohli',
    email: 'virat@uptoskills.local',
    avatarUrl: '/celebrities/virat-kohli.jpg',
    expertise: 'Performance & Growth Mentor',
    courseCategory: 'Personal Development',
  },
  {
    id: 'leadership',
    name: 'MS Dhoni',
    email: 'dhoni@uptoskills.local',
    avatarUrl: '/celebrities/ms-dhoni.jpg',
    expertise: 'Leadership & Decision-Making Mentor',
    courseCategory: 'Leadership & Management',
  },
  {
    id: 'professional-growth',
    name: 'Sachin Tendulkar',
    email: 'sachin@uptoskills.local',
    avatarUrl: '/celebrities/sachin-tendulkar.jpg',
    expertise: 'Mastery & Excellence Mentor',
    courseCategory: 'Professional Growth',
  },
  {
    id: 'communication',
    name: 'Shah Rukh Khan',
    email: 'srk@uptoskills.local',
    avatarUrl: '/celebrities/shah-rukh-khan.jpg',
    expertise: 'Communication & Personal Branding Mentor',
    courseCategory: 'Communication & Career Growth',
  },
  {
    id: 'team-leadership',
    name: 'Rohit Sharma',
    email: 'rohit@uptoskills.local',
    avatarUrl: '/celebrities/rohit-sharma.jpg',
    expertise: 'Team Building & Strategic Leadership Mentor',
    courseCategory: 'Team Leadership',
  },
  {
    id: 'creativity',
    name: 'Ranveer Singh',
    email: 'ranveer@uptoskills.local',
    avatarUrl: '/celebrities/ranveer-singh.jpg',
    expertise: 'Creativity & Innovation Mentor',
    courseCategory: 'Creativity & Innovation',
  },
  {
    id: 'skill-excellence',
    name: 'Allu Arjun',
    email: 'allu@uptoskills.local',
    avatarUrl: '/celebrities/allu-arjun.jpg',
    expertise: 'Dedication & Skill Development Mentor',
    courseCategory: 'Skill Development',
  },
  {
    id: 'growth-mindset',
    name: 'Alia Bhatt',
    email: 'alia@uptoskills.local',
    avatarUrl: '/celebrities/alia-bhatt.jpg',
    expertise: 'Growth Mindset & Adaptability Mentor',
    courseCategory: 'Personal Development',
  },
  {
    id: 'resilience',
    name: 'Deepika Padukone',
    email: 'deepika@uptoskills.local',
    avatarUrl: '/celebrities/deepika-padukone.jpg',
    expertise: 'Confidence & Resilience Mentor',
    courseCategory: 'Personal Development',
  },
]

const mentorProfiles = {
  'virat kohli': {
    role: 'Performance & Growth Mentor',
    quote: 'Virat Kohli inspires learners to develop discipline, consistency, confidence, and leadership skills required to achieve excellence in their careers.',
    longBio: 'Virat Kohli is known for his relentless dedication, strong work ethic, and high-performance mindset. As an AI Mentor, Virat inspires learners to develop discipline, consistency, confidence, and leadership skills required to achieve excellence in their careers. His mentorship focuses on goal setting, productivity, resilience, and maintaining peak performance under pressure.',
    expertise: ['Leadership', 'Discipline', 'Performance Mindset'],
    category: 'Personal Development',
    courses: '12 Courses',
    learners: '150K+ Learners',
  },
  'ms dhoni': {
    role: 'Leadership & Decision-Making Mentor',
    quote: 'MS Dhoni helps learners develop strategic thinking, problem-solving skills, teamwork, and effective leadership qualities.',
    longBio: 'MS Dhoni is celebrated for his calm leadership and ability to make smart decisions under pressure. As an AI Mentor, he helps learners develop strategic thinking, problem-solving skills, teamwork, and effective leadership qualities. His sessions focus on staying composed, making informed decisions, and leading teams toward success.',
    expertise: ['Decision Making', 'Leadership', 'Strategic Thinking'],
    category: 'Leadership & Management',
    courses: '15 Courses',
    learners: '200K+ Learners',
  },
  'sachin tendulkar': {
    role: 'Mastery & Excellence Mentor',
    quote: 'Sachin Tendulkar encourages learners to embrace continuous learning, long-term focus, and strong professional foundations.',
    longBio: 'Widely regarded as one of the greatest cricketers of all time, Sachin Tendulkar symbolizes dedication, consistency, and excellence. As an AI Mentor, he encourages learners to embrace continuous learning, maintain focus on long-term goals, and build strong professional foundations. His mentorship promotes perseverance and lifelong growth.',
    expertise: ['Consistency', 'Excellence', 'Professional Growth'],
    category: 'Professional Growth',
    courses: '10 Courses',
    learners: '180K+ Learners',
  },
  'shah rukh khan': {
    role: 'Communication & Personal Branding Mentor',
    quote: 'Shah Rukh Khan guides learners on storytelling, public speaking, personal branding, networking, and professional presence.',
    longBio: 'Known as the "King of Bollywood," Shah Rukh Khan represents confidence, perseverance, and exceptional communication skills. As an AI Mentor, he guides learners on storytelling, public speaking, personal branding, networking, and building a strong professional presence. His mentorship encourages creativity, ambition, and continuous self-improvement.',
    expertise: ['Communication', 'Confidence', 'Personal Branding'],
    category: 'Communication & Career Growth',
    courses: '14 Courses',
    learners: '220K+ Learners',
  },
  'rohit sharma': {
    role: 'Team Building & Strategic Leadership Mentor',
    quote: 'Rohit Sharma helps learners understand how to manage challenges while maintaining productivity, balance, and team performance.',
    longBio: 'Rohit Sharma is known for his strategic leadership and ability to inspire team performance. As an AI Mentor, he focuses on collaboration, adaptability, effective communication, and achieving results through teamwork. His guidance helps learners understand how to manage challenges while maintaining productivity and balance.',
    expertise: ['Team Building', 'Adaptability', 'Performance Management'],
    category: 'Team Leadership',
    courses: '11 Courses',
    learners: '130K+ Learners',
  },
  'ranveer singh': {
    role: 'Creativity & Innovation Mentor',
    quote: 'Ranveer Singh inspires learners to think differently, embrace innovation, and confidently express their ideas.',
    longBio: 'Ranveer Singh is recognized for his energy, creativity, and unique approach to personal expression. As an AI Mentor, he inspires learners to think differently, embrace innovation, and confidently express their ideas. His mentorship emphasizes creativity, confidence, entrepreneurship, and building a distinctive professional identity.',
    expertise: ['Creativity', 'Innovation', 'Self-Expression'],
    category: 'Creativity & Innovation',
    courses: '13 Courses',
    learners: '160K+ Learners',
  },
  'allu arjun': {
    role: 'Dedication & Skill Development Mentor',
    quote: 'Allu Arjun motivates learners to focus on skill development, discipline, and continuous improvement.',
    longBio: 'Allu Arjun is admired for his commitment to mastering his craft and consistently delivering outstanding performances. As an AI Mentor, he motivates learners to focus on skill development, discipline, and continuous improvement. His guidance helps learners understand the importance of dedication and persistence in achieving success.',
    expertise: ['Dedication', 'Skill Development', 'Excellence'],
    category: 'Skill Development',
    courses: '9 Courses',
    learners: '120K+ Learners',
  },
  'alia bhatt': {
    role: 'Growth Mindset & Adaptability Mentor',
    quote: 'Alia Bhatt encourages learners to embrace new opportunities, develop versatile skills, and stay adaptable in a changing world.',
    longBio: 'Alia Bhatt represents continuous learning, adaptability, and professional growth. As an AI Mentor, she encourages learners to embrace new opportunities, develop versatile skills, and stay adaptable in a rapidly changing world. Her mentorship focuses on confidence building, personal development, and lifelong learning.',
    expertise: ['Growth Mindset', 'Learning Agility', 'Adaptability'],
    category: 'Personal Development',
    courses: '8 Courses',
    learners: '110K+ Learners',
  },
  'deepika padukone': {
    role: 'Confidence & Resilience Mentor',
    quote: 'Deepika Padukone helps learners build confidence, emotional resilience, leadership qualities, and a positive growth mindset.',
    longBio: 'Deepika Padukone is known for her professionalism, resilience, and strong commitment to excellence. As an AI Mentor, she helps learners build confidence, emotional resilience, leadership qualities, and a positive growth mindset. Her mentorship inspires learners to overcome challenges and achieve their personal and professional goals.',
    expertise: ['Confidence', 'Resilience', 'Personal Development'],
    category: 'Personal Development',
    courses: '10 Courses',
    learners: '145K+ Learners',
  },
}

function MentorCard({ mentor }) {
  const profile = profileForMentor(mentor)
  const expertise = listValue(profile.expertise).length
    ? listValue(profile.expertise)
    : ['Guided Learning', 'Career Growth']
  const mentorName = textValue(mentor.name) || 'Mentor'
  const categoryUrl = relatedCoursesUrl(mentor)
  const mentorUrl = `/mentors?mentor=${mentorSlug(mentorName)}`

  return (
    <article className="enterprise-glow-card platform-card flex h-full min-h-[36rem] flex-col overflow-hidden p-0">
      <Link to={mentorUrl} className="group relative block aspect-[16/10] overflow-hidden bg-[var(--bg-subtle)]">
        <img
          src={mentor.avatarUrl || '/favicon.svg'}
          alt={mentorName}
          className="h-full w-full object-contain object-center p-3 transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/20 bg-slate-950/72 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {mentor.isLiveInstructor ? <BadgeCheck size={13} className="text-cyan-200" /> : <Star size={13} fill="currentColor" className="text-amber-300" />}
          {mentor.isLiveInstructor ? 'Live Instructor' : 'Featured Mentor'}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <p className="text-2xl font-black text-[var(--text-primary)]">{mentorName}</p>
          <p className="mt-1 text-sm font-bold text-[var(--accent-primary)]">{textValue(profile.role)}</p>
        </div>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">"{textValue(profile.quote)}"</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {expertise.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
              <CheckCircle2 size={12} className="text-[var(--accent-primary)]" />
              {textValue(item)}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Category</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{textValue(profile.category)}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <span>
              <strong className="block text-[var(--text-primary)]">4.9</strong>
              <span className="text-xs text-[var(--text-secondary)]">Rating</span>
            </span>
            <span>
              <strong className="block text-[var(--text-primary)]">{textValue(profile.courses)}</strong>
              <span className="text-xs text-[var(--text-secondary)]">Programs</span>
            </span>
            <span>
              <strong className="block text-[var(--text-primary)]">{textValue(profile.learners)}</strong>
              <span className="text-xs text-[var(--text-secondary)]">Reach</span>
            </span>
          </div>
        </div>

        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
          <Link to={mentorUrl} className="action-link min-h-11 w-full rounded-xl px-4 py-2.5">
            View Mentor
          </Link>
          <Link to={categoryUrl} className="btn-primary inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
            Explore <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function PricingPage() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [checkoutState, setCheckoutState] = useState({ loading: false, message: '' })
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      summary: 'Preview the catalog, explore mentors, and begin learning with free resources.',
      action: 'Start Free',
      route: '/register',
      tone: 'from-cyan-500 to-teal-600',
      features: ['Free course previews', 'Community access', 'Basic learner profile', 'Progress-ready dashboard'],
    },
    {
      name: 'Pro Learner',
      price: 'Rs. 799/mo',
      summary: 'For learners who want full course access, assessments, and certificates.',
      action: 'Explore Courses',
      route: '/explore',
      highlighted: true,
      tone: 'from-orange-500 to-amber-500',
      features: ['Premium course library', 'Assessments and retakes', 'Verified certificates', 'Priority learning support'],
    },
    {
      name: 'Institution',
      price: 'Custom',
      summary: 'For colleges, training teams, and learning partners that need managed rollouts.',
      action: 'Contact Team',
      route: '/contact',
      tone: 'from-emerald-500 to-teal-600',
      features: ['Learner cohorts', 'Admin reporting', 'Instructor workflows', 'Dedicated onboarding'],
    },
  ]

  const comparisons = [
    ['Course previews', 'Included', 'Included', 'Included'],
    ['Premium lessons', 'Limited', 'Unlimited', 'Custom catalog'],
    ['Assessments', 'Practice only', 'Full access', 'Managed cohorts'],
    ['Certificates', 'No', 'Verified', 'Verified at scale'],
    ['Support', 'Community', 'Priority', 'Dedicated'],
  ]

  async function choosePlan(plan) {
    if (plan.name !== 'Pro Learner') { navigate(plan.route); return }
    if (!user) { navigate('/login'); return }
    try {
      setCheckoutState({ loading: true, message: '' })
      const response = await createCheckout({ productRef: 'PRO_MONTHLY' }, window.crypto.randomUUID())
      if (response.data?.checkoutUrl) window.location.assign(response.data.checkoutUrl)
      else setCheckoutState({ loading: false, message: 'Secure checkout could not be opened.' })
    } catch (error) { setCheckoutState({ loading: false, message: error?.response?.data?.message || 'Secure checkout is temporarily unavailable.' }) }
  }

  return (
    <Shell eyebrow="Pricing" title="Simple Plans for Every Learning Goal" description="Start free, upgrade when you need structured progress, or bring UptoSkills to an institution with managed learning operations.">
      <div className="space-y-8">
        {checkoutState.message ? <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-700 dark:text-amber-200">{checkoutState.message}</p> : null}
        <section className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`glass-card relative flex h-full flex-col rounded-xl p-6 shadow-soft sm:p-7 ${plan.highlighted ? 'border-orange-400/60 ring-2 ring-orange-400/20' : ''}`}
            >
              {plan.highlighted ? (
                <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">
                  Popular
                </span>
              ) : null}
              <div className={`grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br ${plan.tone} text-white shadow-soft`}>
                {plan.name === 'Starter' ? <Sparkles size={22} /> : plan.name === 'Pro Learner' ? <Rocket size={22} /> : <Users size={22} />}
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950 dark:text-white">{plan.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.summary}</p>
              <p className="mt-6 text-3xl font-semibold text-slate-950 dark:text-white">{plan.price}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={17} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-7 w-full"
                variant={plan.highlighted ? 'primary' : 'secondary'}
                onClick={() => choosePlan(plan)}
                loading={checkoutState.loading && plan.name === 'Pro Learner'}
                aria-label={`${plan.action} with ${plan.name}`}
              >
                {plan.action}
              </Button>
            </article>
          ))}
        </section>

        <section className="glass-card overflow-hidden rounded-xl p-0 shadow-soft">
          <div className="border-b border-[var(--border-color)] p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Compare plans</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Choose by access, proof, and support.</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-black/[0.025] text-slate-700 dark:bg-white/[0.04] dark:text-slate-200">
                <tr>
                  {['Feature', 'Starter', 'Pro Learner', 'Institution'].map((heading) => (
                    <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-slate-600 dark:text-slate-300">
                {comparisons.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td key={`${row[0]}-${index}`} className={`px-6 py-4 ${index === 0 ? 'font-semibold text-slate-950 dark:text-white' : ''}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border-color)] bg-slate-950 p-6 text-white shadow-glow sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Need help deciding?</p>
              <h2 className="mt-3 text-2xl font-semibold">Talk to support or browse the live course catalog.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Every pricing action now opens a working route, so learners can register, compare courses, or contact the team without hitting a dead button.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={() => navigate('/contact')} className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                Contact Support
              </Button>
              <Button onClick={() => navigate('/explore')}>Browse Courses</Button>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  )
}

export function PolicyPage({ type = 'privacy' }) {
  const terms = type === 'terms'
  const sections = terms
    ? [
      ['Account responsibility', 'Use accurate account information, protect your credentials, and follow role-based access rules for learner, instructor, and admin areas.'],
      ['Learning access', 'Course access, assessments, certificates, and premium features are provided according to the plan, enrollment, or institution agreement selected.'],
      ['Platform conduct', 'Respect instructors, learners, content ownership, and community spaces. Misuse can limit access or require administrative review.'],
    ]
    : [
      ['Data we protect', 'Profile details, authentication data, course progress, assessment records, certificates, settings, and support conversations are treated as private account data.'],
      ['How it is used', 'Data powers secure login, protected dashboards, course recommendations, certificate verification, learner support, and platform reporting.'],
      ['Security controls', 'Role-based access, JWT-backed sessions, restricted API flows, and environment-managed secrets support responsible platform operation.'],
    ]

  return (
    <Shell eyebrow={terms ? 'Terms' : 'Privacy'} title={terms ? 'Clear Terms for Learning Access' : 'Privacy Built Around Learner Trust'} description={terms ? 'Understand the expectations that keep UptoSkills fair, secure, and useful for every role.' : 'A polished privacy summary for the account, progress, certificate, and support data handled by UptoSkills.'}>
      <div className="space-y-8">
        <section className="grid gap-5 md:grid-cols-3">
          {sections.map(([title, text], index) => (
            <FeatureTile
              key={title}
              icon={index === 0 ? LockKeyhole : index === 1 ? ShieldCheck : FileQuestion}
              title={title}
              text={text}
              tone={index === 0 ? 'from-cyan-500 to-teal-600' : index === 1 ? 'from-emerald-500 to-teal-600' : 'from-orange-500 to-amber-500'}
            />
          ))}
        </section>
        <section className="rounded-xl border border-[var(--border-color)] bg-white/75 p-6 shadow-soft dark:bg-slate-950/45 sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Questions about this policy?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Contact the UptoSkills support team for questions about account data, billing records, learning history, or access terms.
          </p>
        </section>
      </div>
    </Shell>
  )

  return (
    <Shell eyebrow={terms ? 'Terms' : 'Privacy'} title={terms ? 'Terms and Conditions' : 'Privacy Policy'} description="Production policy pages for platform trust, compliance, and customer readiness.">
      <div className="glass-card space-y-4 p-8 text-slate-600 shadow-soft dark:text-slate-300">
        <p>We protect account, profile, learning progress, settings, and contact information using role-based API access.</p>
        <p>Use environment variables for secrets, JWT signing keys, PostgreSQL credentials, and production origins.</p>
        <p>Review final legal language against live billing, data retention, and institution contract terms before public launch.</p>
      </div>
    </Shell>
  )
}

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', reason: 'General enquiry', message: '' })
  const [status, setStatus] = useState({ loading: false, type: '', message: '' })
  async function submit(event) {
    event.preventDefault()
    try {
      setStatus({ loading: true, type: '', message: '' })
      await submitContactRequest({ name: form.name.trim(), email: form.email.trim(), message: `[${form.reason}] ${form.message.trim()}` })
      setStatus({ loading: false, type: 'success', message: 'Thanks—your message has been received.' })
      setForm((current) => ({ ...current, message: '' }))
    } catch (error) { setStatus({ loading: false, type: 'error', message: error?.response?.data?.message || 'Could not send your message. Please retry.' }) }
  }
  return <Shell eyebrow="Contact" title="Talk to the UptoSkills Team" description="Contact us about partnerships, enterprise learning, courses, accounts, or general enquiries.">
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <aside className="glass-card rounded-xl p-6 shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Mail /></span><h2 className="mt-5 text-2xl font-bold text-[var(--text-primary)]">Contact information</h2><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">For account troubleshooting, use the dedicated Support page. This form is for business and general enquiries.</p><a className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-[var(--accent-primary)]" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a><Button className="mt-5 w-full" variant="secondary" onClick={() => window.location.assign('/support')}>Visit support</Button></aside>
      <form onSubmit={submit} className="glass-card grid gap-5 rounded-xl p-6 shadow-soft">
        {status.message ? <p role="status" className={`rounded-xl border p-4 text-sm font-semibold ${status.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'}`}>{status.message}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2"><label className="admin-label">Name<input className="admin-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} autoComplete="name" /></label><label className="admin-label">Email<input className="admin-input" type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" /></label></div>
        <label className="admin-label">Reason for contacting<select className="admin-input" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}><option>General enquiry</option><option>Enterprise training</option><option>Partnership</option><option>Course information</option><option>Media enquiry</option></select></label>
        <label className="admin-label">Message<textarea className="admin-input min-h-40 resize-y" required minLength={10} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} /></label>
        <Button type="submit" loading={status.loading} disabled={status.loading}><Send size={16} /> Send message</Button>
      </form>
    </div>
  </Shell>
}

export function CommunityTopicPage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState({ topic: null, posts: [], pagination: null })
  const [state, setState] = useState({ loading: true, error: '', notice: '' })
  const [message, setMessage] = useState('')
  const [reportTarget, setReportTarget] = useState('')
  const [reportReason, setReportReason] = useState('Spam or misleading content')
  const [replyTarget, setReplyTarget] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  async function load(page = 1) {
    try { setState((current) => ({ ...current, loading: true, error: '' })); const response = await fetchCommunityPosts(topicId, { page, pageSize: 20 }); setData({ topic: response.data.topic, posts: response.data.posts || [], pagination: response.data.pagination }); setState((current) => ({ ...current, loading: false })) }
    catch (error) { setState({ loading: false, error: error?.response?.status === 401 ? 'Sign in to participate in community discussions.' : error?.response?.data?.message || 'Could not load this discussion.', notice: '' }) }
  }
  // load is intentionally keyed to the route topic identifier.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [topicId])
  async function publish(event, parentId = null) {
    event?.preventDefault()
    if (!message.trim()) return
    try { await createCommunityPost(topicId, { body: message.trim(), parentId }); setMessage(''); setState((current) => ({ ...current, notice: 'Your post was published.' })); await load(data.pagination?.page || 1) }
    catch (error) { setState((current) => ({ ...current, error: error?.response?.data?.message || 'Could not publish your post.' })) }
  }
  async function submitReport(event) {
    event.preventDefault()
    try { await reportCommunityPost(reportTarget, { reason: reportReason }); setReportTarget(''); setState((current) => ({ ...current, notice: 'Report submitted for moderation.' })) } catch (error) { setState((current) => ({ ...current, error: error?.response?.data?.message || 'Could not submit the report.' })) }
  }
  async function submitReply(event, parentId) {
    event.preventDefault()
    if (!replyMessage.trim()) return
    try { await createCommunityPost(topicId, { body: replyMessage.trim(), parentId }); setReplyMessage(''); setReplyTarget(''); await load(data.pagination?.page || 1) } catch (error) { setState((current) => ({ ...current, error: error?.response?.data?.message || 'Could not publish the reply.' })) }
  }
  const title = data.topic?.title || topicId?.replaceAll('-', ' ') || 'Community topic'
  return <Shell eyebrow="Community discussion" title={title} description={data.topic?.description || 'Ask questions, exchange useful answers, and keep discussion respectful and focused.'} action={<Button variant="secondary" onClick={() => navigate('/community')}>All topics</Button>}>
    <div className="space-y-6">
      {state.notice ? <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-700 dark:text-emerald-200">{state.notice}</p> : null}
      {state.error ? <div className="glass-card p-6 text-center"><p className="text-[var(--text-secondary)]">{state.error}</p>{state.error.startsWith('Sign in') ? <Button className="mt-4" onClick={() => navigate('/login')}>Sign in</Button> : <Button className="mt-4" onClick={() => load()}>Retry</Button>}</div> : null}
      {!state.error ? <form onSubmit={publish} className="glass-card rounded-xl p-5 shadow-soft"><label className="admin-label">Add to the discussion<textarea className="admin-input mt-2 min-h-28 resize-y" value={message} onChange={(event) => setMessage(event.target.value)} minLength={2} maxLength={5000} placeholder="Share a question, answer, or useful resource" /></label><div className="mt-3 flex justify-end"><Button type="submit" disabled={!message.trim()}><Send size={16} /> Publish</Button></div></form> : null}
      {state.loading ? [0, 1, 2].map((item) => <span key={item} className="skeleton block h-36 rounded-xl" />) : null}
      {!state.loading && !state.error ? <section aria-label="Discussion posts" className="space-y-4">{data.posts.map((post) => <article key={post.id} className="glass-card rounded-xl p-5 shadow-soft"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-[var(--text-primary)]">{post.author?.name || 'Community member'}</h2><p className="text-xs text-[var(--text-muted)]">{new Date(post.createdAt).toLocaleString()}</p></div><div className="flex gap-2"><Button variant="secondary" className="min-h-11" onClick={() => setReplyTarget(replyTarget === post.id ? '' : post.id)}>Reply</Button><Button variant="secondary" className="min-h-11" onClick={() => setReportTarget(post.id)}>Report</Button></div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{post.body}</p>{replyTarget === post.id ? <form onSubmit={(event) => submitReply(event, post.id)} className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor={`reply-${post.id}`}>Write a reply</label><input id={`reply-${post.id}`} autoFocus className="admin-input flex-1" value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} minLength={2} maxLength={5000} placeholder="Write a helpful reply" /><Button type="submit" disabled={!replyMessage.trim()}>Post reply</Button></form> : null}{post.replies?.length ? <div className="mt-5 space-y-3 border-l-2 border-[var(--border-color)] pl-4">{post.replies.map((reply) => <div key={reply.id} className="rounded-xl bg-[var(--bg-subtle)] p-4"><p className="text-sm font-bold text-[var(--text-primary)]">{reply.author?.name || 'Community member'}</p><p className="mt-2 text-sm text-[var(--text-secondary)]">{reply.body}</p></div>)}</div> : null}</article>)}{!data.posts.length ? <div className="glass-card p-8 text-center"><MessageSquare className="mx-auto text-[var(--accent-primary)]" /><h2 className="mt-3 text-xl font-bold text-[var(--text-primary)]">Start the conversation</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Be the first person to add a useful post to this topic.</p></div> : null}</section> : null}
      {reportTarget ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" onKeyDown={(event) => { if (event.key === 'Escape') setReportTarget('') }}><form onSubmit={submitReport} className="glass-card w-full max-w-md rounded-xl p-6 shadow-glow"><h2 id="report-dialog-title" className="text-2xl font-bold text-[var(--text-primary)]">Report community post</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Choose the reason that best describes the concern.</p><label className="admin-label mt-5">Report reason<select autoFocus className="admin-input" value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option>Spam or misleading content</option><option>Harassment or abusive language</option><option>Unsafe or illegal content</option><option>Personal information</option><option>Off-topic content</option></select></label><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setReportTarget('')}>Cancel</Button><Button type="submit" variant="danger">Submit report</Button></div></form></div> : null}
      {data.pagination?.total > data.pagination?.pageSize ? <nav className="flex justify-center gap-3" aria-label="Discussion pages"><Button variant="secondary" disabled={data.pagination.page <= 1} onClick={() => load(data.pagination.page - 1)}>Previous page</Button><Button variant="secondary" disabled={data.pagination.page * data.pagination.pageSize >= data.pagination.total} onClick={() => load(data.pagination.page + 1)}>Next page</Button></nav> : null}
    </div>
  </Shell>
}

export function LearningPathPage() {
  const navigate = useNavigate()
  const { courses, loading } = useLiveCourses()
  const [searchParams] = useSearchParams()
  const [selectedPath, setSelectedPath] = useState(searchParams.get('path') || 'Web Development')
  const paths = [
    {
      name: 'Web Development',
      icon: Rocket,
      description: 'Learn HTML, CSS, JavaScript, React, and the tools used to build modern websites.',
      stages: ['Basics: HTML and CSS', 'Intermediate: JavaScript and responsive design', 'Advanced: React and modern frontend patterns', 'Project: Build and deploy a website'],
      keywords: ['web development', 'frontend', 'frontend development', 'html', 'css', 'javascript', 'react', 'next', 'ui', 'ux'],
      priorityKeywords: ['html', 'css', 'javascript', 'react'],
    },
    {
      name: 'Technical',
      icon: BarChart3,
      description: 'Strengthen programming, cloud, database, and problem-solving skills for technical roles.',
      stages: ['Basics: Programming fundamentals', 'Intermediate: Data structures and databases', 'Advanced: Cloud, backend, and deployment', 'Project: Solve a technical case study'],
      keywords: ['technical', 'programming', 'software', 'engineering', 'database', 'cloud', 'devops', 'security', 'api', 'backend'],
      priorityKeywords: ['programming', 'database', 'cloud', 'backend'],
    },
    {
      name: 'Python to AI/ML',
      icon: Sparkles,
      description: 'Start with Python, then move into AI/ML, automation, data science, and real applied projects.',
      stages: ['Basics: Python fundamentals', 'Intermediate: Python for data handling', 'Advanced: AI/ML concepts and model training', 'Project: Build a practical AI solution'],
      keywords: ['python', 'python programming', 'programming', 'ai', 'artificial intelligence', 'machine learning', 'ml', 'data science', 'automation'],
      priorityKeywords: ['python', 'python programming', 'ai', 'artificial intelligence', 'machine learning', 'ml'],
    },
    {
      name: 'Career Growth',
      icon: BriefcaseBusiness,
      description: 'Develop communication, planning, and workplace skills for your next career step.',
      stages: ['Basics: Career goal setting', 'Intermediate: Communication and teamwork', 'Advanced: Leadership and planning', 'Project: Build a career action plan'],
      keywords: ['career', 'leadership', 'communication', 'professional', 'business', 'management', 'productivity'],
      priorityKeywords: ['career', 'communication', 'leadership', 'planning'],
    },
  ]
  const activePath = paths.find((path) => path.name === selectedPath) || paths[0]
  const recommendedCourses = useMemo(() => {
    if (!courses.length) return []
    const keywords = (activePath.keywords || []).map((keyword) => keyword.toLowerCase())
    const priorityKeywords = (activePath.priorityKeywords || []).map((keyword) => keyword.toLowerCase())
    const scored = courses.map((course) => {
      const haystack = [
        course.title,
        course.description,
        course.category,
        course.level,
        ...(course.tags || []),
      ].filter(Boolean).join(' ').toLowerCase()
      const exactMatches = keywords.reduce((count, keyword) => count + (haystack.includes(keyword) ? 1 : 0), 0)
      const priorityScore = priorityKeywords.reduce((count, keyword, index) => (
        count + (haystack.includes(keyword) ? (priorityKeywords.length - index) : 0)
      ), 0)
      const levelScore = 4 - getLevelRank(course.level)
      return { course, score: exactMatches + priorityScore + levelScore }
    })
    const matching = scored.filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).map(({ course }) => course)
    return matching.length ? matching.slice(0, 6) : courses.slice(0, 3)
  }, [activePath.keywords, activePath.priorityKeywords, courses])

  useEffect(() => {
    const path = searchParams.get('path')
    if (!path) return
    const normalized = path.replace(/[-_]+/g, ' ').trim().toLowerCase()
    const matched = paths.find((item) => item.name.toLowerCase() === normalized || item.name.replace(/\s+/g, ' ').toLowerCase() === normalized)
    if (matched) setSelectedPath(matched.name)
  }, [searchParams])

  return (
    <section className="space-y-6 pb-16">
      <div className="glass-card relative overflow-hidden rounded-2xl p-6 shadow-glow sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(6,182,212,0.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--accent-primary)]">Learning Path</p>
            <h1 className="mt-3 text-3xl font-black text-[var(--text-primary)] sm:text-4xl">A clear route from learning to achievement</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">Choose a goal, follow its milestones, and move through relevant courses in a sensible order.</p>
          </div>
          <Button onClick={() => navigate('/courses')}>Explore all courses <ArrowRight size={17} /></Button>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Choose your direction</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Select the path that best matches what you want to accomplish next. Each path opens courses related to that theme.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {paths.map((path) => {
            const Icon = path.icon
            const active = selectedPath === path.name
            return (
              <button
                key={path.name}
                type="button"
                onClick={() => setSelectedPath(path.name)}
                aria-pressed={active}
                className={`rounded-2xl border p-5 text-left transition ${active ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] shadow-glow' : 'border-[var(--border-color)] bg-[var(--bg-elevated)] hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/50 hover:shadow-soft'}`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--bg-elevated)] text-[var(--accent-primary)] shadow-sm"><Icon size={22} /></span>
                <span className="mt-4 block text-lg font-bold text-[var(--text-primary)]">{path.name}</span>
                <span className="mt-2 block text-sm leading-6 text-[var(--text-secondary)]">{path.description}</span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-primary)]">{active ? 'Selected path' : 'Choose this path'} {active ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}</span>
              </button>
            )
          })}
        </div>
      </div>

      <section className="glass-card rounded-2xl p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Your roadmap</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{activePath.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">Complete each milestone in order. Your course progress and certificates will provide evidence as you advance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-300"><Target size={17} /> {activePath.stages.length} milestones</span>
            <Button variant="secondary" onClick={() => navigate(`/courses?search=${encodeURIComponent(activePath.name)}`)}>View matching courses</Button>
          </div>
        </div>
        <ol className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {activePath.stages.map((stage, index) => (
            <li key={stage} className="relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-primary)] text-sm font-black text-white">{index + 1}</span>
              <p className="mt-4 font-bold text-[var(--text-primary)]">{stage}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                {[
                  'Begin with the core concepts and simple examples.',
                  'Build confidence with guided practice and applied exercises.',
                  'Tackle more complex ideas and real-world patterns.',
                  'Use everything you learned to complete a portfolio-ready project.',
                ][index]}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Recommended starting courses</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Begin with an available course and build momentum through your roadmap.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/courses')}>View course catalog</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {loading ? Array.from({ length: 3 }).map((_, index) => <span key={index} className="skeleton h-52 rounded-2xl" />) : recommendedCourses.length ? recommendedCourses.map((course, index) => (
            <article key={course.id || course.slug || index} className="glass-card flex flex-col rounded-2xl p-5 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><BookOpenCheck size={20} /></span>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Step {index + 1}</p>
              <h3 className="mt-2 line-clamp-2 text-lg font-bold text-[var(--text-primary)]">{course.title || 'Guided learning course'}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{course.description || 'Build practical knowledge with structured lessons and progress tracking.'}</p>
              <Button className="mt-5" variant="secondary" onClick={() => navigate(`/course/${course.id || course.slug}`)}>View course <ArrowRight size={16} /></Button>
            </article>
          )) : (
            <div className="glass-card rounded-2xl border-dashed p-7 text-center lg:col-span-3">
              <Trophy className="mx-auto text-[var(--accent-primary)]" size={30} />
              <p className="mt-3 font-bold text-[var(--text-primary)]">Courses are being prepared</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Open the catalog to see newly published learning options.</p>
              <Button className="mt-4" onClick={() => navigate('/courses')}>Browse catalog</Button>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}

export function LiveSessionsPage() {
  const user = useSelector((store) => store.auth.user)
  const isInstructor = String(user?.role || '').toLowerCase() === 'instructor'
  const [sessions, setSessions] = useState([])
  const [assignedCourses, setAssignedCourses] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [sessionForm, setSessionForm] = useState({ title: '', description: '', courseId: '', startsAt: '', endsAt: '', meetingUrl: '' })
  const [state, setState] = useState({ loading: true, error: '' })
  const [now] = useState(() => Date.now())
  async function load() {
    try {
      setState({ loading: true, error: '' })
      const response = await fetchLiveSessions()
      setSessions(response.data?.sessions || [])
      setState({ loading: false, error: '' })
    } catch (error) { setState({ loading: false, error: error?.response?.data?.message || 'Could not load live sessions.' }) }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); if (isInstructor) fetchInstructorCourses().then((response) => setAssignedCourses(response.data?.courses || [])).catch(() => setAssignedCourses([])) }, 0); return () => window.clearTimeout(timer) }, [isInstructor])
  async function scheduleSession(event) {
    event.preventDefault()
    try {
      await createLiveSession({ ...sessionForm, startsAt: new Date(sessionForm.startsAt).toISOString(), endsAt: new Date(sessionForm.endsAt).toISOString() })
      setSessionForm({ title: '', description: '', courseId: '', startsAt: '', endsAt: '', meetingUrl: '' })
      setShowCreate(false)
      await load()
    } catch (error) { setState({ loading: false, error: error?.response?.data?.message || 'Could not schedule the session.' }) }
  }
  const grouped = {
    ongoing: sessions.filter((item) => new Date(item.startsAt).getTime() <= now && new Date(item.endsAt).getTime() >= now),
    upcoming: sessions.filter((item) => new Date(item.startsAt).getTime() > now),
    completed: sessions.filter((item) => new Date(item.endsAt).getTime() < now && !item.recordingUrl),
    recorded: sessions.filter((item) => item.recordingUrl),
  }
  return <Shell eyebrow={isInstructor ? 'Instructor workspace' : 'Live learning'} title="Live Sessions" description={isInstructor ? 'Schedule classes for assigned courses and manage upcoming or recorded teaching sessions.' : 'Join scheduled classes, review completed sessions, and continue learning from available recordings.'} action={isInstructor ? <Button onClick={() => setShowCreate((value) => !value)}>Schedule session</Button> : null}>
    <div className="space-y-8">
      {isInstructor && showCreate ? <form onSubmit={scheduleSession} className="glass-card grid gap-4 rounded-xl p-6 shadow-soft sm:grid-cols-2"><h2 className="text-2xl font-bold text-[var(--text-primary)] sm:col-span-2">Schedule a live session</h2><label className="admin-label">Title<input className="admin-input" required value={sessionForm.title} onChange={(event) => setSessionForm((current) => ({ ...current, title: event.target.value }))} /></label><label className="admin-label">Course<select className="admin-input" value={sessionForm.courseId} onChange={(event) => setSessionForm((current) => ({ ...current, courseId: event.target.value }))}><option value="">Open session</option>{assignedCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="admin-label">Starts at<input className="admin-input" type="datetime-local" required value={sessionForm.startsAt} onChange={(event) => setSessionForm((current) => ({ ...current, startsAt: event.target.value }))} /></label><label className="admin-label">Ends at<input className="admin-input" type="datetime-local" required value={sessionForm.endsAt} onChange={(event) => setSessionForm((current) => ({ ...current, endsAt: event.target.value }))} /></label><label className="admin-label sm:col-span-2">Meeting URL<input className="admin-input" type="url" required value={sessionForm.meetingUrl} onChange={(event) => setSessionForm((current) => ({ ...current, meetingUrl: event.target.value }))} placeholder="https://" /></label><label className="admin-label sm:col-span-2">Description<textarea className="admin-input min-h-24 resize-y" value={sessionForm.description} onChange={(event) => setSessionForm((current) => ({ ...current, description: event.target.value }))} /></label><div className="flex gap-3 sm:col-span-2"><Button type="submit">Create session</Button><Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button></div></form> : null}
      <MetricStrip metrics={[{ value: grouped.ongoing.length, label: 'live now' }, { value: grouped.upcoming.length, label: 'upcoming' }, { value: grouped.recorded.length, label: 'recordings' }, { value: sessions.length, label: 'total sessions' }]} />
      {state.loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <span key={item} className="skeleton h-52 rounded-xl" />)}</div> : null}
      {state.error ? <div className="glass-card p-8 text-center"><AlertCircle className="mx-auto text-red-500" /><p className="mt-3 text-[var(--text-secondary)]">{state.error}</p><Button className="mt-4" onClick={load}><RefreshCw size={16} /> Retry</Button></div> : null}
      {!state.loading && !state.error && ['ongoing', 'upcoming', 'recorded', 'completed'].map((group) => grouped[group].length ? <section key={group}>
        <h2 className="mb-4 text-2xl font-bold capitalize text-[var(--text-primary)]">{group}</h2>
        <div className="grid gap-4 lg:grid-cols-2">{grouped[group].map((session) => <article key={session.id} className="glass-card rounded-xl p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">{session.recordingUrl ? <PlayCircle /> : <Video />}</span><span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold uppercase text-[var(--accent-primary)]">{group}</span></div>
          <h3 className="mt-5 text-xl font-bold text-[var(--text-primary)]">{session.title}</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{session.course?.title || 'Open learning session'} · {session.instructor?.name}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CalendarDays size={16} /> {new Date(session.startsAt).toLocaleString()}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Clock3 size={16} /> {Math.max(1, Math.round((new Date(session.endsAt) - new Date(session.startsAt)) / 60000))} minutes</p>
          {(group === 'ongoing' && session.meetingUrl) || session.recordingUrl ? <Button className="mt-5" onClick={() => window.open(session.recordingUrl || session.meetingUrl, '_blank', 'noopener,noreferrer')}>{session.recordingUrl ? 'Watch recording' : 'Join session'} <ArrowRight size={16} /></Button> : null}
        </article>)}</div>
      </section> : null)}
      {!state.loading && !state.error && !sessions.length ? <div className="glass-card p-10 text-center"><CalendarDays className="mx-auto text-[var(--accent-primary)]" size={34} /><h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">No sessions scheduled</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Sessions connected to your enrolled courses will appear here.</p></div> : null}
    </div>
  </Shell>
}

export function SavedCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  async function load() {
    try { setState({ loading: true, error: '' }); const response = await fetchSavedCourses(); setCourses(response.data?.savedCourses || []); setState({ loading: false, error: '' }) }
    catch (error) { setState({ loading: false, error: error?.response?.data?.message || 'Could not load saved courses.' }) }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [])
  async function remove(courseId) { await removeSavedCourseRequest(courseId); setCourses((items) => items.filter((item) => item.id !== courseId)) }
  return <Shell eyebrow="Saved learning" title="Saved Courses" description="Your persisted shortlist of courses to revisit and enroll in later." action={<Button onClick={() => navigate('/explore')}>Explore courses</Button>}>
    {state.loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <span key={item} className="skeleton h-64 rounded-xl" />)}</div> : null}
    {state.error ? <div className="glass-card p-8 text-center"><p className="text-[var(--text-secondary)]">{state.error}</p><Button className="mt-4" onClick={load}>Retry</Button></div> : null}
    {!state.loading && !state.error && courses.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <article key={course.id} className="glass-card flex flex-col rounded-xl p-5 shadow-soft">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Bookmark /></span><p className="mt-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{course.category} · {course.level}</p><h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{course.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{course.description}</p><div className="mt-auto flex gap-3 pt-5"><Button className="flex-1" onClick={() => navigate(`/course/${course.id}`)}>View course</Button><Button variant="secondary" aria-label={`Remove ${course.title} from saved courses`} onClick={() => remove(course.id)}>Remove</Button></div>
    </article>)}</div> : null}
    {!state.loading && !state.error && !courses.length ? <div className="glass-card p-10 text-center"><Bookmark className="mx-auto text-[var(--accent-primary)]" /><h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">No saved courses yet</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Use the wishlist control on a course to build your shortlist.</p><Button className="mt-5" onClick={() => navigate('/explore')}>Browse courses</Button></div> : null}
  </Shell>
}

export function LearnerReportsPage() {
  const [report, setReport] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })
  async function load() { try { setState({ loading: true, error: '' }); const response = await fetchLearnerReport(); setReport(response.data?.report); setState({ loading: false, error: '' }) } catch (error) { setState({ loading: false, error: error?.response?.data?.message || 'Could not load your learning report.' }) } }
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [])
  const summary = report?.summary || {}
  return <Shell eyebrow="Learning analytics" title="Your Learning Report" description="Track course completion, study time, assessment performance, and earned credentials.">
    {state.loading ? <div className="space-y-5"><span className="skeleton block h-28 rounded-xl" /><span className="skeleton block h-72 rounded-xl" /></div> : null}
    {state.error ? <div className="glass-card p-8 text-center"><p className="text-[var(--text-secondary)]">{state.error}</p><Button className="mt-4" onClick={load}>Retry</Button></div> : null}
    {!state.loading && !state.error && report ? <div className="space-y-8"><MetricStrip metrics={[{ value: summary.enrolled || 0, label: 'courses enrolled' }, { value: summary.completed || 0, label: 'courses completed' }, { value: `${Math.round((summary.watchedSeconds || 0) / 3600)}h`, label: 'time studied' }, { value: `${summary.assessmentAverage || 0}%`, label: 'assessment average' }]} /><section className="glass-card rounded-xl p-6"><h2 className="text-2xl font-bold text-[var(--text-primary)]">Course progress</h2><div className="mt-5 space-y-4">{report.courses?.map((item) => <div key={item.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4"><div className="flex justify-between gap-4"><p className="font-bold text-[var(--text-primary)]">{item.course.title}</p><span className="font-bold text-[var(--accent-primary)]">{item.completionPct}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border-color)]"><span className="block h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${Math.min(100, item.completionPct)}%` }} /></div></div>)}{!report.courses?.length ? <p className="text-sm text-[var(--text-secondary)]">Enroll in a course to begin building your report.</p> : null}</div></section></div> : null}
  </Shell>
}

export function PaymentHistoryPage() {
  const [payments, setPayments] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  async function load() { try { setState({ loading: true, error: '' }); const response = await fetchPaymentHistory(); setPayments(response.data?.payments || []); setState({ loading: false, error: '' }) } catch (error) { setState({ loading: false, error: error?.response?.data?.message || 'Could not load payment history.' }) } }
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [])
  return <Shell eyebrow="Billing" title="Payments and Receipts" description="Review secure checkout attempts, successful payments, receipt numbers, and refund progress.">
    {state.loading ? <span className="skeleton block h-64 rounded-xl" /> : null}{state.error ? <div className="glass-card p-8 text-center"><p className="text-[var(--text-secondary)]">{state.error}</p><Button className="mt-4" onClick={load}>Retry</Button></div> : null}{!state.loading && !state.error ? <div className="space-y-4">{payments.map((payment) => <article key={payment.id} className="glass-card grid gap-4 rounded-xl p-5 shadow-soft sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">{payment.productType}</p><h2 className="mt-2 text-lg font-bold text-[var(--text-primary)]">{payment.course?.title || payment.productRef || 'UptoSkills plan'}</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: payment.currency || 'INR' }).format(payment.amountCents / 100)} · {new Date(payment.createdAt).toLocaleString()}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Receipt: {payment.receiptNo || 'Issued after provider verification'}</p></div><span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-bold text-[var(--accent-primary)]">{payment.status.replaceAll('_', ' ')}</span></article>)}{!payments.length ? <div className="glass-card p-10 text-center"><CreditCard className="mx-auto text-[var(--accent-primary)]" /><h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">No payment history</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Secure checkout records and receipts will appear here.</p></div> : null}</div> : null}
  </Shell>
}

export function InstructorCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  async function load() { try { setState({ loading: true, error: '' }); const response = await fetchInstructorCourses(); setCourses(response.data?.courses || []); setState({ loading: false, error: '' }) } catch (error) { setState({ loading: false, error: error?.response?.data?.message || 'Could not load instructor courses.' }) } }
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [])
  return <Shell eyebrow="Instructor" title="Your Courses" description="Manage courses you created or courses with learners assigned to you." action={<Button onClick={() => navigate('/instructor')}>Instructor dashboard</Button>}>
    {state.loading ? <div className="grid gap-5 lg:grid-cols-2">{[0, 1].map((item) => <span key={item} className="skeleton h-56 rounded-xl" />)}</div> : null}
    {state.error ? <div className="glass-card p-8 text-center"><p className="text-[var(--text-secondary)]">{state.error}</p><Button className="mt-4" onClick={load}>Retry</Button></div> : null}
    {!state.loading && !state.error ? <div className="grid gap-5 lg:grid-cols-2">{courses.map((course) => <article key={course.id} className="glass-card rounded-xl p-6 shadow-soft"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">{course.category} · {course.level}</p><h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{course.title}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${course.isPublished ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>{course.isPublished ? 'Published' : 'Draft'}</span></div><div className="mt-5 grid grid-cols-3 gap-3 text-center"><NotificationMetric label="Learners" value={course._count?.enrollments || 0} /><NotificationMetric label="Lessons" value={course._count?.lessons || 0} /><NotificationMetric label="Submissions" value={course._count?.assessmentSubmissions || 0} /></div><div className="mt-5 flex gap-3"><Button onClick={() => navigate(`/course/${course.id}`)}>View course</Button><Button variant="secondary" onClick={() => navigate(`/course/${course.id}/assessments`)}>Assessments</Button></div></article>)}{!courses.length ? <div className="glass-card p-10 text-center lg:col-span-2"><BookOpenCheck className="mx-auto text-[var(--accent-primary)]" /><h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">No assigned courses</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Courses you create or are assigned to will appear here.</p></div> : null}</div> : null}
  </Shell>
}

export function StudentFeedbackPage() {
  return <SupportPage />
}

export function AdminUsersPage() {
  return <Shell eyebrow="Admin" title="User management" description="Admin-only user and role management surface."><CardGrid items={[{ icon: Users, title: 'Registered users', text: 'Users are stored in PostgreSQL.' }, { icon: ShieldCheck, title: 'Roles', text: 'Learner, instructor, and admin permissions are separated.' }, { icon: BarChart3, title: 'Activity', text: 'Login activity is stored for admin reporting.' }]} /></Shell>
}

const ADMIN_SETTINGS_DEFAULTS = {
  certificateAutoIssue: true,
  certificateVerification: true,
  emailOtp: true,
  emailNotifications: true,
  paymentReceipts: true,
  approvalRequired: false,
  courseReviewRequired: true,
  openEnrollment: true,
  maintenanceMode: false,
  language: 'English',
  timezone: 'Asia/Kolkata',
  certificatePrefix: 'UPTO',
}

export function AdminSettingsPage() {
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(() => {
    try {
      return { ...ADMIN_SETTINGS_DEFAULTS, ...JSON.parse(window.localStorage.getItem('uptoskills-admin-settings') || '{}') }
    } catch {
      return ADMIN_SETTINGS_DEFAULTS
    }
  })
  useEffect(() => {
    let mounted = true
    fetchPlatformSettings().then((response) => {
      if (mounted) setSettings((current) => ({ ...current, ...(response.data?.settings || {}) }))
    }).catch(() => {
      if (mounted) setNotice('Could not load server settings. Current defaults are shown.')
    })
    return () => { mounted = false }
  }, [])
  const update = (key, value) => {
    setNotice('')
    setSettings((current) => ({ ...current, [key]: value ?? !current[key] }))
  }
  const saveSettings = async () => {
    try {
      setSaving(true)
      await savePlatformSettings(settings)
      window.localStorage.setItem('uptoskills-admin-settings', JSON.stringify(settings))
      setNotice('Platform settings saved securely and recorded in the activity log.')
    } catch (error) {
      setNotice(error?.response?.data?.message || 'Could not save platform settings.')
    } finally { setSaving(false) }
  }
  const resetSettings = () => {
    setSettings(ADMIN_SETTINGS_DEFAULTS)
    window.localStorage.removeItem('uptoskills-admin-settings')
    setNotice('Admin settings reset to recommended defaults.')
  }

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader
        eyebrow="Admin"
        title="Platform settings"
        description="Configure certificates, notifications, access rules, and global LMS preferences for the UptoSkills admin panel."
        actions={<><Button variant="secondary" onClick={resetSettings}>Reset</Button><Button onClick={saveSettings} loading={saving} disabled={saving}>Save Settings</Button></>}
      />
      <AdminNotice type="success">{notice}</AdminNotice>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm font-semibold uppercase tracking-[0.24em]">Access and security</p>
          <div className="mt-5 grid gap-4">
            <SettingsToggle checked={settings.emailOtp} onChange={() => update('emailOtp')} title="Email OTP delivery" text="Send password reset and login OTP codes to registered email addresses." />
            <SettingsToggle checked={settings.approvalRequired} onChange={() => update('approvalRequired')} title="Require manual approvals" text="Hold new instructor or intern accounts for admin review before access is granted." />
            <SettingsToggle checked={settings.openEnrollment} onChange={() => update('openEnrollment')} title="Open learner enrollment" text="Allow eligible learners to enroll in published courses from the catalogue." />
            <SettingsToggle checked={settings.maintenanceMode} onChange={() => update('maintenanceMode')} title="Maintenance mode" text="Temporarily pause learner access while admins perform operational updates." />
          </div>
        </div>

        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm font-semibold uppercase tracking-[0.24em]">Course and certificates</p>
          <div className="mt-5 grid gap-4">
            <SettingsToggle checked={settings.courseReviewRequired} onChange={() => update('courseReviewRequired')} title="Publishing review required" text="Keep newly created courses in review until an admin confirms catalogue quality." />
            <SettingsToggle checked={settings.certificateAutoIssue} onChange={() => update('certificateAutoIssue')} title="Auto-issue certificates" text="Allow certificates to be generated when learners complete required coursework and assessments." />
            <SettingsToggle checked={settings.certificateVerification} onChange={() => update('certificateVerification')} title="Public certificate verification" text="Allow certificate identifiers to be checked from shared credential links." />
            <label className="admin-label">Certificate number prefix<input value={settings.certificatePrefix} onChange={(event) => update('certificatePrefix', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} className="admin-input" placeholder="UPTO" /></label>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm font-semibold uppercase tracking-[0.24em]">Billing and communication</p>
          <div className="mt-5 grid gap-4">
            <SettingsToggle checked={settings.paymentReceipts} onChange={() => update('paymentReceipts')} title="Payment receipts" text="Prepare receipt notifications after successful paid-course transactions." />
            <SettingsToggle checked={settings.emailNotifications} onChange={() => update('emailNotifications')} title="Operational email notifications" text="Receive course, learner, assignment, and platform activity summaries." />
          </div>
        </div>
        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm font-semibold uppercase tracking-[0.24em]">Regional preferences</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="admin-label">Language<select value={settings.language} onChange={(event) => update('language', event.target.value)} className="admin-input"><option>English</option><option>Hindi</option></select></label>
            <label className="admin-label">Timezone<select value={settings.timezone} onChange={(event) => update('timezone', event.target.value)} className="admin-input"><option value="Asia/Kolkata">India Standard Time</option><option value="UTC">UTC</option><option value="Asia/Dubai">Gulf Standard Time</option></select></label>
          </div>
          <p className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4 text-xs leading-5 text-[var(--text-secondary)]">These are admin workspace preferences. Backend-enforced policy changes continue to use the existing API and permission contracts.</p>
        </div>
      </div>
    </section>
  )
}

function SettingsToggle({ title, text, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} aria-pressed={checked} className="theme-subcard flex items-center justify-between gap-4 rounded-lg p-4 text-left transition hover:border-cyan-400/50">
      <span>
        <span className="block font-semibold text-[var(--text-primary)]">{title}</span>
        <span className="mt-1 block text-sm text-[var(--text-secondary)]">{text}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-cyan-500' : 'bg-[var(--bg-subtle)] ring-1 ring-[var(--border-color)]'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  )
}

export function AdminCreateCoursePage() {
  const navigate = useNavigate()
  return (
    <Shell eyebrow="Admin" title="Create new course" description="Add new courses to the platform with detailed curriculum and pricing.">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Course creation form</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">
          Build a new learning experience
        </h1>
        <p className="mt-4 text-slate-300">
          Fill in course details, upload content, and set pricing to launch your course.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => navigate('/admin/upload-course')}>
            Create Course
          </Button>
        </div>
      </div>
    </Shell>
  )
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.readAsDataURL(file)
  })
}

export function AdminAddLearnerPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: 'intern',
  })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const passwordScore = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length
  const passwordStrength = passwordScore >= 5 ? 'Strong' : passwordScore >= 3 ? 'Good' : 'Weak'

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setNotice({ type: '', message: '' })
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Full name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 8) nextErrors.password = 'Temporary password must be at least 8 characters.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setNotice({ type: 'error', message: 'Please fix the highlighted fields before creating the user.' })
      return
    }
    try {
      setSaving(true)
      await createAdminUser({
        ...form,
        role: 'intern',
        autoAssignCourse: false,
        assignCourseId: '',
        avatarUrl: '',
        bio: '',
        expertise: 'Intern',
      })
      setNotice({
        type: 'success',
        message: 'Intern account created successfully.',
      })
      navigate('/admin/learners')
    } catch (error) {
      setNotice({ type: 'error', message: error?.response?.data?.message || error.message || 'Could not create user.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell
      eyebrow="Admin"
      title="Add intern"
      description="Create intern access with consistent admin validation and no role switching on this form."
    >
      <form onSubmit={submit} className="admin-panel p-5 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            ['name', 'Full name', 'text'],
            ['email', 'Email', 'email'],
            ['password', 'Temporary password', 'text'],
          ].map(([key, label, type]) => (
            <label key={key} className="admin-label">
              {label}
              <input type={type} value={form[key]} onChange={(event) => updateForm(key, event.target.value)} className="admin-input" aria-invalid={Boolean(fieldErrors[key])} />
              {key === 'password' ? (
                <span>
                  <span className="mb-1 flex h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <span className={`h-full rounded-full ${passwordScore >= 5 ? 'bg-emerald-500' : passwordScore >= 3 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.max(20, passwordScore * 20)}%` }} />
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Password strength: {passwordStrength}</span>
                </span>
              ) : null}
              <FieldError>{fieldErrors[key]}</FieldError>
            </label>
          ))}
          <label className="admin-label">
            Role
            <input value="Intern" readOnly className="admin-input" aria-readonly="true" />
          </label>
        </div>

        <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" loading={saving} loadingLabel="Creating...">Create Intern</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/learners')}>Cancel</Button>
        </div>
      </form>
    </Shell>
  )
}

export function AdminAddInstructorPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: 'instructor',
    avatarUrl: '',
    bio: '',
    expertise: '',
    assignCourseId: '',
    autoAssignCourse: true,
  })
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState({ type: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const passwordScore = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length
  const passwordStrength = passwordScore >= 5 ? 'Strong' : passwordScore >= 3 ? 'Good' : 'Weak'

  useEffect(() => {
    let mounted = true
    async function loadCourses() {
      try {
        const response = await fetchAdminCourses()
        if (mounted) setCourses(response.data?.courses || [])
      } catch {
        if (mounted) setCourses([])
      } finally {
        if (mounted) setCoursesLoading(false)
      }
    }
    void loadCourses()
    return () => {
      mounted = false
    }
  }, [])

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function uploadInstructorImage(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Upload an image file for the instructor profile.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Instructor image must be 2 MB or smaller.' })
      return
    }
    try {
      setUploadingAvatar(true)
      const dataUrl = await readFileAsDataUrl(file)
      const response = await uploadAdminCourseAsset({ fileName: file.name, mimeType: file.type, dataUrl })
      updateForm('avatarUrl', response.data.asset.url)
      setNotice({ type: 'success', message: 'Instructor image uploaded.' })
    } catch (error) {
      setNotice({ type: 'error', message: error?.response?.data?.message || error.message || 'Could not upload instructor image.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setNotice({ type: '', message: '' })
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Full name is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 8) nextErrors.password = 'Temporary password must be at least 8 characters.'
    if (!form.avatarUrl) nextErrors.avatarUrl = 'Upload an instructor image.'
    if (!form.expertise.trim()) nextErrors.expertise = 'Expertise is required.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setNotice({ type: 'error', message: 'Please fix the highlighted fields before creating the instructor.' })
      return
    }
    try {
      setSaving(true)
      await createAdminUser({
        ...form,
        role: 'instructor',
        autoAssignCourse: Boolean(form.autoAssignCourse) && !form.assignCourseId,
        assignCourseId: form.assignCourseId,
      })
      setNotice({ type: 'success', message: 'Instructor account created successfully.' })
      navigate('/admin/instructors')
    } catch (error) {
      setNotice({ type: 'error', message: error?.response?.data?.message || error.message || 'Could not create instructor.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell
      eyebrow="Admin"
      title="Add instructor"
      description="Create an AI instructor profile with teaching focus, profile media, and course assignment options."
    >
      <form onSubmit={submit} className="admin-panel p-5 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            ['name', 'Full name', 'text'],
            ['email', 'Email', 'email'],
            ['password', 'Temporary password', 'text'],
          ].map(([key, label, type]) => (
            <label key={key} className="admin-label">
              {label}
              <input
                type={type}
                value={form[key]}
                onChange={(event) => updateForm(key, event.target.value)}
                className="admin-input"
                aria-invalid={Boolean(fieldErrors[key])}
              />
              {key === 'password' ? (
                <span>
                  <span className="mb-1 flex h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <span className={`h-full rounded-full ${passwordScore >= 5 ? 'bg-emerald-500' : passwordScore >= 3 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.max(20, passwordScore * 20)}%` }} />
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">Password strength: {passwordStrength}</span>
                </span>
              ) : null}
              <FieldError>{fieldErrors[key]}</FieldError>
            </label>
          ))}
          <label className="admin-label md:col-span-2">
            Expertise
            <input
              value={form.expertise}
              onChange={(event) => updateForm('expertise', event.target.value)}
              className="admin-input"
              placeholder="Frontend Development, AI/ML, Product Strategy..."
              aria-invalid={Boolean(fieldErrors.expertise)}
            />
            <FieldError>{fieldErrors.expertise}</FieldError>
          </label>
          <label className="admin-label md:col-span-2">
            Instructor bio
            <textarea
              value={form.bio}
              onChange={(event) => updateForm('bio', event.target.value)}
              className="admin-input min-h-28"
              placeholder="Short profile shown on course cards, instructor pages, and admin tables."
            />
          </label>
          <label className="admin-label">
            Assign to course
            <select
              value={form.assignCourseId}
              onChange={(event) => updateForm('assignCourseId', event.target.value)}
              className="admin-input"
              disabled={coursesLoading}
            >
              <option value="">{coursesLoading ? 'Loading courses...' : 'Auto assign to an available course'}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <span className="text-xs text-[var(--text-muted)]">Auto assign picks a course without an instructor first, otherwise the latest course.</span>
          </label>
          <label className="admin-label">
            Role
            <input value="Instructor" readOnly className="admin-input" aria-readonly="true" />
          </label>
        </div>

        <div className="mt-6 grid gap-5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4 lg:grid-cols-[180px_1fr]">
          <div>
            <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)]">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Instructor preview" className="h-full w-full object-cover" />
              ) : (
                <UserPlus className="text-[var(--text-muted)]" size={44} />
              )}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Upload instructor image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void uploadInstructorImage(event.target.files?.[0])
                  event.target.value = ''
                }}
                className="admin-input file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
              />
            </label>
            <FieldError>{fieldErrors.avatarUrl}</FieldError>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{uploadingAvatar ? 'Uploading image...' : 'JPG, PNG, or WebP up to 2 MB.'}</p>
          </div>

          <div className="grid gap-4">
            <label className="admin-label">
              Teaching focus
              <input
                value={form.expertise}
                onChange={(event) => updateForm('expertise', event.target.value)}
                className="admin-input"
                placeholder="AI learning guide, coding mentor, exam coach..."
                aria-invalid={Boolean(fieldErrors.expertise)}
              />
              <FieldError>{fieldErrors.expertise}</FieldError>
            </label>
            <label className="admin-label">
              Instructor bio
              <textarea
                value={form.bio}
                onChange={(event) => updateForm('bio', event.target.value)}
                className="admin-input min-h-28"
                placeholder="Short profile shown on course cards, instructor pages, and admin tables."
              />
            </label>
          </div>
        </div>

        <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={uploadingAvatar} loading={saving} loadingLabel="Creating...">Create Instructor</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/instructors')}>Cancel</Button>
        </div>
      </form>
    </Shell>
  )
}

export function AdminManageCoursesPage() {
  const navigate = useNavigate()
  return (
    <Shell eyebrow="Admin" title="Manage courses" description="View, edit, and organize all courses on the platform.">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Course management</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">
          Organize your course catalog
        </h1>
        <p className="mt-4 text-slate-300">
          View course performance, edit content, and manage publishing status.
        </p>
        <div className="mt-6 grid gap-4">
          <Button variant="secondary" onClick={() => navigate('/admin/courses')}>
            Open course table
          </Button>
          <Button onClick={() => navigate('/admin/upload-course')}>
            Add new course
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/categories')}>
            Manage categories
          </Button>
        </div>
      </div>
    </Shell>
  )
}

export function AdminManageLearnersPage() {
  const navigate = useNavigate()
  return (
    <Shell eyebrow="Admin" title="Manage learners" description="View learner progress, manage enrollments, and track performance.">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Learner management</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">
          Track learning journeys
        </h1>
        <p className="mt-4 text-slate-300">
          Monitor progress, manage enrollments, and provide learner support.
        </p>
        <div className="mt-6 grid gap-4">
          <Button variant="secondary" onClick={() => navigate('/admin/learners')}>
            Open learner table
          </Button>
          <Button onClick={() => navigate('/admin/add-learner')}>
            Add learner
          </Button>
          <Button variant="secondary" onClick={() => navigate('/admin/notifications')}>
            Notifications
          </Button>
        </div>
      </div>
    </Shell>
  )
}

export function AdminGenerateCertificatePage() {
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  const isoToday = new Date().toISOString().slice(0, 10)
  const [certificate, setCertificate] = useState({
    userId: '',
    courseId: '',
    studentName: 'Student Name',
    courseName: 'Course Name',
    completionDate: today,
    certificateNo: `UPTO-${new Date().getFullYear()}-0001`,
    instructorName: 'Course Instructor',
  })
  const [learners, setLearners] = useState([])
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)
  const updateCertificate = (key, value) => setCertificate((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    let mounted = true
    async function loadOptions() {
      try {
        const [learnersRes, coursesRes] = await Promise.all([
          fetchAdminLearners().catch(() => ({ data: { learners: [] } })),
          fetchCourses().catch(() => ({ data: { courses: [] } })),
        ])
        if (!mounted) return
        setLearners(learnersRes.data?.learners || learnersRes.data?.users || [])
        setCourses(coursesRes.data?.courses || [])
      } catch {
        if (mounted) setStatus({ type: 'error', message: 'Could not load learners or courses.' })
      }
    }
    void loadOptions()
    return () => {
      mounted = false
    }
  }, [])

  function selectLearner(userId) {
    const learner = learners.find((item) => String(item.id) === String(userId))
    setCertificate((current) => ({
      ...current,
      userId,
      studentName: learner?.name || learner?.fullName || current.studentName,
    }))
  }

  function selectCourse(courseId) {
    const course = courses.find((item) => String(item.id) === String(courseId))
    setCertificate((current) => ({
      ...current,
      courseId,
      courseName: course?.title || current.courseName,
      instructorName: course?.createdBy?.name || current.instructorName,
    }))
  }

  async function generateCertificate(event) {
    event.preventDefault()
    if (!certificate.userId || !certificate.courseId) {
      setStatus({ type: 'error', message: 'Select a learner and course before generating.' })
      return
    }
    try {
      setSaving(true)
      setStatus({ type: '', message: '' })
      const response = await createCertificate({
        userId: certificate.userId,
        courseId: certificate.courseId,
        certificateNo: certificate.certificateNo,
        issuedAt: isoToday,
      })
      const issued = response.data?.certificate
      setCertificate((current) => ({
        ...current,
        studentName: issued?.user?.name || current.studentName,
        courseName: issued?.course?.title || current.courseName,
        instructorName: issued?.course?.createdBy?.name || current.instructorName,
        certificateNo: issued?.certificateNo || current.certificateNo,
        completionDate: issued?.issuedAt ? new Date(issued.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : current.completionDate,
      }))
      setStatus({ type: 'success', message: 'Certificate generated and saved to PostgreSQL.' })
    } catch (error) {
      setStatus({ type: 'error', message: error?.response?.data?.message || error.message || 'Could not generate certificate.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader
        eyebrow="Admin"
        title="Design certificate"
        description="Preview a professional UptoSkills certificate using learner, course, completion date, and certificate ID details."
        actions={<Button type="button" onClick={() => window.print()}>Print Certificate</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[0.45fr_1fr]">
        <form onSubmit={generateCertificate} className="admin-panel grid gap-4 p-5 sm:p-6">
          {status.message ? <AdminNotice type={status.type}>{status.message}</AdminNotice> : null}
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Issue checklist</p>
            <div className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
              {[
                ['Learner selected', Boolean(certificate.userId)],
                ['Course selected', Boolean(certificate.courseId)],
                ['Certificate ID ready', Boolean(certificate.certificateNo)],
              ].map(([label, done]) => (
                <span key={label} className="inline-flex items-center gap-2">
                  <CheckCircle2 className={done ? 'text-emerald-500' : 'text-[var(--text-muted)]'} size={16} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <label className="admin-label">
            Select learner
            <select className="admin-input" value={certificate.userId} onChange={(event) => selectLearner(event.target.value)}>
              <option value="">Choose learner</option>
              {learners.map((learner) => (
                <option key={learner.id} value={learner.id}>{learner.name || learner.fullName || learner.email}</option>
              ))}
            </select>
          </label>
          <label className="admin-label">
            Select course
            <select className="admin-input" value={certificate.courseId} onChange={(event) => selectCourse(event.target.value)}>
              <option value="">Choose course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>
          <label className="admin-label">
            Student name
            <input className="admin-input" value={certificate.studentName} onChange={(event) => updateCertificate('studentName', event.target.value)} />
          </label>
          <label className="admin-label">
            Course name
            <input className="admin-input" value={certificate.courseName} onChange={(event) => updateCertificate('courseName', event.target.value)} />
          </label>
          <label className="admin-label">
            Date of completion
            <input className="admin-input" type="date" value={certificate.completionDate} onChange={(event) => updateCertificate('completionDate', event.target.value)} />
          </label>
          <label className="admin-label">
            Course instructor
            <input className="admin-input" value={certificate.instructorName} onChange={(event) => updateCertificate('instructorName', event.target.value)} />
          </label>
          <label className="admin-label">
            Certificate ID
            <input className="admin-input" value={certificate.certificateNo} onChange={(event) => updateCertificate('certificateNo', event.target.value)} />
          </label>
          <Button type="submit" loading={saving} loadingLabel="Generating...">Generate Certificate</Button>
        </form>

        <div className="overflow-auto rounded-lg">
          <CertificatePreview certificate={certificate} />
        </div>
      </div>
    </section>
  )
}

function CertificatePreview({ certificate }) {
  return (
    <article className="relative min-w-[860px] overflow-hidden rounded-lg border border-cyan-200 bg-white p-10 text-slate-950 shadow-soft">
      <div className="absolute inset-4 rounded-lg border-2 border-teal-500/35" />
      <div className="absolute inset-8 rounded-lg border border-orange-400/35" />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-6">
          <UptoSkillsWordmark />
          <div className="text-right text-xs font-semibold uppercase tracking-[0.26em] text-cyan-700">Verified Certificate</div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.36em] text-orange-600">Certificate of Completion</p>
          <h2 className="mt-8 text-4xl font-semibold text-slate-950">{certificate.studentName || 'Student Name'}</h2>
          <div className="mx-auto mt-4 h-px w-72 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-700">
            This is to certify that <span className="font-semibold text-slate-950">{certificate.studentName || 'Student Name'}</span> has successfully completed the course <span className="font-semibold text-slate-950">"{certificate.courseName || 'Course Name'}"</span> offered by UptoSkills.
          </p>
          <p className="mx-auto mt-5 max-w-3xl leading-7 text-slate-600">
            During this course, the learner demonstrated dedication, commitment, and proficiency in the concepts, practical skills, and industry-relevant knowledge covered throughout the program.
          </p>
          <p className="mx-auto mt-5 max-w-3xl leading-7 text-slate-600">
            This certificate is awarded in recognition of the successful completion of all required coursework and assessments.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm text-slate-700">
          <div>
            <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Date of Completion</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{certificate.completionDate || 'Date'}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Certificate ID</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{certificate.certificateNo || 'Certificate Number'}</p>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center leading-7 text-slate-600">
          We congratulate {certificate.studentName || 'Student Name'} on this achievement and wish them continued success in their learning journey and future career endeavors.
        </p>

        <div className="mt-12 flex items-end justify-between gap-8">
          <div>
            <UptoSkillsWordmark compact />
            <p className="mt-2 text-sm font-semibold text-teal-700">Empowering Learners. Building Futures.</p>
          </div>
          <div className="w-64 text-center">
            <div className="mb-3 h-px bg-slate-900" />
            <p className="font-semibold text-slate-950">Authorized Signature</p>
            <p className="mt-1 text-sm text-slate-600">UptoSkills</p>
          </div>
          <div className="w-64 text-center">
            <div className="mb-3 h-px bg-slate-900" />
            <p className="font-semibold text-slate-950">Course Instructor</p>
            <p className="mt-1 text-sm text-slate-600">{certificate.instructorName || 'Course Instructor'}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

function UptoSkillsWordmark({ compact = false }) {
  return (
    <div className={`relative inline-flex items-end font-black uppercase tracking-tight ${compact ? 'text-2xl' : 'text-4xl'}`}>
      <span className="text-[#f15f3b]">Upto</span>
      <span className="text-[#18b6a6]">Skills</span>
      <span className="absolute -right-5 -top-3 h-8 w-8 rotate-45 border-r-4 border-t-4 border-[#18b6a6]" />
      <span className="absolute -right-7 -top-4 h-0 w-0 border-b-[9px] border-l-[9px] border-t-[9px] border-b-transparent border-l-[#18b6a6] border-t-transparent" />
      <span className="absolute -left-3 -top-3 h-2 w-9 -rotate-12 bg-[#3b82c4]" />
      <span className="absolute -left-1 -top-1 h-5 w-1 -rotate-12 bg-[#f9b233]" />
    </div>
  )
}

export function AdminReportsPage() {
  return <Shell eyebrow="Admin" title="Analytics reports" description="A protected analytics surface for platform health and learning operations."><CardGrid items={[{ icon: BarChart3, title: 'Revenue', text: 'Connect billing data here.' }, { icon: Users, title: 'Learners', text: 'Track active learners and growth.' }, { icon: CheckCircle2, title: 'Completion', text: 'Monitor course outcomes.' }]} /></Shell>
}





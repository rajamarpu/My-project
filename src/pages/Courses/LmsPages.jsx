import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Award, BarChart3, Bell, BriefcaseBusiness, CheckCircle2, CreditCard, FileQuestion, Headphones, LifeBuoy, MessageSquare, Newspaper, Settings, ShieldCheck, UserPlus, Users } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { createAdminUser, createCertificate, fetchAdminCourses, fetchAdminLearners, fetchCourses, uploadAdminCourseAsset } from '../../api/api.js'
import { AdminNotice, AdminPageHeader, FieldError } from '../../components/admin/AdminUI.jsx'

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

export function AboutPage() {
  return (
    <Shell eyebrow="About UptoSkills" title="Transforming Education Through Expert-Led Learning" description="UptoSkills combines cinematic course design with role-based dashboards, assessments, certificates, and production-grade authentication to create a premium learning experience.">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Our Mission</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              To make freshers employable by providing access to high-quality, expert-led courses that bridge the gap between academic learning and industry requirements.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Our Vision</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              To become the leading global platform for skill development, empowering millions of learners to achieve their career goals through accessible, engaging, and effective education.
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🎓</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Expert-Led Learning</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Learn from industry professionals and AI-powered instructors who bring real-world experience to every lesson.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Progress Tracking</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Monitor your learning journey with detailed analytics, skill assessments, and personalized recommendations.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Industry Recognition</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Earn verified certificates that are recognized by employers and help you stand out in the job market.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white mb-6">Trusted by Learners Worldwide</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-cyan-400">500K+</p>
              <p className="text-slate-600 dark:text-slate-300">Active Learners</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">1K+</p>
              <p className="text-slate-600 dark:text-slate-300">Expert Instructors</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">5K+</p>
              <p className="text-slate-600 dark:text-slate-300">Courses Available</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-400">95%</p>
              <p className="text-slate-600 dark:text-slate-300">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function ServicesPage() {
  return (
    <Shell eyebrow="Services" title="Complete Learning Platform Services" description="Access everything you need for successful learning: course management, skill tracking, certification, analytics, and content delivery.">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Learning Analytics</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Track your progress, engagement, completion rates, and skill development with detailed insights and reports.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Skill Development</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Complete hands-on projects, assessments, and practical exercises to build real-world skills that employers value.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Newspaper className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Content Library</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Access premium video lessons, downloadable resources, interactive quizzes, and supplementary learning materials.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Community Learning</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Join discussions, collaborate on projects, and learn from peers in our vibrant learning community.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Certification</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Earn industry-recognized certificates upon course completion, complete with verification codes and blockchain validation.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Settings className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Personalized Learning</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Enjoy customized learning paths, adaptive difficulty levels, and AI-powered recommendations based on your progress and goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function FeaturesPage() {
  return (
    <Shell eyebrow="Features" title="Everything Expected from a Modern SaaS LMS" description="UptoSkills delivers a complete learning ecosystem with protected content, advanced search, real-time notifications, customizable dashboards, profile management, and responsive design.">
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Bell className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Smart Notifications</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Get real-time alerts for live sessions, assignment deadlines, course updates, and community activity through our intelligent notification system.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Settings className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Personalized Settings</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Customize your learning experience with theme preferences, notification controls, privacy settings, and account management tools.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
             <div className="flex items-center justify-start gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                 <CreditCard className="text-white" size={20} />
               </div>
               <div>
                 <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Secure Payments</h3>
                 <p className="mt-2 text-slate-600 dark:text-slate-300">
                   Enjoy safe, encrypted transactions with multiple payment options, invoice generation, and automated receipts for all purchases and subscriptions.
                 </p>
               </div>
             </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <FileQuestion className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Advanced Search</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Find exactly what you need with faceted search, filters, sorting options, and intelligent recommendations across our entire course catalog.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Enterprise Security</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Learn with confidence knowing your data is protected by JWT authentication, role-based access control, regular security audits, and GDPR compliance.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Collaborative Learning</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  Engage in peer discussions, group projects, study groups, and knowledge sharing through our integrated community features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function TeamPage() {
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
                support@uptoskills.test
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
                support@uptoskills.test
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

  return (
    <Shell eyebrow="Notifications" title="Your Learning Updates" description="Stay informed about important platform updates, course announcements, deadlines, and personalized recommendations.">
      <div className="space-y-8">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Notification Preferences</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Customize how and when you receive updates from UptoSkills.
              </p>
            </div>
            <div className="flex items-center gap-3">
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
        
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white mb-6">Recent Updates</h2>
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0">
                  <Bell className="text-cyan-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">New Course: Data Science with Python</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Learn data analysis, visualization, and machine learning fundamentals with hands-on projects.
                  </p>
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-600">
                    New
                  </span>
                </div>
              </div>
              <p className="mt-3 text-slate-500 dark:text-slate-400 text-xs">
                Published 2 hours ago
              </p>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0">
                  <Bell className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Live Session Today at 6PM</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Join our expert instructor for a Q&A on career development and resume building.
                  </p>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-600">
                    Live
                  </span>
                </div>
              </div>
              <p className="mt-3 text-slate-500 dark:text-slate-400 text-xs">
                Starting in 2 hours
              </p>
            </div>
            
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0">
                  <Bell className="text-amber-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Assignment Due Tomorrow</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Complete the Python data structures assignment to unlock the next module.
                  </p>
                  <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-600">
                    Due Soon
                  </span>
                </div>
              </div>
              <p className="mt-3 text-slate-500 dark:text-slate-400 text-xs">
                Due tomorrow at 9AM
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => navigate('/settings/notifications')}>
              Manage All Notifications
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// Helper component for toggle inputs
function ToggleInput({ label, description, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
      />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const user = useSelector((state) => state.auth.user)
  return (
    <Shell eyebrow="Settings" title="User settings" description="Manage account preferences, theme behavior, product updates, and notification delivery.">
      <div className="grid gap-5 lg:grid-cols-2">
        {[
          ['Email notifications', 'Receive live class and task reminders.'],
          ['Product updates', 'Get new feature and content release notes.'],
          ['Secure session', `Signed in as ${user?.email || user?.fullName || 'current user'}.`],
          ['Profile visibility', 'Control what other learners can see.'],
        ].map(([title, text]) => (
          <div key={title} className="glass-card flex items-center justify-between gap-4 p-6 shadow-soft">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{text}</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5" />
          </div>
        ))}
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
    <Shell eyebrow="Categories" title="Browse courses by category" description="A structured catalog for technical, creative, leadership, and business learning.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {loading ? <div className="glass-card p-6 text-slate-600 shadow-soft dark:text-slate-300">Loading categories...</div> : null}
        {!loading && categories.length === 0 ? <div className="glass-card p-6 text-slate-600 shadow-soft dark:text-slate-300">No categories are available yet.</div> : null}
        {categories.map((category) => (
          <Link key={category.name} to={`/explore?category=${encodeURIComponent(category.name)}`} className="glass-card p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{category.name}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{category.count} courses</p>
          </Link>
        ))}
      </div>
    </Shell>
  )
}

export function MentorsPage() {
  const { courses, loading } = useLiveCourses()
  const mentors = [...new Map(courses
    .filter((course) => course.createdBy)
    .map((course) => [course.createdBy.email || course.createdBy.name, {
      id: course.id,
      courseTitle: course.title,
      name: course.createdBy.name,
      email: course.createdBy.email,
      avatarUrl: course.createdBy.avatarUrl || course.thumbnailUrl || '/favicon.svg',
      expertise: course.createdBy.expertise || course.category,
    }])).values()]
  return (
    <Shell eyebrow="Mentors" title="Celebrity mentors" description="Explore expert instructors and their courses.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <div className="glass-card p-6 text-slate-600 shadow-soft dark:text-slate-300">Loading mentors...</div> : null}
        {!loading && mentors.length === 0 ? <div className="glass-card p-6 text-slate-600 shadow-soft dark:text-slate-300">No instructors are available yet.</div> : null}
        {mentors.map((mentor) => (
          <Link key={mentor.email || mentor.name} to={`/course/${mentor.id}`} className="glass-card p-6 shadow-soft">
            <img src={mentor.avatarUrl} alt={mentor.name} className="h-28 w-full rounded-3xl object-cover" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{mentor.name}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{mentor.expertise}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{mentor.courseTitle}</p>
          </Link>
        ))}
      </div>
    </Shell>
  )
}

export function PricingPage() {
  return (
    <Shell eyebrow="Pricing" title="Simple plans for learning teams" description="Free previews, premium learning, and institution-ready plans.">
      <div className="grid gap-5 lg:grid-cols-3">
        {['Starter', 'Pro Learner', 'Institution'].map((plan, index) => (
          <div key={plan} className="glass-card p-7 shadow-soft">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{plan}</h2>
            <p className="mt-4 text-3xl font-semibold text-cyan-700 dark:text-cyan-300">{index === 0 ? 'Free' : index === 1 ? 'Rs. 799/mo' : 'Custom'}</p>
            <Button className="mt-6">Choose Plan</Button>
          </div>
        ))}
      </div>
    </Shell>
  )
}

export function PolicyPage({ type = 'privacy' }) {
  const terms = type === 'terms'
  return (
    <Shell eyebrow={terms ? 'Terms' : 'Privacy'} title={terms ? 'Terms and Conditions' : 'Privacy Policy'} description="Production policy pages for platform trust, compliance, and customer readiness.">
      <div className="glass-card space-y-4 p-8 text-slate-600 shadow-soft dark:text-slate-300">
        <p>We protect account, profile, learning progress, settings, and contact information using role-based API access.</p>
        <p>Use environment variables for secrets, JWT signing keys, PostgreSQL credentials, and production origins.</p>
        <p>Replace placeholder legal text with reviewed policy content before public launch.</p>
      </div>
    </Shell>
  )
}

export function ContactPage() {
  return <SupportPage />
}

export function CommunityTopicPage() {
  const { topicId } = useParams()
  return (
    <Shell eyebrow="Community" title={topicId?.replaceAll('-', ' ') || 'Topic'} description="A dedicated topic page for discussions, announcements, and replies.">
      <div className="glass-card p-8 shadow-soft">Discussion threads are ready for backend comments integration.</div>
    </Shell>
  )
}

export function LearningPathPage() {
  return <ServicesPage />
}

export function LiveSessionsPage() {
  return <NotificationsPage />
}

export function SavedCoursesPage() {
  return <CategoriesPage />
}

export function LearnerReportsPage() {
  return <FeaturesPage />
}

export function InstructorCoursesPage() {
  const navigate = useNavigate()
  return <Shell eyebrow="Instructor" title="Course management" description="Manage drafts, uploaded content, and review-ready course material." action={<Button onClick={() => navigate('/instructor/create')}>Create Course</Button>}><CategoriesPage /></Shell>
}

export function StudentFeedbackPage() {
  return <SupportPage />
}

export function AdminUsersPage() {
  return <Shell eyebrow="Admin" title="User management" description="Admin-only user and role management surface."><CardGrid items={[{ icon: Users, title: 'Registered users', text: 'Users are stored in PostgreSQL.' }, { icon: ShieldCheck, title: 'Roles', text: 'Learner, instructor, and admin permissions are separated.' }, { icon: BarChart3, title: 'Activity', text: 'Login activity is stored for admin reporting.' }]} /></Shell>
}

export function AdminSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    certificateAutoIssue: true,
    emailOtp: true,
    approvalRequired: false,
    maintenanceMode: false,
  })
  const update = (key) => setSettings((current) => ({ ...current, [key]: !current[key] }))

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader
        eyebrow="Admin"
        title="Platform settings"
        description="Configure certificates, notifications, access rules, and global LMS preferences for the UptoSkills admin panel."
        actions={<Button onClick={() => setSaved(true)}>Save Settings</Button>}
      />
      <AdminNotice type="success">{saved ? 'Settings saved for this admin session.' : ''}</AdminNotice>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm font-semibold uppercase tracking-[0.24em]">Access controls</p>
          <div className="mt-5 grid gap-4">
            <SettingsToggle checked={settings.certificateAutoIssue} onChange={() => update('certificateAutoIssue')} title="Auto-issue certificates" text="Allow certificates to be generated when learners complete required coursework and assessments." />
            <SettingsToggle checked={settings.emailOtp} onChange={() => update('emailOtp')} title="Email OTP delivery" text="Send password reset and login OTP codes to registered email addresses." />
            <SettingsToggle checked={settings.approvalRequired} onChange={() => update('approvalRequired')} title="Require manual approvals" text="Hold new instructor or intern accounts for admin review before access is granted." />
            <SettingsToggle checked={settings.maintenanceMode} onChange={() => update('maintenanceMode')} title="Maintenance mode" text="Temporarily pause learner access while admins perform operational updates." />
          </div>
        </div>

        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm font-semibold uppercase tracking-[0.24em]">System readiness</p>
          <div className="mt-5 grid gap-3">
            {[
              ['Frontend host', 'User and admin Vite ports stay separate.'],
              ['Backend API', 'Express API remains on the backend localhost port.'],
              ['Certificates', 'Template is ready for UptoSkills branded output.'],
              ['Security', 'Role-based admin routes remain protected.'],
            ].map(([title, text]) => (
              <div key={title} className="theme-subcard rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={18} />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SettingsToggle({ title, text, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className="theme-subcard flex items-center justify-between gap-4 rounded-lg p-4 text-left transition hover:border-cyan-400/50">
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
          <Button variant="secondary" onClick={() => alert('Course creation form would appear here')}>
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

export function AdminAddLearnerPage({ initialRole = 'intern' }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    role: initialRole,
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
  const isInstructor = form.role === 'instructor'

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
    if (isInstructor && !form.avatarUrl) nextErrors.avatarUrl = 'Upload an instructor image.'
    if (isInstructor && !form.expertise.trim()) nextErrors.expertise = 'Instructor expertise is required.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setNotice({ type: 'error', message: 'Please fix the highlighted fields before creating the user.' })
      return
    }
    try {
      setSaving(true)
      const response = await createAdminUser({
        ...form,
        autoAssignCourse: isInstructor && form.autoAssignCourse && !form.assignCourseId,
        assignCourseId: isInstructor ? form.assignCourseId : '',
        avatarUrl: isInstructor ? form.avatarUrl : '',
        bio: isInstructor ? form.bio : '',
        expertise: isInstructor ? form.expertise : form.role === 'intern' ? 'Intern' : '',
      })
      const assignedTitle = response.data?.assignedCourse?.title
      setNotice({
        type: 'success',
        message: assignedTitle
          ? `Instructor created and assigned to ${assignedTitle}.`
          : form.role === 'intern'
            ? 'Intern account created successfully.'
            : 'User created successfully.',
      })
      navigate(form.role === 'instructor' ? '/admin/instructors' : '/admin/learners')
    } catch (error) {
      setNotice({ type: 'error', message: error?.response?.data?.message || error.message || 'Could not create user.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Shell
      eyebrow="Admin"
      title={initialRole === 'instructor' ? 'Add instructor' : 'Add intern or instructor'}
      description={initialRole === 'instructor'
        ? 'Onboard a new instructor with a profile image, expertise, bio, and automatic course assignment.'
        : 'Create intern access, onboard instructors with a profile image, and assign instructors to a course automatically.'}
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
            <select value={form.role} onChange={(event) => updateForm('role', event.target.value)} className="admin-input">
              <option value="intern">Intern</option>
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        {isInstructor ? (
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

            <div className="grid gap-4 md:grid-cols-2">
              <label className="admin-label">
                Expertise
                <input value={form.expertise} onChange={(event) => updateForm('expertise', event.target.value)} className="admin-input" placeholder="Frontend Development, AI/ML..." aria-invalid={Boolean(fieldErrors.expertise)} />
                <FieldError>{fieldErrors.expertise}</FieldError>
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
              <label className="admin-label md:col-span-2">
                Instructor bio
                <textarea value={form.bio} onChange={(event) => updateForm('bio', event.target.value)} className="admin-input min-h-28" placeholder="Short profile shown on course cards and instructor selectors." />
              </label>
            </div>
          </div>
        ) : null}

        <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || uploadingAvatar}>{saving ? 'Creating...' : form.role === 'instructor' ? 'Create Instructor' : form.role === 'intern' ? 'Create Intern' : 'Create User'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/learners')}>Cancel</Button>
        </div>
      </form>
    </Shell>
  )
}

export function AdminManageCoursesPage() {
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
          <Button variant="secondary" onClick={() => alert('Edit course functionality')}>
            Edit selected course
          </Button>
          <Button onClick={() => alert('Delete course functionality')}>
            Delete selected course
          </Button>
          <Button variant="secondary" onClick={() => alert('Publish course functionality')}>
            Publish course
          </Button>
        </div>
      </div>
    </Shell>
  )
}

export function AdminManageLearnersPage() {
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
          <Button variant="secondary" onClick={() => alert('View learner details')}>
            View learner profile
          </Button>
          <Button onClick={() => alert('Enroll learner in course')}>
            Enroll in course
          </Button>
          <Button variant="secondary" onClick={() => alert('Send learner notification')}>
            Send notification
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
            <input className="admin-input" value={certificate.completionDate} onChange={(event) => updateCertificate('completionDate', event.target.value)} />
          </label>
          <label className="admin-label">
            Course instructor
            <input className="admin-input" value={certificate.instructorName} onChange={(event) => updateCertificate('instructorName', event.target.value)} />
          </label>
          <label className="admin-label">
            Certificate ID
            <input className="admin-input" value={certificate.certificateNo} onChange={(event) => updateCertificate('certificateNo', event.target.value)} />
          </label>
          <Button type="submit" disabled={saving}>{saving ? 'Generating...' : 'Generate Certificate'}</Button>
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





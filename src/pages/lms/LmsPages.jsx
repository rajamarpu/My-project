import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Award, BarChart3, Bell, BriefcaseBusiness, CheckCircle2, CreditCard, FileQuestion, Headphones, LifeBuoy, MessageSquare, Newspaper, Settings, ShieldCheck, UserPlus, Users } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { celebCourses } from '../../data/dummyData.js'

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
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-xl flex items-center justify-center">
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
              <p className="text-3xl font-bold text-purple-400">95%</p>
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-violet-500 rounded-xl flex items-center justify-center">
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
               <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
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
           <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
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
   const categories = [...new Set(celebCourses.map((course) => course.category))]
  return (
    <Shell eyebrow="Categories" title="Browse courses by category" description="A structured catalog for technical, creative, leadership, and business learning.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
           {categories.map((category) => (
             <Link key={category} to={`/explore?category=${category}`} className="glass-card p-6 shadow-soft">
               <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{category}</h2>
               <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{celebCourses.filter((course) => course.category === category).length} courses</p>
             </Link>
           ))}
      </div>
    </Shell>
  )
}

export function MentorsPage() {
   const mentors = [...new Map(celebCourses.map((course) => [course.instructor, course])).values()]
  return (
    <Shell eyebrow="Mentors" title="Celebrity mentors" description="Explore expert instructors and their courses.">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {mentors.map((mentor) => (
          <Link key={mentor.instructor} to={`/course/${mentor.id}`} className="glass-card p-6 shadow-soft">
            <img src={mentor.image} alt={mentor.instructor} className="h-28 w-full rounded-3xl object-cover" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{mentor.instructor}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{mentor.title}</p>
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
  return <Shell eyebrow="Admin" title="Platform settings" description="Configure certificates, notifications, access rules, and global LMS preferences."><Settings className="text-cyan-700 dark:text-cyan-300" size={48} /></Shell>
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

export function AdminAddLearnerPage() {
  return (
    <Shell eyebrow="Admin" title="Add new learner" description="Register new learners to the platform and assign them to courses.">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Learner registration</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">
          Welcome new learners
        </h1>
        <p className="mt-4 text-slate-300">
          Add learner details, assign initial courses, and set up their learning journey.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => alert('Learner registration form would appear here')}>
            Add Learner
          </Button>
        </div>
      </div>
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
  return (
    <Shell eyebrow="Admin" title="Generate certificate" description="Create and issue certificates for course completion.">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Certificate generation</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">
          Recognize achievement
        </h1>
        <p className="mt-4 text-slate-300">
          Generate customized certificates for learners who have completed courses.
        </p>
        <div className="mt-6 grid gap-4">
          <Button variant="secondary" onClick={() => alert('Select learner for certification')}>
            Select learner
          </Button>
          <Button onClick={() => alert('Choose course for certification')}>
            Select course
          </Button>
          <Button variant="secondary" onClick={() => alert('Generate and issue certificate')}>
            Generate certificate
          </Button>
        </div>
      </div>
    </Shell>
  )
}

export function AdminReportsPage() {
  return <Shell eyebrow="Admin" title="Analytics reports" description="A protected analytics surface for platform health and learning operations."><CardGrid items={[{ icon: BarChart3, title: 'Revenue', text: 'Connect billing data here.' }, { icon: Users, title: 'Learners', text: 'Track active learners and growth.' }, { icon: CheckCircle2, title: 'Completion', text: 'Monitor course outcomes.' }]} /></Shell>
}

import { motion } from 'framer-motion'
import { Activity, Clock3, LockKeyhole, ShieldCheck, TrendingUp, UserRound } from 'lucide-react'
import Logo from '../Navbar/Logo.jsx'
import AuthBrandPanel from './AuthBrandPanel.jsx'
import { fadeInUp } from '../../../utils/animationVariants.js'
import { cn } from '../../../utils/classNames.js'

export default function AuthShell({ isAdminPortal = false, mode = 'login', eyebrow, title, subtitle, children }) {
  const isDenseAuth = mode === 'register' || mode === 'reset'

  return (
    <main className={cn('auth-viewport auth-v2', isAdminPortal && 'auth-admin-viewport', isDenseAuth && 'auth-viewport-dense')}>
      <div className="auth-viewport-bg" />
      <div className="auth-top-strip" />

      <div className={cn('auth-frame', isAdminPortal && 'auth-frame-admin', isDenseAuth && 'auth-frame-dense')}>
        <AuthBrandPanel isAdminPortal={isAdminPortal} />

        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="auth-panel"
        >
          <Logo to="/" className="auth-mobile-logo" />
          <div className={cn('auth-card', isAdminPortal && 'auth-card-admin', isDenseAuth && 'auth-card-dense')}>
            <div className="auth-eyebrow">
              <span className="h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
              {eyebrow}
            </div>
            {isAdminPortal ? (
              <div className="auth-admin-shield" aria-hidden="true">
                <span className="auth-admin-shield-glow" />
                <span className="auth-admin-shield-core">
                  <LockKeyhole size={28} />
                </span>
              </div>
            ) : null}
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
            {isAdminPortal ? (
              <div className="auth-admin-card-trust">
                {[
                  ['Secure', 'Protected access', ShieldCheck],
                  ['Progress', 'Saved sessions', TrendingUp],
                  ['Support', 'Guided recovery', UserRound],
                ].map(([label, detail, Icon]) => (
                  <div key={label} className="auth-admin-card-trust-item">
                    <Icon size={15} />
                    <span>
                      <span>{label}</span>
                      <small>{detail}</small>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            {children}
            {isAdminPortal ? (
              <div className="auth-admin-access">
                <div className="auth-admin-access-heading">
                  <span />
                  Secure Admin Access
                  <span />
                </div>
                <div className="auth-admin-access-grid">
                  {[
                    ['Data Protection', 'Enterprise security', ShieldCheck],
                    ['Activity Logs', 'Monitor all actions', Activity],
                    ['24/7 Support', 'We are here to help', Clock3],
                  ].map(([label, detail, Icon]) => (
                    <div key={label} className="auth-admin-access-item">
                      <span>
                        <Icon size={16} />
                      </span>
                      <p>{label}</p>
                      <small>{detail}</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {!isAdminPortal && !isDenseAuth ? (
            <div className="auth-trust-grid">
              {[
                ['Secure', 'Protected access', ShieldCheck, 'text-emerald-600 bg-emerald-50'],
                ['Progress', 'Saved learning', TrendingUp, 'text-blue-600 bg-blue-50'],
                ['Support', 'Guided recovery', UserRound, 'text-emerald-600 bg-emerald-50'],
              ].map(([label, detail, Icon, tone]) => (
                <div key={label} className="auth-trust-item">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-slate-950 dark:text-white">{label}</span>
                    <span className="block truncate text-[0.68rem] text-slate-500 dark:text-slate-400">{detail}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </motion.section>
      </div>
    </main>
  )
}

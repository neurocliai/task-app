import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Landing.css'

const float = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

export function Landing() {
  return (
    <main className="page no-nav landing">
      <div className="landing-atmosphere" aria-hidden>
        <motion.div className="orb orb-a" {...float} />
        <motion.div
          className="orb orb-b"
          animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="orb orb-c"
          animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <header className="landing-top">
        <motion.p
          className="brand landing-brand"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Lumen
        </motion.p>
      </header>

      <section className="landing-hero">
        <motion.div
          className="hero-visual"
          aria-hidden
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg viewBox="0 0 360 280" className="hero-svg" role="img">
            <defs>
              <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#e8f6f3" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <rect x="28" y="36" width="304" height="208" rx="28" fill="url(#panel)" />
            <rect x="56" y="72" width="28" height="28" rx="9" fill="#0d7a6f" />
            <path
              d="M63 86l6 6 12-12"
              fill="none"
              stroke="#e8f6f3"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="100" y="78" width="170" height="10" rx="5" fill="#15202b" opacity="0.78" />
            <rect x="100" y="96" width="110" height="7" rx="3.5" fill="#6b7c8a" opacity="0.4" />

            <rect x="56" y="128" width="28" height="28" rx="9" fill="#d8f0ec" />
            <circle cx="70" cy="142" r="5" fill="#0d7a6f" opacity="0.35" />
            <rect x="100" y="134" width="150" height="10" rx="5" fill="#15202b" opacity="0.55" />
            <rect x="100" y="152" width="90" height="7" rx="3.5" fill="#6b7c8a" opacity="0.28" />

            <rect x="56" y="184" width="28" height="28" rx="9" fill="#d8f0ec" />
            <circle cx="70" cy="198" r="5" fill="#0d7a6f" opacity="0.35" />
            <rect x="100" y="190" width="130" height="10" rx="5" fill="#15202b" opacity="0.45" />
            <rect x="100" y="208" width="70" height="7" rx="3.5" fill="#6b7c8a" opacity="0.22" />
          </svg>
        </motion.div>

        <motion.h1
          className="h1 landing-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          Clear tasks.
          <br />
          Calm days.
        </motion.h1>

        <motion.p
          className="lead landing-lead"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
        >
          A focused mobile workspace for the few things that matter today.
        </motion.p>

        <motion.div
          className="landing-actions"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38 }}
        >
          <Link to="/auth?mode=signup" className="btn btn-primary btn-block">
            Get started
            <ArrowRight size={18} />
          </Link>
          <Link to="/auth?mode=login" className="btn btn-ghost btn-block">
            I already have an account
          </Link>
        </motion.div>
      </section>
    </main>
  )
}

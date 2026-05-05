import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  {
    icon: 'gavel',
    title: 'Know Before You Negotiate',
    body: 'Most people don\'t know what their case is worth. ClaimCalculator.ai gives you a data-backed number before you talk to an insurance adjuster, sign anything, or accept a lowball offer.',
  },
  {
    icon: 'analytics',
    title: 'Grounded in Nevada Case Signals',
    body: 'The estimate model weighs Nevada-specific accident facts, injury patterns, insurance context, and settlement-value signals.',
  },
  {
    icon: 'edit_note',
    title: 'Analyzes Your Specific Case',
    body: 'A detailed intake form gathers key data points about your accident, injuries, treatment, and liability to build an accurate profile of your case.',
  },
  {
    icon: 'price_check',
    title: 'Estimates Your Case Value',
    body: 'Once we understand your case, ClaimCalculator.ai compares the key factors that tend to move settlement value and generates an informational range.',
  },
]

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', bounce: 0.25, duration: 1.3 },
  },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.15 } },
}

export default function WhatIsSection() {
  const navigate = useNavigate()

  return (
    <section className="py-16 lg:py-24 px-4 lg:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────────── */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ type: 'spring', bounce: 0.2, duration: 1.2 }}
        >
          <h2
            className="font-headline font-black text-white mb-5 break-words max-w-md sm:max-w-none mx-auto"
            style={{ fontSize: 'clamp(1.55rem, 5vw, 3rem)', lineHeight: 1.1 }}
          >
            What is <span className="text-primary block sm:inline">ClaimCalculator</span>?
          </h2>
          <p
            className="mx-auto max-w-md sm:max-w-[600px]"
            style={{
              fontSize: '17px',
              lineHeight: 1.75,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Most people have no idea what their case is worth when they sit down with an insurance adjuster. We make the range easier to see, then show where representation may change the outcome.
          </p>
        </motion.div>

        {/* ── 2×2 Feature Grid ────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {FEATURES.map(({ icon, title, body }) => (
            <motion.div
              key={title}
              variants={itemVariants}
              className="gradient-border flex flex-col gap-3 p-6 rounded-xl transition-all duration-300 group min-w-0 overflow-hidden w-full max-w-md sm:max-w-none mx-auto"
              style={{
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(164,230,255,0.10)' }}
                >
                  <span
                    className="material-symbols-outlined text-primary text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                </div>
                <h4 className="font-headline text-white text-[19px] leading-tight min-w-0">
                  {title}
                </h4>
              </div>
              <p
                className="text-[15px] leading-relaxed break-words"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                {body}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="text-center">
          <button
            onClick={() => navigate('/calculator')}
            className="cta-gradient cta-shimmer text-on-primary-fixed px-6 sm:px-8 py-4 rounded-[16px] font-headline font-bold text-base inline-flex items-center justify-center gap-2 whitespace-nowrap max-w-full shadow-[0_0_30px_rgba(164,230,255,0.15)] hover:shadow-[0_8px_40px_rgba(164,230,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
          >
            See What Your Case Is Worth
            <span
              className="material-symbols-outlined group-hover:translate-x-1 transition-transform"
              style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              arrow_forward
            </span>
          </button>
        </div>

      </div>
    </section>
  )
}

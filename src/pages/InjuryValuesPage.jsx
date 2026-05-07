import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import InjuryValuesSection from '../components/InjuryValuesSection'

const FACTORS = [
  {
    icon: 'medical_services',
    title: 'Treatment record',
    body: 'Diagnosis, imaging, specialist visits, surgery, therapy length, and permanent impairment shape the range.',
  },
  {
    icon: 'rule',
    title: 'Fault picture',
    body: 'Nevada comparative-fault rules make liability evidence, police reports, witnesses, and camera footage matter.',
  },
  {
    icon: 'payments',
    title: 'Coverage available',
    body: 'Policy limits, commercial coverage, rideshare involvement, and uninsured coverage can cap or expand recovery paths.',
  },
]

export default function InjuryValuesPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden">
      <main className="relative z-10 pt-[58px] overflow-hidden">

        {/* Hero Header */}
        <section className="px-4 lg:px-8 pt-16 lg:pt-24 pb-8 lg:pb-12">
          <motion.div
            className="w-full max-w-full sm:max-w-3xl mx-auto text-center space-y-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 1.2 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline text-on-background leading-tight break-words">
              Injury Values <span className="block sm:inline text-primary italic">in Nevada</span>
            </h1>
            <p className="text-on-surface-variant text-base lg:text-lg w-full max-w-xl mx-auto leading-relaxed break-words">
              Compare common injury categories, the case facts that move value, and why a quick insurance offer is not the same as a documented claim range.
            </p>
          </motion.div>
        </section>

        <section className="px-4 lg:px-8 pb-10">
          <motion.div
            className="w-full max-w-full sm:max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-4 lg:gap-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 1.2 }}
          >
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/10 p-5 sm:p-6 min-w-0 overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>query_stats</span>
                <span className="text-[10px] font-label font-semibold text-primary uppercase tracking-widest">How to read the ranges</span>
              </div>
              <p className="mt-4 text-sm sm:text-base text-on-surface-variant leading-relaxed break-words">
                These ranges are directional planning numbers, not guarantees. They are meant to help you pressure-test an insurer's first offer against injury severity, liability, treatment, and coverage signals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FACTORS.map(({ icon, title, body }) => (
                <div key={title} className="rounded-xl bg-surface-container border border-outline-variant/10 p-4 min-w-0 overflow-hidden">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  <h2 className="mt-3 text-base font-headline text-on-background leading-tight">{title}</h2>
                  <p className="mt-2 text-xs text-on-surface-variant leading-relaxed break-words">{body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Existing InjuryValuesSection */}
        <InjuryValuesSection />

        {/* Bottom CTA */}
        <section className="py-16 lg:py-24 px-4 lg:px-8">
          <motion.div
            className="max-w-2xl mx-auto text-center space-y-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 1.2 }}
          >
            <h2 className="text-2xl lg:text-4xl font-headline text-on-background">
              Ready to see what your case is worth?
            </h2>
            <p className="text-on-surface-variant text-base lg:text-lg">
              Get a free, personalized estimate in about two minutes.
            </p>
            <button
              onClick={() => navigate('/calculator')}
              className="cta-gradient cta-shimmer text-on-primary-fixed px-10 py-5 rounded-[16px] font-headline font-bold text-lg inline-flex items-center gap-2 shadow-[0_0_30px_rgba(164,230,255,0.2)] hover:shadow-[0_8px_40px_rgba(164,230,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
            >
              Get My Free Estimate
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform" style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>arrow_forward</span>
            </button>
          </motion.div>
        </section>

      </main>
    </div>
  )
}

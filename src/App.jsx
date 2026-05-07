import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CalculatorForm from './components/CalculatorForm'
import { AnimatedGroup } from './components/ui/animated-group'
import ShineBorder from './components/ui/shine-border'
import WhatIsSection from './components/WhatIsSection'
import RotatingAvatars from './components/RotatingAvatars'
import { TESTIMONIALS } from './data/testimonials'

const transitionVariants = {
  container: {
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  },
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1, filter: 'blur(0px)', y: 0,
      transition: { type: 'spring', bounce: 0.3, duration: 1.5 },
    },
  },
}

function App() {
  const navigate = useNavigate()
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative min-h-screen bg-transparent">

      <main className="relative z-10 pt-[58px]">

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative flex items-center px-4 lg:px-8 py-16 lg:py-32 min-h-[600px] lg:min-h-[780px]" style={{ isolation: 'isolate', zIndex: 2 }}>
          
          {/* Background glow — positioned behind calculator */}
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-[15%] w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-[100px] pointer-events-none" />



          <div className="relative z-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

            {/* Left column */}
            <AnimatedGroup variants={transitionVariants} disableAnimation className="space-y-6 lg:space-y-0 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/20 lg:mb-6">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse flex-shrink-0"></span>
                <span className="text-[11px] font-label font-semibold text-[#4ADE80] uppercase tracking-widest">Nevada Personal Injury Calculator</span>
              </div>

              {/* Headline — stronger size contrast */}
              <h1 className="text-[2.45rem] min-[390px]:text-[2.65rem] sm:text-5xl md:text-6xl lg:text-7xl font-headline text-on-background leading-[0.95] tracking-tight lg:mb-7 max-w-full">
                <span className="block sm:inline">Insurance</span>
                <span className="block sm:inline"> companies</span>{' '}
                <br className="hidden lg:block" />
                <span className="block sm:inline">already know</span>
                <span className="block sm:inline"> your number.</span>{' '}
                <br />
                <span className="text-primary italic">Now you do too.</span>
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant/85 max-w-md mx-auto lg:mx-0 leading-relaxed lg:mb-9">
                <span className="block sm:inline">Find out what your Nevada</span>{' '}
                <span className="block sm:inline">injury case is worth</span>{' '}
                <span className="block sm:inline">before you talk to an adjuster,</span>{' '}
                <span className="block sm:inline">sign anything, or settle for</span>{' '}
                <span className="block sm:inline">less than you should.</span>
              </p>

              {/* Social proof — avatars */}
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start lg:mb-6">
                <RotatingAvatars />
                <p className="text-base text-on-surface-variant max-w-[19rem] lg:max-w-none">
                  <span className="block sm:inline">Built for Nevada injury</span>{' '}
                  <span className="block sm:inline">claims before the first offer</span>
                </p>
              </div>

              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/calculator')}
                  className="w-full sm:w-auto cta-gradient cta-shimmer text-on-primary-fixed px-5 sm:px-8 py-4 sm:py-5 rounded-[16px] font-headline font-bold text-base sm:text-lg flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_30px_rgba(164,230,255,0.2)] hover:shadow-[0_8px_40px_rgba(164,230,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
                >
                  See What Your Case Is Worth
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform duration-200" style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>arrow_forward</span>
                </button>
                <p className="text-sm text-outline self-center text-center max-w-[16rem] sm:max-w-none leading-snug px-2 sm:px-0">
                  <span className="block sm:inline">No cost. No obligation.</span>{' '}
                  <span className="block sm:inline">Built for Nevada injury cases.</span>
                </p>
              </div>
            </AnimatedGroup>

            {/* Right column — DESKTOP ONLY: embedded calculator preview */}
            <motion.div
              className="relative hidden lg:block self-center overflow-hidden z-20"
              initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ type: 'spring', bounce: 0.2, duration: 1.8, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-primary/5 rounded-xl blur-2xl transform rotate-3" />
              <ShineBorder borderWidth={2} duration={6} gradient="from-[#a855f7] via-[#3b82f6] via-[#06b6d4] to-[#ffffff]">
                <CalculatorForm />
              </ShineBorder>
            </motion.div>

          </div>
        </section>

        {/* ── TRUST BAR ──────────────────────────────────────────────────── */}
        <section className="relative overflow-visible px-4 lg:px-8 -mt-4 lg:-mt-8" style={{ zIndex: 1 }}>
          {/* ── LAS VEGAS SKYLINE DIVIDER ── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: 'translateY(-100%)',
              opacity: 0.12,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'flex-end',
              zIndex: 0,
            }}
            className="lv-skyline-divider"
          >
            <img
              src="/lv-skyline.png"
              alt=""
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                filter: 'invert(1)',
              }}
            />
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-4 gap-y-4 py-5 border-t border-b border-white/[0.06]">
              {[
                { icon: 'lock', text: '256-bit SSL Encrypted' },
                { icon: 'schedule', text: 'Results in 2 Minutes' },
                { icon: 'money_off', text: '100% Free — No Credit Card' },
                { icon: 'shield', text: 'Your Info Stays Private' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center justify-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[#4ADE80] text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>{icon}</span>
                  <span className="text-[12px] sm:text-[13px] text-on-surface-variant/50 font-medium leading-tight">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT IS CLAIMCALCULATOR.AI ────────────────────── */}
        <WhatIsSection />

        {/* ── CREDIBILITY SPINE ───────────────────────────────── */}
        <section className="pt-16 lg:pt-24 pb-12 lg:pb-18 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <AnimatedGroup
              variants={{ container: { visible: { transition: { staggerChildren: 0.12 } } }, item: transitionVariants.item }}
              className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-6 lg:gap-10 items-stretch"
            >
              <div className="gradient-border rounded-xl p-6 sm:p-8 lg:p-10 space-y-7 w-full max-w-md sm:max-w-none mx-auto overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
                    <span className="text-[10px] font-label font-semibold text-primary uppercase tracking-widest">Nevada estimate model</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline text-on-background leading-none">
                    Know your number before <span className="text-primary italic">the adjuster calls.</span>
                  </h2>
                  <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed break-words">
                    The calculator translates your accident facts into a Nevada-focused settlement range, then shows the gap between a quick insurance offer and an attorney-assisted path.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: '4.5x', label: 'Attorney boost floor in the model' },
                    { value: '2 min', label: 'Typical guided estimate time' },
                    { value: '$0', label: 'Cost to run the evaluation' },
                  ].map(({ value, label }) => (
                    <div key={label} className="rounded-xl bg-surface-container-low/70 p-4 border border-outline-variant/10 min-w-0">
                      <p className="text-2xl sm:text-3xl font-headline font-black text-primary leading-none">{value}</p>
                      <p className="mt-2 text-xs text-on-surface-variant leading-snug">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: 'balance',
                    title: 'Nevada legal lens',
                    body: 'The flow accounts for fault, injury type, accident context, insurance details, and Nevada-specific case signals.',
                  },
                  {
                    icon: 'policy',
                    title: 'Clear estimate boundaries',
                    body: 'Every result is informational, not legal advice, and does not predict or guarantee a settlement outcome.',
                  },
                  {
                    icon: 'encrypted',
                    title: 'Private intake',
                    body: 'Lead data is submitted through the secure edge-function path, with rate limiting and no direct anonymous database writes.',
                  },
                  {
                    icon: 'handshake',
                    title: 'Attorney handoff ready',
                    body: 'If you want help, the backend is structured to route qualified Nevada cases to participating attorneys.',
                  },
                ].map(({ icon, title, body }) => (
                  <div key={title} className="rounded-xl bg-surface-container-low border border-outline-variant/10 p-5 sm:p-6 min-h-[185px] flex flex-col w-full max-w-md sm:max-w-none mx-auto overflow-hidden">
                    <span className="material-symbols-outlined text-primary text-3xl mb-5" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <h3 className="text-lg font-headline text-on-background leading-tight">{title}</h3>
                    <p className="mt-3 text-sm text-on-surface-variant leading-relaxed break-words">{body}</p>
                  </div>
                ))}
              </div>
            </AnimatedGroup>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section className="py-20 lg:py-32 px-4 lg:px-8 bg-transparent">
          <div className="max-w-7xl mx-auto">
            <AnimatedGroup
              variants={{ container: { visible: { transition: { staggerChildren: 0.12 } } }, item: transitionVariants.item }}
              className="text-center space-y-4 mb-16"
            >
              <h2 className="text-3xl lg:text-5xl font-headline ">
                Your Roadmap to a <span className="text-primary italic">Fair Settlement</span>
              </h2>
              <p className="text-on-surface-variant text-[19px] lg:text-lg max-w-xl mx-auto">
                Three simple steps between you and the compensation you deserve.
              </p>
            </AnimatedGroup>

            <AnimatedGroup
              variants={{ container: { visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } } }, item: transitionVariants.item }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-10 mb-12"
            >
              {[
                { num: '01', title: 'Report Details', body: 'Answer a few quick questions about your accident and injuries in our secure calculator.' },
                { num: '02', title: 'Estimate Range', body: 'The model weighs your case facts against Nevada settlement-value signals and shows an informational range.' },
                { num: '03', title: 'Attorney Handoff', body: 'If you want help, your intake can be routed to participating Nevada attorneys for review.' },
              ].map(({ num, title, body }) => (
                <div key={num} className="gradient-border space-y-3 p-6 lg:p-7 rounded-xl transition-all duration-300" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-headline font-black text-outline/20 leading-none">{num}</span>
                    <h4 className="text-lg font-headline text-on-background">{title}</h4>
                  </div>
                  <p className="text-on-surface-variant text-base leading-relaxed">{body}</p>
                </div>
              ))}
            </AnimatedGroup>

            {/* CTA within section */}
            <div className="text-center">
              <button
                onClick={() => navigate('/calculator')}
                className="cta-gradient cta-shimmer text-on-primary-fixed px-8 py-4 rounded-[16px] font-headline font-bold text-base inline-flex items-center gap-2 shadow-[0_0_30px_rgba(164,230,255,0.15)] hover:shadow-[0_8px_40px_rgba(164,230,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
              >
                Start Free Evaluation
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS CAROUSEL ─────────────────────────────────────── */}
        <section className="py-20 lg:py-28 px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="gradient-border relative p-8 lg:p-12 pb-14 glass-card rounded-xl min-h-[300px] flex flex-col justify-center"
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', bounce: 0.2, duration: 1.4 }}
            >
              <span className="material-symbols-outlined text-primary text-5xl absolute -top-7 left-6 bg-[#111318] px-2" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>

              {/* Verified badge + "See all stories" link */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#4ADE80] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-[13px] font-semibold text-[#4ADE80] uppercase tracking-widest">Verified ClaimCalculator User</span>
                </div>
                <a
                  href="/success-stories"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[15px] text-outline hover:text-primary transition-colors duration-200 group"
                >
                  See all stories
                  <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">open_in_new</span>
                </a>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  {/* Before / After numbers */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <span className="text-[10px] text-outline uppercase tracking-widest font-semibold">Offered</span>
                      <span className="text-sm font-headline font-bold text-on-surface-variant line-through decoration-outline/60">
                        ${TESTIMONIALS[activeTestimonial].initial?.toLocaleString()}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-base">arrow_forward</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4ADE80]/[0.08] border border-[#4ADE80]/20">
                      <span className="text-[10px] text-[#4ADE80] uppercase tracking-widest font-semibold">Settled</span>
                      <span className="text-sm font-headline font-bold text-[#4ADE80]">
                        ${TESTIMONIALS[activeTestimonial].final?.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#4ADE80] px-2 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20">
                      +{Math.round(((TESTIMONIALS[activeTestimonial].final - TESTIMONIALS[activeTestimonial].initial) / TESTIMONIALS[activeTestimonial].initial) * 100)}%
                    </span>
                  </div>

                  {/* Quote — clickable, opens success stories page in new tab */}
                  <a
                    href="/success-stories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group cursor-pointer"
                    aria-label="Read all success stories"
                  >
                    <p className="text-lg sm:text-xl lg:text-2xl font-headline font-medium leading-snug italic text-on-background group-hover:text-primary transition-colors duration-200">
                      &quot;{TESTIMONIALS[activeTestimonial].quote}&quot;
                    </p>
                  </a>

                  {/* Author row */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                      {TESTIMONIALS[activeTestimonial].initials}
                    </div>
                    <div>
                      <h5 className="text-on-background text-sm sm:text-[15px]">{TESTIMONIALS[activeTestimonial].name}</h5>
                      <p className="text-xs sm:text-[15px] text-outline">{TESTIMONIALS[activeTestimonial].location} &middot; {TESTIMONIALS[activeTestimonial].type}</p>
                    </div>
                    {/* Stars */}
                    <div className="ml-auto flex flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-yellow-400 text-base sm:text-lg -mx-0.5 sm:mx-0" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Carousel Indicators */}
              <div className="absolute bottom-5 inset-x-0 flex justify-center gap-1.5">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeTestimonial === i ? 'bg-primary w-5' : 'bg-outline-variant/40 hover:bg-outline-variant w-1.5'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── BOTTOM CTA BANNER ─────────────────────────────────────────── */}
        <section className="py-20 lg:py-28 px-4 lg:px-8">
          <motion.div
            className="max-w-2xl mx-auto text-center space-y-7"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ type: 'spring', bounce: 0.2, duration: 1.2 }}
          >
            <h2 className="text-3xl lg:text-4xl font-headline ">
              The insurance adjuster <span className="text-primary italic">isn't on your side.</span>
            </h2>
            <p className="text-on-surface-variant text-[19px]">
              Nevadans who hire an attorney recover an average of <span className="text-on-background font-bold">4.5× more</span> than those who don't. See where you stand — free.
            </p>
            <button
              onClick={() => navigate('/calculator')}
              className="cta-gradient cta-shimmer text-on-primary-fixed w-full sm:w-auto px-10 py-5 rounded-[16px] font-headline font-bold text-lg flex items-center justify-center gap-2 mx-auto shadow-[0_0_40px_rgba(164,230,255,0.2)] hover:shadow-[0_8px_50px_rgba(164,230,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 group"
            >
              See What Your Case Is Worth
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform" style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>arrow_forward</span>
            </button>
            <p className="text-sm text-outline">No cost. No commitment. SSL encrypted.</p>
          </motion.div>
        </section>

      </main>

    </div>
  )
}

export default App

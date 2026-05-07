import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedGroup } from './ui/animated-group'

const transitionVariants = {
  container: {
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  },
  item: {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 12 },
    visible: {
      opacity: 1, filter: 'blur(0px)', y: 0,
      transition: { type: 'spring', bounce: 0.3, duration: 1.5 },
    },
  },
}

const severityConfig = {
  moderate:      { label: 'Moderate',      bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.25)',  text: '#FACC15' },
  severe:        { label: 'Severe',         bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.25)',  text: '#FB923C' },
  catastrophic:  { label: 'Catastrophic',   bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   text: '#EF4444' },
  low:           { label: 'Low to Moderate',bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.25)',  text: '#4ADE80' },
}

const INJURY_TYPES = [
  {
    name: 'Whiplash',
    range: '$2,500 – $100,000+',
    desc: 'Value depends heavily on treatment duration, imaging findings, and whether symptoms became chronic.',
    severity: 'moderate',
  },
  {
    name: 'Soft Tissue Injury',
    range: '$3,000 – $25,000',
    desc: 'Sprains, strains, and muscle tears. Nevada cases often exceed national averages in Clark County due to higher medical billing rates.',
    severity: 'low',
  },
  {
    name: 'Herniated Disc',
    range: '$75,000 – $350,000+',
    desc: 'Nevada neck and back cases average nearly $1.8 million at the high end. Surgical cases carry significantly more value.',
    severity: 'severe',
  },
  {
    name: 'Traumatic Brain Injury',
    range: '$750,000 – $2,000,000+',
    desc: 'TBI cases in Las Vegas and Clark County are among the highest-value in Nevada. Long-term care costs drive settlement size.',
    severity: 'catastrophic',
  },
  {
    name: 'Spinal Cord Injury',
    range: '$1,000,000 – $3,000,000+',
    desc: 'Partial or full paralysis cases regularly exceed seven figures in Nevada. Lifetime care costs are a primary factor.',
    severity: 'catastrophic',
  },
  {
    name: 'Broken Bones',
    range: '$25,000 – $150,000',
    desc: 'Fractures requiring surgery, hardware, or extended rehab carry the most value. Simple fractures settle on the lower end.',
    severity: 'moderate',
  },
  {
    name: 'Shoulder Injury',
    range: '$50,000 – $350,000+',
    desc: 'Rotator cuff tears, labrum damage, and dislocations. Surgical repairs and permanent impairment push values higher.',
    severity: 'severe',
  },
  {
    name: 'Knee Injury',
    range: '$65,000 – $350,000+',
    desc: 'Meniscus tears, ACL damage, and knee replacements all affect value. Nevada juries favor documented surgical outcomes.',
    severity: 'severe',
  },
  {
    name: 'Nerve Damage',
    range: '$20,000 – $500,000',
    desc: 'Cervical nerve injuries average $75K–$350K in Nevada. Permanent nerve damage carries far more value than temporary cases.',
    severity: 'severe',
  },
  {
    name: 'Internal Injuries',
    range: '$75,000 – $250,000+',
    desc: 'Head-on and truck collisions frequently cause internal trauma. Organ damage and internal bleeding are treated as severe injuries.',
    severity: 'severe',
  },
  {
    name: 'Scarring & Disfigurement',
    range: '$40,000 – $150,000+',
    desc: 'Facial scarring and visible disfigurement carry non-economic damages under Nevada law. Severe cases can exceed this range significantly.',
    severity: 'moderate',
  },
  {
    name: 'Wrongful Death',
    range: '$500,000 – $5,000,000+',
    desc: 'Surviving dependents and lost future income are the primary drivers. Nevada has no hard cap on non-economic damages in most cases.',
    severity: 'catastrophic',
  },
]

export default function InjuryValuesSection() {
  return (
    <section className="py-20 lg:py-32 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <AnimatedGroup
          variants={{ container: { visible: { transition: { staggerChildren: 0.12 } } }, item: transitionVariants.item }}
          className="text-center space-y-4 mb-16 max-w-[21.5rem] sm:max-w-none mx-0 sm:mx-auto"
        >
          <h2 className="text-3xl lg:text-5xl font-headline ">
            What Is Your Injury Worth{' '}
            <span className="text-primary italic">in Nevada?</span>
          </h2>
          <p className="text-on-surface-variant text-[17px] lg:text-lg max-w-2xl mx-auto">
            Nevada settlement values vary from national averages. Here's what cases like yours have settled for in Nevada courts.
          </p>
        </AnimatedGroup>

        {/* Cards Grid */}
        <AnimatedGroup
          variants={{ container: { visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }, item: transitionVariants.item }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 max-w-[21.5rem] sm:max-w-none mx-0 sm:mx-auto"
        >
          {INJURY_TYPES.map(({ name, range, desc, severity }) => {
            const sev = severityConfig[severity]
            return (
              <div
                key={name}
	                className="group p-5 rounded-xl border flex flex-col gap-3 transition-all duration-300 min-w-0 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(164,230,255,0.22)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                {/* Top row: name + severity pill */}
                <div className="flex items-start justify-between gap-3">
	                  <h4 className="text-[15px] font-headline text-white leading-snug break-words">
                    {name}
                  </h4>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: sev.bg,
                      border: `1px solid ${sev.border}`,
                      color: sev.text,
                    }}
                  >
                    {sev.label}
                  </span>
                </div>

                {/* Nevada range — large + prominent */}
                <p
                  className="text-xl lg:text-2xl font-headline font-black"
                  style={{ color: '#22D3EE' }}
                >
                  {range}
                </p>

                {/* Description */}
	                <p className="text-sm text-on-surface-variant leading-relaxed flex-1 break-words">
                  {desc}
                </p>
              </div>
            )
          })}
        </AnimatedGroup>

        {/* Disclaimer */}
        <p
	          className="text-center mt-10 max-w-[21.5rem] sm:max-w-3xl mx-0 sm:mx-auto"
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.6,
          }}
        >
          Settlement ranges are based on Nevada case data from 2022 through 2026. Individual results vary based on injury severity, liability, insurance coverage, and other case-specific factors. This is not legal advice.
        </p>

      </div>
    </section>
  )
}

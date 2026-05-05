import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calcSettlement } from '../lib/calc-settlement'
import { submitLead } from '../lib/submit-lead'

const MotionDiv = motion.div

// ─── DATA ──────────────────────────────────────────────────────────────────

const CASE_TYPES = [
  { value: 'Motor Vehicle Accident', label: 'Motor Vehicle Accident', icon: 'directions_car' },
  { value: 'Premises Liability', label: 'Premises Liability / Slip and Fall', icon: 'falling' },
  { value: 'Work Injury', label: 'Work-Related Injury', icon: 'construction' },
  { value: 'Product Liability', label: 'Product Liability', icon: 'package_2' },
  { value: 'Other', label: 'Other', icon: 'more_horiz' },
]

const ACCIDENT_TYPES = [
  { label: 'Rear-end collision', icon: 'directions_car' },
  { label: 'T-bone / side impact', icon: 'swap_horiz' },
  { label: 'Head-on collision', icon: 'warning' },
  { label: 'Multi-vehicle pileup', icon: 'multiple_stop' },
  { label: 'Hit and run', icon: 'directions_run' },
  { label: 'Parking lot / low speed', icon: 'local_parking' },
]

const INJURY_CATEGORIES = [
  {
    label: 'Soft Tissue Injuries',
    items: ['Body aches & pain', 'Cuts, scrapes & bruises'],
  },
  {
    label: 'Substantial Injuries',
    items: ['Broken or fractured bones', 'Scarring', 'Internal bleeding', 'Memory loss'],
  },
  {
    label: 'Catastrophic Injuries',
    items: ['Surgery required', 'Coma', 'Brain injury', 'Paralysis', 'Loss of internal organs', 'Amputation'],
  },
  {
    label: 'No Injuries',
    items: ['I was not injured'],
    single: true,
  },
]

const FAULT_OPTIONS = [
  { value: 'Not my fault', label: 'No — the other driver was at fault' },
  { value: 'Mostly other driver', label: 'Mostly the other driver, but partially shared' },
  { value: 'Shared / unclear', label: "It's unclear / both of us share responsibility" },
  { value: 'Mostly me', label: 'Mostly or entirely my fault' },
]

const EV_OPTIONS = [
  { value: 'Yes', label: 'Yes', icon: 'electric_car' },
  { value: 'No', label: 'No', icon: 'no_crash' },
  { value: 'Not sure', label: "I'm not sure", icon: 'help_outline' },
]

const COMMERCIAL_VEHICLE_OPTIONS = [
  { value: 'Yes', label: 'Yes', icon: 'local_shipping' },
  { value: 'No', label: 'No', icon: 'no_crash' },
  { value: 'Not sure', label: "I'm not sure", icon: 'help_outline' },
]

const LOW_OFFER_INSURERS = ['GEICO', 'Allstate', 'Progressive']

const DATE_OPTIONS = [
  { value: 'Less than 30 days ago', label: 'Less than 30 days ago' },
  { value: '1–6 months ago', label: '1–6 months ago' },
  { value: '6–12 months ago', label: '6–12 months ago' },
  { value: 'Over a year ago', label: 'Over a year ago' },
]

const MY_INSURERS = [
  { label: 'State Farm', icon: 'shield' },
  { label: 'GEICO', icon: 'shield' },
  { label: 'Progressive', icon: 'shield' },
  { label: 'Allstate', icon: 'shield' },
  { label: 'Farmers', icon: 'shield' },
  { label: 'USAA', icon: 'shield' },
  { label: 'Other / Not Listed', icon: 'more_horiz' },
  { label: 'I Have No Insurance', icon: 'no_crash' },
]

const OTHER_INSURERS = [
  { label: 'State Farm', icon: 'shield' },
  { label: 'GEICO', icon: 'shield' },
  { label: 'Progressive', icon: 'shield' },
  { label: 'Allstate', icon: 'shield' },
  { label: 'Farmers', icon: 'shield' },
  { label: 'USAA', icon: 'shield' },
  { label: 'Other / Not Listed', icon: 'more_horiz' },
  { label: "They Have No Insurance / I Don't Know", icon: 'no_crash' },
]

// Non-motor-vehicle specific options
const FAULT_JOB_FAULT_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
]

const FAULT_JOB_ON_JOB_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
]

const REPORT_OPTIONS = [
  { value: 'Property Owner/Manager', label: 'Property Owner/Manager' },
  { value: 'Law Enforcement', label: 'Law Enforcement' },
  { value: 'Supervisor/Manager at your workplace', label: 'Supervisor/Manager at your workplace' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Other', label: 'Other' },
]

const ADJUSTER_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
  { value: 'Not Sure', label: 'Not Sure' },
]

const CAMERAS_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
  { value: 'Not Sure', label: 'Not Sure' },
]

const WITNESSES_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
  { value: 'Not Sure', label: 'Not Sure' },
]

const SURFACE_OPTIONS = [
  { value: 'No, it was uneven or sloped', label: 'No, it was uneven or sloped' },
  { value: 'Yes, it was level and even', label: 'Yes, it was level and even' },
  { value: 'Not Sure', label: 'Not Sure' },
]

const LIGHTING_OPTIONS = [
  { value: 'No, it was poorly lit', label: 'No, it was poorly lit' },
  { value: 'Yes, it was well-lit', label: 'Yes, it was well-lit' },
  { value: 'Not Sure', label: 'Not Sure' },
]

const LAWYER_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
]

// ─── STEP FLOW DEFINITIONS ─────────────────────────────────────────────────
// Motor Vehicle:     caseType → accidentType → injuries → fault → ev → commercial → when → myInsurer → otherInsurer → lawyer → zip → contact
// Non-Motor Vehicle: caseType → injuries → faultJob → report → adjuster → cameras → conditions → when → myInsurer → lawyer → zip → contact

const MOTOR_VEHICLE_STEPS = [
  'caseType',        // 1
  'accidentType',    // 2
  'injuries',        // 3
  'fault',           // 4
  'ev',              // 5
  'commercial',      // 6
  'when',            // 7
  'myInsurer',       // 8
  'otherInsurer',    // 9
  'lawyer',          // 10
  'zip',             // 11
  'contact',         // 12
]

const NON_MOTOR_VEHICLE_STEPS = [
  'caseType',        // 1
  'injuries',        // 2
  'faultJob',        // 3
  'report',          // 4
  'adjuster',        // 5
  'cameras',         // 6
  'conditions',      // 7
  'when',            // 8
  'myInsurer',       // 9
  'lawyer',          // 10
  'zip',             // 11
  'contact',         // 12
]

// ─── HELPERS ────────────────────────────────────────────────────────────────

const fmt = n => '$' + n.toLocaleString()

// ─── STEP ANIMATION ─────────────────────────────────────────────────────────

const stepVariants = {
  enter: (dir) => ({
    y: dir > 0 ? 40 : -40,
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.97,
  }),
  center: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { type: 'spring', bounce: 0.25, duration: 0.7 },
  },
  exit: (dir) => ({
    y: dir > 0 ? -30 : 30,
    opacity: 0,
    filter: 'blur(6px)',
    scale: 0.97,
    transition: { type: 'spring', bounce: 0, duration: 0.4 },
  }),
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function OptionBtn({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-5 py-4 min-h-[56px] rounded-[16px] border text-left font-medium text-sm transition-all duration-200
        ${selected
          ? 'border-primary/50 bg-primary/[0.08] text-primary shadow-[0_0_12px_rgba(164,230,255,0.06)]'
          : 'border-white/[0.08] bg-surface-container-highest/60 text-on-surface-variant hover:border-primary/25 hover:bg-surface-container-highest/90 hover:-translate-y-[1px]'
        }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
        ${selected ? 'border-primary' : 'border-outline/40'}`}>
        {selected && <span className="w-2 h-2 rounded-full bg-primary block" />}
      </span>
      {children}
    </button>
  )
}

function CheckItem({ checked, onChange, label }) {
  return (
    <div
      onClick={onChange}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] border cursor-pointer transition-all duration-200
        ${checked
          ? 'border-primary/50 bg-primary/[0.08]'
          : 'border-white/[0.08] bg-surface-container-highest/60 hover:border-primary/25'
        }`}
    >
      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
        ${checked ? 'bg-primary border-primary' : 'border-outline/40'}`}>
        {checked && (
          <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '13px', fontVariationSettings: "'wght' 700" }}>check</span>
        )}
      </div>
      <span className={`text-sm ${checked ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{label}</span>
    </div>
  )
}

function StepHeading({ title, sub }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl md:text-2xl font-headline text-on-background leading-snug mb-1.5">{title}</h2>
      {sub && <p className="text-sm text-on-surface-variant/80">{sub}</p>}
    </div>
  )
}

function NavButtons({ onNext, onBack, nextLabel = 'Continue', step, disabled = false }) {
  return (
    <div className="mt-7 space-y-2">
      <button
        type="button"
        onClick={disabled ? undefined : onNext}
        disabled={disabled}
        className={`w-full py-4 rounded-[16px] font-headline font-bold text-base flex items-center justify-center gap-2 group transition-all duration-200
          ${disabled
            ? 'bg-surface-container-highest/60 text-outline/40 cursor-not-allowed border border-outline-variant/10'
            : 'cta-gradient cta-shimmer text-on-primary-fixed shadow-[0_0_20px_rgba(164,230,255,0.12)] hover:shadow-[0_4px_30px_rgba(164,230,255,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
          }`}
      >
        {nextLabel}
        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>arrow_forward</span>
      </button>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-sm text-outline hover:text-on-surface transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
          Go Back
        </button>
      )}
      {step === 0 && (
        <p className="text-[10px] text-center text-outline leading-tight pt-1">
          By continuing you agree to our Terms &amp; Privacy Policy. SSL encrypted.
        </p>
      )}
      {/* Privacy reassurance microcopy */}
      <div className="flex items-start gap-2 pt-1">
        <span className="material-symbols-outlined text-[#4ADE80]/60 flex-shrink-0" style={{ fontSize: '16px', marginTop: '1px', fontVariationSettings: "'FILL' 1" }}>lock</span>
        <span className="text-[11px] text-on-surface-variant/40 leading-relaxed">Your information is encrypted and never shared without your permission.</span>
      </div>
    </div>
  )
}

// ─── REQUIRED FIELD LABEL ───────────────────────────────────────────────────

function RequiredLabel({ children }) {
  return (
    <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">
      {children} <span className="text-red-500 text-xs">*</span>
    </label>
  )
}

// ─── RESULT SCREEN ──────────────────────────────────────────────────────────

function ResultScreen({ data, serverEstimate }) {
  const [showCallback, setShowCallback] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [cb, setCb] = useState({ name: '', phone: '', time: 'Morning (8am \u2013 12pm)' })
  const localRes = calcSettlement(data)
  const res = serverEstimate ?? localRes
  const isBarred = serverEstimate
    ? (serverEstimate.withLow === 0 && serverEstimate.withHigh === 0)
    : (localRes.faultBarred ?? false)
  const withAvg = Math.round((res.withLow + res.withHigh) / 2)
  const withoutAvg = Math.round((res.withoutLow + res.withoutHigh) / 2)
  const difference = withAvg - withoutAvg
  const multiplier = withoutAvg > 0 ? (withAvg / withoutAvg).toFixed(1) : '\u2014'

  return (
    <MotionDiv
      className="space-y-5"
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.9 }}
    >
      {/* Fault barred warning */}
      {isBarred && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            <h3 className="text-lg font-headline text-error">Nevada's 51% Rule Applies</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Based on your fault assessment, Nevada law (NRS 41.141) may significantly limit your ability to recover damages. When you're more than 50% at fault, your case value is $0 under the state's modified comparative negligence rule.
          </p>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            That said, fault percentages are often negotiated, and an experienced attorney may be able to build a case for a lower share. It's worth a conversation.
          </p>
        </div>
      )}
      {/* Compare cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* With attorney */}
        <div className="rounded-xl overflow-hidden border-2 border-[#4ADE80]/30 shadow-[0_0_20px_rgba(74,222,128,0.08)]">
          <div className="bg-[#4ADE80]/15 p-3 text-center">
            <p className="text-xs font-label font-bold text-[#4ADE80] uppercase tracking-widest">With Attorney</p>
          </div>
          <div className="bg-surface-container p-4 text-center space-y-1">
            <p className="text-[10px] text-outline uppercase tracking-widest">Average payout</p>
            <p className="text-3xl font-headline font-black text-[#4ADE80]">{fmt(withAvg)}</p>
            <p className="text-[11px] text-on-surface-variant">{fmt(res.withLow)} – {fmt(res.withHigh)}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-3 py-1 rounded-full bg-[#4ADE80]/20 text-[#4ADE80] uppercase tracking-widest">✓ Best outcome</span>
          </div>
        </div>
        {/* Without attorney */}
        <div className="rounded-xl overflow-hidden border border-outline-variant/10 opacity-80">
          <div className="bg-error/10 p-3 text-center">
            <p className="text-xs font-label font-bold text-error uppercase tracking-widest">Without Attorney</p>
          </div>
          <div className="bg-surface-container p-4 text-center space-y-1">
            <p className="text-[10px] text-outline uppercase tracking-widest">Average payout</p>
            <p className="text-3xl font-headline font-black text-error">{fmt(withoutAvg)}</p>
            <p className="text-[11px] text-on-surface-variant">{fmt(res.withoutLow)} – {fmt(res.withoutHigh)}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-3 py-1 rounded-full bg-error/20 text-error uppercase tracking-widest">Leaves money behind</span>
          </div>
        </div>
      </div>

      {/* Difference callout */}
      <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/20 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-label font-bold text-[#4ADE80] uppercase tracking-widest mb-0.5">Potential money left on the table</p>
          <p className="text-sm text-on-surface-variant leading-relaxed">Without a Nevada attorney, you could be walking away from <span className="text-[#4ADE80] font-bold">{fmt(difference)}</span> in compensation you're legally owed.</p>
        </div>
        <div className="flex-shrink-0 text-center">
          <p className="text-3xl font-headline font-black text-[#4ADE80]">{multiplier}x</p>
          <p className="text-[10px] text-outline uppercase tracking-widest">more</p>
        </div>
      </div>

      {/* Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-on-surface-variant leading-relaxed">
        <span className="text-primary font-semibold">Nevada residents represented by an attorney recover an average of {multiplier}x more.</span>{' '}
        Insurance companies settle fast and low when there's no attorney involved — because they know you don't know your real number.
      </div>

      {/* Urgency box */}
      <div className="bg-surface-container rounded-xl border border-outline-variant/10 p-5 space-y-4">
        <div>
          <h3 className="text-lg font-headline text-on-background mb-1">Wait — you're not done yet.</h3>
          <p className="text-sm text-on-surface-variant">The most important step is next. A case specialist will reach out to:</p>
        </div>
        <ul className="space-y-2">
          {[
            'Verify your accident details and confirm your estimate',
            'Connect you with a local Nevada attorney for the true value of your case',
            'Help locate your accident report if needed',
            "Show you how to file for every dollar you're entitled to",
          ].map(item => (
            <li key={item} className="flex gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '18px', marginTop: '2px' }}>arrow_forward</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="border-l-2 border-primary pl-3 text-sm text-on-surface font-medium leading-relaxed">
          Don't speak to the insurance company first. The wrong words can cut your payout significantly before you ever talk to an attorney.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+17025550100"
            className="flex items-center justify-center gap-2 py-3.5 bg-primary/10 border border-primary/30 hover:bg-primary/20 rounded-xl text-primary font-headline font-bold text-base tracking-wide transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>call</span>
            Call Now
          </a>
          <button
            type="button"
            onClick={() => setShowCallback(v => !v)}
            className="flex items-center justify-center gap-2 py-3.5 bg-surface-container-highest border border-outline-variant/20 hover:border-primary/30 rounded-xl text-on-surface font-headline font-bold text-base tracking-wide transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
            Callback
          </button>
        </div>

        {showCallback && !submitted && (
          <div className="border border-outline-variant/10 rounded-xl p-4 space-y-3 bg-surface-container-lowest">
            <p className="text-sm font-headline font-bold text-on-background">We'll call you back</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">First Name</label>
                <input type="text" placeholder="First name" value={cb.name} onChange={e => setCb(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-3 py-2.5 text-sm outline-none border border-outline-variant/20 focus:border-primary/60 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Phone</label>
                <input type="tel" placeholder="(702) 555-0100" value={cb.phone} onChange={e => setCb(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-3 py-2.5 text-sm outline-none border border-outline-variant/20 focus:border-primary/60 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-1">Best Time to Call</label>
              <select value={cb.time} onChange={e => setCb(p => ({ ...p, time: e.target.value }))}
                className="w-full bg-surface-container-highest text-on-surface rounded-xl px-3 py-2.5 text-sm outline-none border border-outline-variant/20 focus:border-primary/60 transition-colors">
                {['Morning (8am – 12pm)', 'Afternoon (12pm – 5pm)', 'Evening (5pm – 8pm)', 'Anytime'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => setSubmitted(true)}
              className="w-full cta-gradient text-on-primary-fixed py-3 rounded-xl font-bold text-sm transition-all">
              Submit Request →
            </button>
          </div>
        )}

        {submitted && (
          <div className="text-center py-4 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-xl space-y-1">
            <p className="font-headline font-bold text-[#4ADE80]">Request Received</p>
            <p className="text-sm text-on-surface-variant">A specialist will contact you within 1 business hour.</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-center text-outline leading-relaxed">
        This estimate is for informational purposes only and does not constitute legal advice. Actual values vary by case. Consult a licensed Nevada attorney before accepting any settlement.
      </p>
    </MotionDiv>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function CalculatorForm() {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [contactTouched, setContactTouched] = useState({})
  const [serverEstimate, setServerEstimate] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [data, setData] = useState({
    website: '',
    caseType: '',
    type: '',
    injuries: [],
    fault: '',
    evInvolved: '',
    commercialVehicle: '',
    when: '',
    myInsurer: '',
    otherInsurer: '',
    description: '',
    zip: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Non-motor-vehicle fields
    faultAtFault: '',
    onTheJob: '',
    reportedTo: [],
    adjuster: '',
    cameras: '',
    witnesses: '',
    surface: '',
    lighting: '',
    hiredLawyer: '',
  })

  const isMotorVehicle = data.caseType === 'Motor Vehicle Accident'
  const steps = data.caseType === '' ? ['caseType'] : (isMotorVehicle ? MOTOR_VEHICLE_STEPS : NON_MOTOR_VEHICLE_STEPS)
  const currentStepName = steps[stepIndex] || 'caseType'
  const TOTAL_STEPS = steps.length

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  const toggleInjury = (injury) => {
    const isNone = injury === 'I was not injured'
    setData(prev => {
      if (isNone) {
        return { ...prev, injuries: prev.injuries.includes(injury) ? [] : [injury] }
      }
      const without = prev.injuries.filter(i => i !== 'I was not injured')
      return {
        ...prev,
        injuries: without.includes(injury) ? without.filter(i => i !== injury) : [...without, injury],
      }
    })
  }

  const toggleReport = (item) => {
    setData(prev => {
      const list = prev.reportedTo || []
      return {
        ...prev,
        reportedTo: list.includes(item) ? list.filter(i => i !== item) : [...list, item],
      }
    })
  }

  // Contact form validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPhone = (phone) => phone.replace(/\D/g, '').length >= 7
  const contactComplete = data.firstName.trim() && data.lastName.trim() && isValidEmail(data.email) && isValidPhone(data.phone)

  const handleContactBlur = (field) => {
    setContactTouched(prev => ({ ...prev, [field]: true }))
  }

  const progress = done ? 100 : (data.caseType === '' && stepIndex === 0) ? 11 : Math.round(((stepIndex + 1) / TOTAL_STEPS) * 100)

  const goTo = (idx) => {
    setDirection(idx > stepIndex ? 1 : -1)
    setStepIndex(idx)
  }

  const showResult = async () => {
    setContactTouched({ firstName: true, lastName: true, email: true, phone: true })
    if (!contactComplete) return
    if (loading) return
    setSubmitError(null)
    setLoading(true)
    try {
      const result = await submitLead(data)
      setServerEstimate(result.estimate)
      setDirection(1)
      setStepIndex(-1)
      setDone(true)
    } catch (err) {
      console.error('submit-lead failed', err)
      if (err.status === 429) {
        setSubmitError('Too many attempts. Please try again later or call us.')
      } else {
        setSubmitError('Something went wrong. Please try again or call us.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── RENDER STEP ─────────────────────────────────────────────────────────

  const renderStep = () => {
    const stepName = currentStepName

    switch (stepName) {
      // ── SHARED: Case Type (first step for ALL paths) ──
      case 'caseType':
        return (
          <>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-primary/[0.08] border border-primary/20 mb-6">
              <span className="text-[11px] font-label font-semibold text-primary uppercase tracking-[0.05em]">Nevada-specific settlement data</span>
            </div>
            <StepHeading title={<>What type of <span className="text-primary italic">injury case</span> is this?</>} sub="Select the option that best describes your situation." />
            <div className="grid grid-cols-1 gap-3">
              {CASE_TYPES.map(({ value, label, icon }) => (
                <OptionBtn key={value} selected={data.caseType === value} onClick={() => set('caseType', value)}>
                  <span className="material-symbols-outlined text-lg opacity-60 flex-shrink-0">{icon}</span>
                  {label}
                </OptionBtn>
              ))}
            </div>
            <NavButtons step={0} onNext={() => goTo(1)} disabled={!data.caseType} />
          </>
        )

      // ── MOTOR VEHICLE: Accident Type ──
      case 'accidentType':
        return (
          <>
            <StepHeading title={<>What type of accident <span className="text-primary italic">were you in?</span></>} sub="Select the option that best describes your situation." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCIDENT_TYPES.map(({ label, icon }) => (
                <OptionBtn key={label} selected={data.type === label} onClick={() => set('type', label)}>
                  <span className="material-symbols-outlined text-lg opacity-60 flex-shrink-0">{icon}</span>
                  {label}
                </OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.type} />
          </>
        )

      // ── SHARED: Injuries ──
      case 'injuries':
        return (
          <>
            <StepHeading title={<>How were you <span className="text-primary italic">injured?</span></>} sub="Check everything that applies, even if minor or not yet officially diagnosed." />
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {INJURY_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <p className="text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-2 pb-1 border-b border-outline-variant/10">{cat.label}</p>
                  <div className={`grid gap-2 ${cat.single ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {cat.items.map(inj => (
                      <CheckItem key={inj} label={inj} checked={data.injuries.includes(inj)} onChange={() => toggleInjury(inj)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={data.injuries.length === 0} />
          </>
        )

      // ── MOTOR VEHICLE: Fault ──
      case 'fault':
        return (
          <>
            <StepHeading title={<>Was the accident <span className="text-primary italic">your fault?</span></>} sub="Nevada follows comparative fault rules. Partial fault still allows recovery." />
            <div className="grid gap-3">
              {FAULT_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.fault === o.value} onClick={() => set('fault', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.fault} />
          </>
        )

      // ── MOTOR VEHICLE: EV ──
      case 'ev':
        return (
          <>
            <StepHeading title={<>Were you involved in an accident with an <span className="text-primary italic">electric vehicle (EV)?</span></>} sub="EV accidents can involve unique factors like battery fires, autopilot systems, and manufacturer liability that may affect your case." />
            <div className="grid gap-3">
              {EV_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.evInvolved === o.value} onClick={() => set('evInvolved', o.value)}>
                  <span className="material-symbols-outlined text-lg opacity-60 flex-shrink-0">{o.icon}</span>
                  {o.label}
                </OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.evInvolved} />
          </>
        )

      // ── MOTOR VEHICLE: Commercial ──
      case 'commercial':
        return (
          <>
            <StepHeading title={<>Did the accident involve a <span className="text-primary italic">commercial vehicle?</span></>} sub="Accidents involving commercial vehicles like semi-trucks, delivery vans, or rideshare vehicles often involve higher insurance policy limits and additional liable parties." />
            <div className="grid gap-3">
              {COMMERCIAL_VEHICLE_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.commercialVehicle === o.value} onClick={() => set('commercialVehicle', o.value)}>
                  <span className="material-symbols-outlined text-lg opacity-60 flex-shrink-0">{o.icon}</span>
                  {o.label}
                </OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.commercialVehicle} />
          </>
        )

      // ── SHARED: When ──
      case 'when':
        return (
          <>
            <StepHeading title={<>When did this <span className="text-primary italic">{isMotorVehicle ? 'accident' : 'injury'} occur?</span></>} sub="Nevada has a 2-year statute of limitations. Timing matters." />
            <div className="grid gap-3">
              {DATE_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.when === o.value} onClick={() => set('when', o.value)}>
                  <span className="material-symbols-outlined text-base opacity-50 flex-shrink-0">schedule</span>
                  {o.label}
                </OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.when} />
          </>
        )

      // ── SHARED: My Insurance ──
      case 'myInsurer':
        return (
          <>
            <StepHeading title={<>Who is your <span className="text-primary italic">insurance provider?</span></>} sub="Select your insurance company. This helps us understand your coverage situation." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MY_INSURERS.map(({ label, icon }) => (
                <OptionBtn key={label} selected={data.myInsurer === label} onClick={() => set('myInsurer', label)}>
                  <span className="material-symbols-outlined text-lg opacity-60 flex-shrink-0">{icon}</span>
                  <span className="text-xs leading-tight">{label}</span>
                </OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.myInsurer} />
          </>
        )

      // ── MOTOR VEHICLE: Other Driver's Insurance ──
      case 'otherInsurer':
        return (
          <>
            <StepHeading title={<>Do you know the <span className="text-primary italic">other driver's insurance?</span></>} sub="Some insurers are known for making low initial offers to see if you'll accept less than your case is worth. Knowing the company helps estimate negotiation room." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OTHER_INSURERS.map(({ label, icon }) => (
                <OptionBtn key={label} selected={data.otherInsurer === label} onClick={() => set('otherInsurer', label)}>
                  <span className="material-symbols-outlined text-lg opacity-60 flex-shrink-0">{icon}</span>
                  <span className="text-xs leading-tight">{label}</span>
                </OptionBtn>
              ))}
            </div>
            {data.otherInsurer && LOW_OFFER_INSURERS.includes(data.otherInsurer) && (
              <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 mt-3 text-sm text-on-surface-variant leading-relaxed">
                <span className="material-symbols-outlined text-secondary text-lg align-middle mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                {data.otherInsurer} is known for making initial offers well below case value. An attorney experienced with {data.otherInsurer} cases in Nevada can typically negotiate a significantly higher settlement.
              </div>
            )}
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.otherInsurer} />
          </>
        )

      // ── SHARED: Lawyer + Tell Us About Your Case (replaces old "describe your accident") ──
      case 'lawyer':
        return (
          <>
            <StepHeading title={<>Have you hired a <span className="text-primary italic">lawyer yet?</span></>} />
            <div className="grid gap-3 mb-8">
              {LAWYER_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.hiredLawyer === o.value} onClick={() => set('hiredLawyer', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <StepHeading title={<>Tell us about <span className="text-primary italic">your case</span></>} sub="Providing more detail helps our AI calculate your settlement." />
            <div>
              <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-2">Your Details</label>
              <textarea
                rows={4}
                placeholder="e.g. I slipped on a wet floor at a grocery store and hurt my back. I went to the ER that night and have been in physical therapy since..."
                value={data.description}
                onChange={e => set('description', e.target.value)}
                className="w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-4 py-3 text-sm outline-none border border-outline-variant/20 focus:border-primary/60 transition-colors resize-none"
              />
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.hiredLawyer} />
          </>
        )

      // ── SHARED: Zip Code ──
      case 'zip':
        return (
          <>
            <StepHeading title={<>What's your <span className="text-primary italic">zip code?</span></>} sub="We use this to match you with licensed Nevada attorneys in your area." />
            <div>
              <label className="block text-[10px] font-label font-bold text-outline uppercase tracking-widest mb-2">Zip Code</label>
              <input
                type="text" inputMode="numeric" maxLength={5} placeholder="e.g. 89101"
                value={data.zip}
                onChange={e => set('zip', e.target.value.replace(/\D/g, ''))}
                className="w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-4 py-4 text-2xl font-headline font-black tracking-widest outline-none border border-outline-variant/20 focus:border-primary/60 transition-colors"
              />
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={data.zip.length < 5} />
          </>
        )

      // ── SHARED: Contact Info ──
      case 'contact':
        return (
          <>
            <StepHeading title={<>Last step. <span className="text-primary italic">Your estimate is ready.</span></>} sub="Enter your contact details to unlock your full case value. Takes 10 seconds." />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <RequiredLabel>First Name</RequiredLabel>
                  <input
                    type="text"
                    placeholder="First name"
                    value={data.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    onBlur={() => handleContactBlur('firstName')}
                    className={`w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-3 py-3 text-sm outline-none border transition-colors ${
                      contactTouched.firstName && !data.firstName.trim()
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-outline-variant/20 focus:border-primary/60'
                    }`}
                  />
                  {contactTouched.firstName && !data.firstName.trim() && (
                    <p className="text-red-500 text-[10px] mt-1">First name is required</p>
                  )}
                </div>
                <div>
                  <RequiredLabel>Last Name</RequiredLabel>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={data.lastName}
                    onChange={e => set('lastName', e.target.value)}
                    onBlur={() => handleContactBlur('lastName')}
                    className={`w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-3 py-3 text-sm outline-none border transition-colors ${
                      contactTouched.lastName && !data.lastName.trim()
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-outline-variant/20 focus:border-primary/60'
                    }`}
                  />
                  {contactTouched.lastName && !data.lastName.trim() && (
                    <p className="text-red-500 text-[10px] mt-1">Last name is required</p>
                  )}
                </div>
              </div>
              <div>
                <RequiredLabel>Email Address</RequiredLabel>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={data.email}
                  onChange={e => set('email', e.target.value)}
                  onBlur={() => handleContactBlur('email')}
                  className={`w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-3 py-3 text-sm outline-none border transition-colors ${
                    contactTouched.email && !isValidEmail(data.email)
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-outline-variant/20 focus:border-primary/60'
                  }`}
                />
                {contactTouched.email && !data.email.trim() && (
                  <p className="text-red-500 text-[10px] mt-1">Email is required</p>
                )}
                {contactTouched.email && data.email.trim() && !isValidEmail(data.email) && (
                  <p className="text-red-500 text-[10px] mt-1">Enter a valid email address</p>
                )}
              </div>
              <div>
                <RequiredLabel>Phone Number</RequiredLabel>
                <input
                  type="tel"
                  placeholder="(702) 555-0100"
                  value={data.phone}
                  onChange={e => set('phone', e.target.value)}
                  onBlur={() => handleContactBlur('phone')}
                  className={`w-full bg-surface-container-highest text-on-surface placeholder-outline/50 rounded-xl px-3 py-3 text-sm outline-none border transition-colors ${
                    contactTouched.phone && !isValidPhone(data.phone)
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-outline-variant/20 focus:border-primary/60'
                  }`}
                />
                {contactTouched.phone && !data.phone.trim() && (
                  <p className="text-red-500 text-[10px] mt-1">Phone number is required</p>
                )}
                {contactTouched.phone && data.phone.trim() && !isValidPhone(data.phone) && (
                  <p className="text-red-500 text-[10px] mt-1">Enter a valid phone number</p>
                )}
              </div>
            </div>
            {submitError && (
              <div className="mb-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
                {submitError}
              </div>
            )}
            <NavButtons nextLabel="Get My Results" onNext={showResult} onBack={() => goTo(stepIndex - 1)} disabled={!contactComplete || loading} />
            <p className="text-[10px] text-center text-outline leading-tight mt-2">
              By clicking "Get My Results" you agree to be contacted by a licensed Nevada attorney. No obligation. Your info is never sold.
            </p>
          </>
        )

      // ═══════════════════════════════════════════════════════════════════════
      // NON-MOTOR-VEHICLE STEPS
      // ═══════════════════════════════════════════════════════════════════════

      // ── Fault + On the Job ──
      case 'faultJob':
        return (
          <>
            <StepHeading title={<>Were you <span className="text-primary italic">at fault?</span></>} />
            <div className="grid gap-3 mb-8">
              {FAULT_JOB_FAULT_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.faultAtFault === o.value} onClick={() => set('faultAtFault', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <StepHeading title={<>Did it happen <span className="text-primary italic">on the job?</span></>} />
            <div className="grid gap-3">
              {FAULT_JOB_ON_JOB_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.onTheJob === o.value} onClick={() => set('onTheJob', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.faultAtFault || !data.onTheJob} />
          </>
        )

      // ── Report ──
      case 'report':
        return (
          <>
            <StepHeading title={<>Did you report the injury to <span className="text-primary italic">any of the following?</span></>} sub="Select all that apply." />
            <div className="grid gap-3">
              {REPORT_OPTIONS.map(o => (
                <CheckItem key={o.value} label={o.label} checked={(data.reportedTo || []).includes(o.value)} onChange={() => toggleReport(o.value)} />
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={(data.reportedTo || []).length === 0} />
          </>
        )

      // ── Adjuster ──
      case 'adjuster':
        return (
          <>
            <StepHeading title={<>Have you received any settlement offers or been contacted by <span className="text-primary italic">insurance adjusters?</span></>} />
            <div className="grid gap-3">
              {ADJUSTER_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.adjuster === o.value} onClick={() => set('adjuster', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.adjuster} />
          </>
        )

      // ── Cameras + Witnesses ──
      case 'cameras':
        return (
          <>
            <StepHeading title={<>Were there any <span className="text-primary italic">surveillance cameras</span> in the area where the injury occurred?</>} />
            <div className="grid gap-3 mb-8">
              {CAMERAS_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.cameras === o.value} onClick={() => set('cameras', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <StepHeading title={<>Were there any <span className="text-primary italic">witnesses</span> to the injury?</>} />
            <div className="grid gap-3">
              {WITNESSES_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.witnesses === o.value} onClick={() => set('witnesses', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.cameras || !data.witnesses} />
          </>
        )

      // ── Conditions (Surface + Lighting) ──
      case 'conditions':
        return (
          <>
            <StepHeading title={<>Was the surface where the injury occurred <span className="text-primary italic">level and even?</span></>} />
            <div className="grid gap-3 mb-8">
              {SURFACE_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.surface === o.value} onClick={() => set('surface', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <StepHeading title={<>Was the area where the injury occurred <span className="text-primary italic">well-lit?</span></>} />
            <div className="grid gap-3">
              {LIGHTING_OPTIONS.map(o => (
                <OptionBtn key={o.value} selected={data.lighting === o.value} onClick={() => set('lighting', o.value)}>{o.label}</OptionBtn>
              ))}
            </div>
            <NavButtons onNext={() => goTo(stepIndex + 1)} onBack={() => goTo(stepIndex - 1)} disabled={!data.surface || !data.lighting} />
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative glass-card p-4 min-[390px]:p-5 sm:p-8 md:p-10 rounded-xl border border-primary/[0.1] shadow-[0_0_80px_rgba(164,230,255,0.06),0_25px_50px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
      {/* Progress bar */}
      <div className="mb-7">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-label text-outline uppercase tracking-widest">
            {done ? 'Your Estimate' : `Step ${stepIndex + 1} of ${TOTAL_STEPS}`}
          </p>
          <span className="text-xs font-label text-primary font-semibold">{progress}%</span>
        </div>
        <div className="w-full bg-surface-container-lowest h-[3px] rounded-full overflow-hidden">
          <MotionDiv
            className="bg-gradient-to-r from-primary to-[#00d1ff] h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.6 }}
          />
        </div>
      </div>

      {/* Loading — pulsating + sign */}
      {loading && (
        <MotionDiv
          className="text-center py-10 space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-center">
            <video
              className="plus-pulse-loading w-20 h-20 object-contain rounded-xl"
              src="/fading_color_dark.mp4"
              poster="/fading_color_dark_poster.png"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
          <p className="text-base text-on-surface-variant">Our AI is analyzing your case...</p>
          <p className="text-sm text-outline">Cross-referencing Nevada settlement data and injury profiles</p>
        </MotionDiv>
      )}

      {/* Result */}
      {done && <ResultScreen data={data} serverEstimate={serverEstimate} />}

      {/* Honeypot — hidden from humans AND autofill via display:none wrapper */}
      <div aria-hidden="true" style={{ display: 'none' }}>
        <input
          type="text"
          name="hp_website"
          tabIndex={-1}
          autoComplete="off"
          value={data.website}
          onChange={(e) => set('website', e.target.value)}
        />
      </div>

      {/* Step content — card-stack spring animation */}
      {!loading && !done && (
        <div className="min-h-[300px] relative">
          <AnimatePresence mode="wait" custom={direction}>
            <MotionDiv
              key={currentStepName}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {renderStep()}
            </MotionDiv>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

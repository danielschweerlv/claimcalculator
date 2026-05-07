import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronUp, ChevronDown, Trophy, Users, TrendingUp, DollarSign, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { AnimatedCounter } from './AnimatedCounter'
import { ChartCard } from './ChartCard'
import {
  fetchAttorneyMetrics,
  formatCurrency,
  GRADE_COLORS,
} from '@/lib/analytics-helpers'

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_ORDER = { A: 0, B: 1, C: 2, D: 3, F: 4 }

const COLUMNS = [
  { key: 'rank',              label: '#',              sortable: false },
  { key: 'name',              label: 'Attorney',       sortable: true  },
  { key: 'grade',             label: 'Grade',          sortable: true  },
  { key: 'totalAssigned',     label: 'Leads',          sortable: true  },
  { key: 'accepted',          label: 'Accepted',       sortable: true  },
  { key: 'rejected',          label: 'Rejected',       sortable: true  },
  { key: 'conversionRate',    label: 'Conv. Rate',     sortable: true  },
  { key: 'avgResponseHours',  label: 'Avg Response',   sortable: true  },
  { key: 'totalRevenue',      label: 'Revenue',        sortable: true  },
  { key: 'avgPayout',         label: 'Avg Payout',     sortable: true  },
]

const OUTCOME_COLORS = {
  accepted:  '#4ADE80',
  converted: '#4ADE80',
  pending:   '#a4e6ff',
  rejected:  '#ffb4ab',
}

const PAYOUT_COLORS = {
  paid:     '#4ADE80',
  invoiced: '#a4e6ff',
  unpaid:   '#ffb4ab',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatResponseTime(hours) {
  if (!isFinite(hours) || hours == null) return { label: '—', color: '#bbc9cf' }
  if (hours < 24)  return { label: `${Math.round(hours)}h`,         color: '#4ADE80'  }
  if (hours < 48)  return { label: `${Math.round(hours / 24)}d`,    color: '#fbbf24'  }
  const days = Math.round(hours / 24)
  return { label: `${days} days`, color: '#ffb4ab' }
}

function formatCaseType(raw) {
  if (!raw) return '—'
  return raw
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function sortAttorneys(attorneys, sortKey, sortDir) {
  return [...attorneys].sort((a, b) => {
    let av, bv
    if (sortKey === 'grade') {
      av = GRADE_ORDER[a.grade] ?? 5
      bv = GRADE_ORDER[b.grade] ?? 5
    } else {
      av = a[sortKey] ?? 0
      bv = b[sortKey] ?? 0
    }

    if (typeof av === 'string') {
      return sortDir === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av)
    }

    return sortDir === 'asc' ? av - bv : bv - av
  })
}

function buildOutcomePieData(assignments) {
  const counts = { accepted: 0, rejected: 0, pending: 0, converted: 0 }
  assignments.forEach((a) => {
    const o = a.outcome || 'pending'
    if (o in counts) counts[o]++
  })
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradeBadge({ grade }) {
  const colors = GRADE_COLORS[grade] || GRADE_COLORS.F
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-['Space_Grotesk'] text-sm font-bold"
      style={{ color: colors.text, backgroundColor: colors.bg }}
    >
      {grade}
    </span>
  )
}

function OutcomeBadge({ outcome }) {
  const color = OUTCOME_COLORS[outcome] || '#bbc9cf'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-['Inter'] text-xs font-medium capitalize"
      style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
    >
      {outcome || 'pending'}
    </span>
  )
}

function PayoutBadge({ status }) {
  const color = PAYOUT_COLORS[status] || '#bbc9cf'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-['Inter'] text-xs font-medium capitalize"
      style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
    >
      {status || 'unpaid'}
    </span>
  )
}

function ConvRateCell({ conversionRate, grade }) {
  const pct = Math.min(Math.max(conversionRate * 100, 0), 100)
  const barColor = GRADE_COLORS[grade]?.text || '#a4e6ff'
  return (
    <div className="relative flex items-center gap-2 min-w-[90px]">
      {/* Background progress track */}
      <div className="absolute inset-0 rounded overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="h-full rounded transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: `${barColor}18`,
          }}
        />
      </div>
      <span
        className="relative z-10 font-['Inter'] text-sm font-semibold w-full text-center"
        style={{ color: barColor }}
      >
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function MiniDonut({ data }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ResponsiveContainer width={100} height={100}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={44}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={OUTCOME_COLORS[entry.name] || '#333539'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1e2024',
              border: '1px solid #333539',
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              color: '#e2e2e8',
            }}
            formatter={(v, name) => [v, formatCaseType(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1 w-full">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: OUTCOME_COLORS[entry.name] || '#333539' }}
            />
            <span className="font-['Inter'] text-[10px] text-[#bbc9cf] capitalize leading-none">
              {entry.name}
            </span>
            <span className="font-['Inter'] text-[10px] text-[#e2e2e8] ml-auto tabular-nums">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExpandedDetail({ attorney }) {
  const pieData = buildOutcomePieData(attorney.assignments)

  return (
    <motion.tr
      key={`detail-${attorney.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={COLUMNS.length} className="p-0">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div className="bg-[#111318] border-t border-b border-[#333539] px-6 py-4 flex gap-6">
            {/* Sub-table */}
            <div className="flex-1 overflow-x-auto">
              {attorney.assignments.length === 0 ? (
                <p className="font-['Manrope'] text-sm text-[#bbc9cf] py-4">
                  No assignments yet.
                </p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#333539]">
                      {['Lead', 'Case Type', 'Assigned Date', 'Outcome', 'Payout Status', 'Amount'].map(
                        (h) => (
                          <th
                            key={h}
                            className="pb-2 pr-4 font-['Inter'] text-[10px] font-semibold uppercase tracking-wider text-[#bbc9cf] whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {attorney.assignments.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-[#333539]/40 hover:bg-[#333539]/20 transition-colors"
                      >
                        <td className="py-2 pr-4">
                          <Link
                            to={`/admin/leads/${a.leadId}`}
                            className="font-['Manrope'] text-sm text-[#a4e6ff] hover:text-white transition-colors underline-offset-2 hover:underline whitespace-nowrap"
                          >
                            {a.leadName || `Lead #${a.leadId}`}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 font-['Manrope'] text-sm text-[#e2e2e8] whitespace-nowrap">
                          {formatCaseType(a.caseType)}
                        </td>
                        <td className="py-2 pr-4 font-['Inter'] text-xs text-[#bbc9cf] whitespace-nowrap">
                          {a.assignedAt
                            ? format(new Date(a.assignedAt), 'MMM d, yyyy')
                            : '—'}
                        </td>
                        <td className="py-2 pr-4">
                          <OutcomeBadge outcome={a.outcome} />
                        </td>
                        <td className="py-2 pr-4">
                          <PayoutBadge status={a.payoutStatus} />
                        </td>
                        <td className="py-2 font-['Inter'] text-sm text-[#4ADE80] tabular-nums whitespace-nowrap">
                          {a.payoutAmount ? formatCurrency(a.payoutAmount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Mini donut */}
            {pieData.length > 0 && (
              <div className="shrink-0 w-[120px] flex flex-col items-center pt-2">
                <p className="font-['Inter'] text-[10px] uppercase tracking-wider text-[#bbc9cf] mb-2">
                  Outcomes
                </p>
                <MiniDonut data={pieData} />
              </div>
            )}
          </div>
        </motion.div>
      </td>
    </motion.tr>
  )
}

function SummaryBar({ attorneys }) {
  const totalAttorneys = attorneys.length
  const bestPerformer =
    attorneys.find((a) => a.grade === 'A') ||
    (attorneys.length > 0 ? attorneys[0] : null)
  const avgConvRate =
    attorneys.length > 0
      ? attorneys.reduce((sum, a) => sum + a.conversionRate, 0) / attorneys.length
      : 0
  const totalRevenue = attorneys.reduce((sum, a) => sum + (a.totalRevenue || 0), 0)

  const cards = [
    {
      icon: <Users size={18} strokeWidth={1.5} />,
      label: 'Total Attorneys',
      value: totalAttorneys,
      color: '#a4e6ff',
      counter: <AnimatedCounter value={totalAttorneys} className="text-2xl text-[#a4e6ff]" />,
    },
    {
      icon: <Trophy size={18} strokeWidth={1.5} />,
      label: 'Best Performer',
      value: bestPerformer?.name,
      color: '#fbbf24',
      counter: (
        <span className="font-['Space_Grotesk'] font-bold text-lg text-[#fbbf24] leading-tight truncate max-w-[160px] block">
          {bestPerformer?.name || '—'}
        </span>
      ),
    },
    {
      icon: <TrendingUp size={18} strokeWidth={1.5} />,
      label: 'Avg Conversion Rate',
      value: avgConvRate * 100,
      color: '#4ADE80',
      counter: (
        <AnimatedCounter
          value={avgConvRate * 100}
          suffix="%"
          decimals={1}
          className="text-2xl text-[#4ADE80]"
        />
      ),
    },
    {
      icon: <DollarSign size={18} strokeWidth={1.5} />,
      label: 'Total Revenue',
      value: totalRevenue / 100,
      color: '#4ADE80',
      counter: (
        <AnimatedCounter
          value={totalRevenue / 100}
          prefix="$"
          decimals={0}
          className="text-2xl text-[#4ADE80]"
        />
      ),
    },
  ]

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden:   { opacity: 0, y: 16 },
    visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  }

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={itemVariants}
          className="bg-[#111318] rounded-lg p-4 border border-[#333539] flex flex-col gap-2"
        >
          <div className="flex items-center gap-2" style={{ color: card.color }}>
            {card.icon}
            <span className="font-['Inter'] text-xs font-medium text-[#bbc9cf] uppercase tracking-wider">
              {card.label}
            </span>
          </div>
          <div className="mt-0.5">{card.counter}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AttorneyScorecard() {
  const [attorneys, setAttorneys]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [sortKey, setSortKey]         = useState('grade')
  const [sortDir, setSortDir]         = useState('asc')
  const [expandedId, setExpandedId]   = useState(null)

  useEffect(() => {
    fetchAttorneyMetrics().then((data) => {
      setAttorneys(data ?? [])
      setLoading(false)
    })
  }, [])

  const handleSort = useCallback(
    (key) => {
      if (!key) return
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        // Natural default directions
        setSortDir(key === 'name' ? 'asc' : key === 'grade' ? 'asc' : 'desc')
      }
    },
    [sortKey]
  )

  const handleRowClick = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const sorted = sortAttorneys(attorneys, sortKey, sortDir)

  // Row animation variants
  const tableVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  }
  const rowVariants = {
    hidden:  { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  }

  return (
    <ChartCard
      title="Attorney Scorecard"
      subtitle="Performance metrics ranked by grade and conversion rate"
      index={0}
      className="w-full"
    >
      {/* ── Loading ── */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <Loader2
              className="animate-spin text-[#a4e6ff]"
              size={28}
              strokeWidth={1.5}
            />
          </motion.div>
        )}

        {/* ── Empty ── */}
        {!loading && attorneys.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-3"
          >
            <Users size={40} className="text-[#333539]" strokeWidth={1} />
            <p className="font-['Manrope'] text-sm text-[#bbc9cf]">
              No attorney data yet
            </p>
          </motion.div>
        )}

        {/* ── Content ── */}
        {!loading && attorneys.length > 0 && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Summary bar */}
            <SummaryBar attorneys={attorneys} />

            {/* Table wrapper */}
            <div className="overflow-x-auto rounded-lg border border-[#333539]">
              <table className="w-full border-collapse text-left">
                {/* Header */}
                <thead>
                  <tr className="bg-[#111318] border-b border-[#333539]">
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={`px-4 py-3 font-['Inter'] text-[10px] font-semibold uppercase tracking-wider text-[#bbc9cf] whitespace-nowrap select-none ${
                          col.sortable
                            ? 'cursor-pointer hover:text-[#e2e2e8] transition-colors'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.sortable && sortKey === col.key && (
                            <span className="text-[#a4e6ff]">
                              {sortDir === 'asc' ? (
                                <ChevronUp size={12} />
                              ) : (
                                <ChevronDown size={12} />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <motion.tbody
                  variants={tableVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {sorted.map((att, idx) => {
                    const isTop     = idx === 0
                    const isExpanded = expandedId === att.id
                    const { label: responseLabel, color: responseColor } =
                      formatResponseTime(att.avgResponseHours)

                    return (
                      <>
                        <motion.tr
                          key={att.id}
                          variants={rowVariants}
                          onClick={() => handleRowClick(att.id)}
                          className={`border-b border-[#333539]/60 cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-[#333539]/20'
                              : 'hover:bg-[#333539]/30'
                          } ${isTop ? 'border-l-2 border-l-[#a4e6ff]' : ''}`}
                          style={
                            isTop
                              ? { boxShadow: 'inset 4px 0 12px -4px rgba(164,230,255,0.3)' }
                              : {}
                          }
                        >
                          {/* # rank */}
                          <td className="px-4 py-3">
                            <span
                              className={`font-['Inter'] text-sm tabular-nums ${
                                isTop ? 'text-[#a4e6ff] font-bold' : 'text-[#bbc9cf]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>

                          {/* Attorney */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-['Manrope'] text-sm font-semibold text-[#e2e2e8] whitespace-nowrap">
                                {att.name}
                              </span>
                              {att.firmName && (
                                <span className="font-['Inter'] text-xs text-[#bbc9cf] mt-0.5 whitespace-nowrap">
                                  {att.firmName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Grade */}
                          <td className="px-4 py-3">
                            <GradeBadge grade={att.grade} />
                          </td>

                          {/* Leads */}
                          <td className="px-4 py-3 font-['Inter'] text-sm tabular-nums text-[#e2e2e8]">
                            {att.totalAssigned}
                          </td>

                          {/* Accepted */}
                          <td className="px-4 py-3 font-['Inter'] text-sm tabular-nums text-[#4ADE80]">
                            {att.accepted}
                          </td>

                          {/* Rejected */}
                          <td className="px-4 py-3 font-['Inter'] text-sm tabular-nums text-[#ffb4ab]">
                            {att.rejected}
                          </td>

                          {/* Conv. Rate */}
                          <td className="px-4 py-3">
                            <ConvRateCell
                              conversionRate={att.conversionRate}
                              grade={att.grade}
                            />
                          </td>

                          {/* Avg Response */}
                          <td className="px-4 py-3">
                            <span
                              className="font-['Inter'] text-sm font-semibold tabular-nums"
                              style={{ color: responseColor }}
                            >
                              {responseLabel}
                            </span>
                          </td>

                          {/* Revenue */}
                          <td className="px-4 py-3 font-['Inter'] text-sm tabular-nums text-[#4ADE80] font-semibold whitespace-nowrap">
                            {formatCurrency(att.totalRevenue)}
                          </td>

                          {/* Avg Payout */}
                          <td className="px-4 py-3 font-['Inter'] text-sm tabular-nums text-[#e2e2e8] whitespace-nowrap">
                            {formatCurrency(att.avgPayout)}
                          </td>
                        </motion.tr>

                        {/* Expandable detail row */}
                        <AnimatePresence>
                          {isExpanded && (
                            <ExpandedDetail key={`detail-${att.id}`} attorney={att} />
                          )}
                        </AnimatePresence>
                      </>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Footer count */}
            <p className="mt-3 font-['Inter'] text-xs text-[#bbc9cf]">
              {attorneys.length} attorney{attorneys.length !== 1 ? 's' : ''} — click any row to view assignments
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </ChartCard>
  )
}

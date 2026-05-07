import { supabase } from './supabase'
import { format, subDays, startOfDay, startOfWeek, startOfMonth, differenceInHours } from 'date-fns'

// ─── Formatters ──────────────────────────────────────────────────────────────

export function formatCurrency(cents) {
  if (cents == null || isNaN(cents)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatPercent(ratio) {
  if (ratio == null || isNaN(ratio)) return '0%'
  return `${(ratio * 100).toFixed(1)}%`
}

// ─── Attorney Grading ────────────────────────────────────────────────────────

export function calculateGrade(conversionRate, avgResponseHours) {
  if (conversionRate > 0.6 && avgResponseHours < 24) return 'A'
  if (conversionRate > 0.4 || avgResponseHours < 48) return 'B'
  if (conversionRate > 0.2) return 'C'
  if (conversionRate > 0.1) return 'D'
  return 'F'
}

export const GRADE_COLORS = {
  A: { text: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)' },
  B: { text: '#a4e6ff', bg: 'rgba(164, 230, 255, 0.15)' },
  C: { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
  D: { text: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
  F: { text: '#ffb4ab', bg: 'rgba(255, 180, 171, 0.15)' },
}

// ─── Funnel Data ─────────────────────────────────────────────────────────────

const FUNNEL_STAGES = ['new', 'contacted', 'qualified', 'sent_to_attorney', 'converted']

export async function fetchFunnelData() {
  const { data, error } = await supabase
    .from('leads')
    .select('status')

  if (error || !data) return []

  // Count how many leads reached each stage (cumulative: if status is "qualified",
  // they also passed through "new" and "contacted")
  const statusIndex = {}
  FUNNEL_STAGES.forEach((s, i) => { statusIndex[s] = i })

  const stageCounts = FUNNEL_STAGES.map(() => 0)

  data.forEach((lead) => {
    const idx = statusIndex[lead.status]
    if (idx != null) {
      // Count this lead at its stage and all previous stages
      for (let i = 0; i <= idx; i++) {
        stageCounts[i]++
      }
    } else if (lead.status === 'rejected' || lead.status === 'lost') {
      // Rejected/lost leads at minimum went through "new"
      stageCounts[0]++
    }
  })

  const labels = ['New Leads', 'Contacted', 'Qualified', 'Sent to Attorney', 'Converted']

  return labels.map((label, i) => ({
    label,
    count: stageCounts[i],
    dropOff: i === 0 ? null : stageCounts[i - 1] > 0
      ? ((stageCounts[i - 1] - stageCounts[i]) / stageCounts[i - 1] * 100).toFixed(1)
      : '0.0',
  }))
}

// ─── Time Series Helpers ─────────────────────────────────────────────────────

function getDateRange(range) {
  const now = new Date()
  switch (range) {
    case '7d':  return subDays(now, 7)
    case '30d': return subDays(now, 30)
    case '90d': return subDays(now, 90)
    default:    return null // all time
  }
}

function groupBy(range) {
  if (range === '7d' || range === '30d') return 'day'
  if (range === '90d') return 'week'
  return 'month'
}

function bucketDate(dateStr, grouping) {
  const d = new Date(dateStr)
  switch (grouping) {
    case 'day':   return format(startOfDay(d), 'yyyy-MM-dd')
    case 'week':  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    case 'month': return format(startOfMonth(d), 'yyyy-MM')
    default:      return format(d, 'yyyy-MM-dd')
  }
}

function formatLabel(dateStr, grouping) {
  const d = new Date(dateStr)
  switch (grouping) {
    case 'day':   return format(d, 'MMM d')
    case 'week':  return format(d, 'MMM d')
    case 'month': return format(d, 'MMM yyyy')
    default:      return format(d, 'MMM d')
  }
}

export async function fetchTimeSeriesData(range = '30d') {
  const from = getDateRange(range)
  const g = groupBy(range)

  let query = supabase.from('leads').select('created_at')
  if (from) query = query.gte('created_at', from.toISOString())

  const { data, error } = await query
  if (error || !data) return []

  const buckets = {}
  data.forEach((lead) => {
    const key = bucketDate(lead.created_at, g)
    buckets[key] = (buckets[key] || 0) + 1
  })

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, label: formatLabel(date, g), count }))
}

export async function fetchRevenueTimeSeries(range = '30d') {
  const from = getDateRange(range)
  const g = groupBy(range)

  let query = supabase
    .from('lead_assignments')
    .select('payout_date, payout_amount')
    .eq('payout_status', 'paid')

  if (from) query = query.gte('payout_date', format(from, 'yyyy-MM-dd'))

  const { data, error } = await query
  if (error || !data) return []

  const buckets = {}
  data.forEach((a) => {
    if (!a.payout_date) return
    const key = bucketDate(a.payout_date, g)
    buckets[key] = (buckets[key] || 0) + (a.payout_amount || 200000)
  })

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, label: formatLabel(date, g), amount: amount / 100 }))
}

export async function fetchConversionTimeSeries(range = '30d') {
  const from = getDateRange(range)
  const g = groupBy(range)

  let query = supabase.from('leads').select('created_at, status')
  if (from) query = query.gte('created_at', from.toISOString())

  const { data, error } = await query
  if (error || !data) return []

  const totals = {}
  const converted = {}

  data.forEach((lead) => {
    const key = bucketDate(lead.created_at, g)
    totals[key] = (totals[key] || 0) + 1
    if (lead.status === 'converted') {
      converted[key] = (converted[key] || 0) + 1
    }
  })

  return Object.entries(totals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({
      date,
      label: formatLabel(date, g),
      rate: total > 0 ? ((converted[date] || 0) / total) * 100 : 0,
    }))
}

// ─── Attorney Metrics ────────────────────────────────────────────────────────

export async function fetchAttorneyMetrics() {
  const { data: assignments, error: aErr } = await supabase
    .from('lead_assignments')
    .select('*, attorney_partners(id, name, firm_name, price_per_lead), leads(contact_name, case_type)')

  if (aErr || !assignments) return []

  const byAttorney = {}

  assignments.forEach((a) => {
    const attId = a.attorney_id
    if (!byAttorney[attId]) {
      byAttorney[attId] = {
        id: attId,
        name: a.attorney_partners?.name || 'Unknown',
        firmName: a.attorney_partners?.firm_name || '',
        totalAssigned: 0,
        accepted: 0,
        rejected: 0,
        converted: 0,
        pending: 0,
        totalRevenue: 0,
        totalPayout: 0,
        paidCount: 0,
        responseTimes: [],
        assignments: [],
      }
    }

    const att = byAttorney[attId]
    att.totalAssigned++

    if (a.outcome === 'accepted') att.accepted++
    else if (a.outcome === 'rejected') att.rejected++
    else if (a.outcome === 'converted') att.converted++
    else att.pending++

    if (a.payout_status === 'paid') {
      att.totalRevenue += a.payout_amount || 200000
      att.totalPayout += a.payout_amount || 200000
      att.paidCount++
    }

    if (a.outcome !== 'pending' && a.outcome_updated_at && a.assigned_at) {
      const hours = differenceInHours(new Date(a.outcome_updated_at), new Date(a.assigned_at))
      if (hours >= 0) att.responseTimes.push(hours)
    }

    att.assignments.push({
      id: a.id,
      leadId: a.lead_id,
      leadName: a.leads?.contact_name || 'Unknown',
      caseType: a.leads?.case_type || '',
      assignedAt: a.assigned_at,
      outcome: a.outcome,
      payoutStatus: a.payout_status,
      payoutAmount: a.payout_amount,
    })
  })

  return Object.values(byAttorney).map((att) => {
    const conversionRate = att.totalAssigned > 0
      ? (att.accepted + att.converted) / att.totalAssigned
      : 0
    const avgResponseHours = att.responseTimes.length > 0
      ? att.responseTimes.reduce((a, b) => a + b, 0) / att.responseTimes.length
      : Infinity
    const avgPayout = att.paidCount > 0 ? att.totalPayout / att.paidCount : 0

    return {
      ...att,
      conversionRate,
      avgResponseHours,
      avgPayout,
      grade: calculateGrade(conversionRate, avgResponseHours),
    }
  }).sort((a, b) => {
    // Sort by grade first (A > B > C > D > F), then by conversion rate
    const gradeOrder = { A: 0, B: 1, C: 2, D: 3, F: 4 }
    const gDiff = gradeOrder[a.grade] - gradeOrder[b.grade]
    if (gDiff !== 0) return gDiff
    return b.conversionRate - a.conversionRate
  })
}

// ─── Case Type Distribution ──────────────────────────────────────────────────

export async function fetchCaseTypeDistribution() {
  const { data, error } = await supabase
    .from('leads')
    .select('case_type')

  if (error || !data) return []

  const counts = {}
  data.forEach((lead) => {
    const type = lead.case_type || 'unknown'
    counts[type] = (counts[type] || 0) + 1
  })

  return Object.entries(counts)
    .map(([name, value]) => ({
      name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      value,
    }))
    .sort((a, b) => b.value - a.value)
}

// ─── Chart Theme ─────────────────────────────────────────────────────────────

export const CHART_THEME = {
  bg: '#1e2024',
  grid: '#333539',
  gridOpacity: 0.3,
  axis: '#bbc9cf',
  axisFont: { fontSize: 11, fontFamily: 'Inter, sans-serif', fill: '#bbc9cf' },
  tooltip: {
    bg: '#1e2024',
    border: '#333539',
    text: '#e2e2e8',
    label: '#bbc9cf',
  },
  colors: {
    accent: '#a4e6ff',
    success: '#4ADE80',
    error: '#ffb4ab',
    warning: '#fbbf24',
    purple: '#c084fc',
    orange: '#fb923c',
    sky: '#38bdf8',
    red: '#f87171',
  },
}

export const CHART_COLORS = [
  '#a4e6ff', '#4ADE80', '#ffb4ab', '#fbbf24',
  '#c084fc', '#fb923c', '#38bdf8', '#f87171',
]

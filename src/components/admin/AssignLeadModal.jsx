import { useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, UserCheck, AlertCircle } from 'lucide-react'

export function AssignLeadModal({ lead, onAssigned, onClose }) {
  const [attorneys, setAttorneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)

  const fetchEligibleAttorneys = useCallback(async () => {
    setLoading(true)

    // Fetch active attorneys whose case_types_accepted includes the lead's case_type
    const { data: allAttorneys, error: attError } = await supabase
      .from('attorney_partners')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (attError) {
      setError('Failed to load attorneys')
      setLoading(false)
      return
    }

    // Filter: attorney must accept this lead's case type
    const eligible = (allAttorneys || []).filter((att) =>
      att.case_types_accepted && att.case_types_accepted.includes(lead.case_type)
    )

    // Fetch this month's lead counts for each eligible attorney
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: assignments } = await supabase
      .from('lead_assignments')
      .select('attorney_id')
      .gte('assigned_at', monthStart)

    const counts = {}
    if (assignments) {
      assignments.forEach((a) => {
        counts[a.attorney_id] = (counts[a.attorney_id] || 0) + 1
      })
    }

    // Annotate each attorney with their monthly count and capacity status
    const annotated = eligible.map((att) => {
      const monthCount = counts[att.id] || 0
      const atCapacity = att.max_leads_per_month != null && monthCount >= att.max_leads_per_month
      return { ...att, monthCount, atCapacity }
    })

    setAttorneys(annotated)
    setLoading(false)
  }, [lead.case_type])

  useEffect(() => {
    fetchEligibleAttorneys()
  }, [fetchEligibleAttorneys])

  const handleAssign = async () => {
    if (!selectedId) return
    setAssigning(true)
    setError(null)

    const attorney = attorneys.find((a) => a.id === selectedId)
    const { data: { session } } = await supabase.auth.getSession()

    // Insert lead_assignments row
    const { error: assignError } = await supabase
      .from('lead_assignments')
      .insert({
        lead_id: lead.id,
        attorney_id: selectedId,
        assigned_by: session?.user?.id ?? null,
        outcome: 'pending',
      })

    if (assignError) {
      setError('Failed to assign lead: ' + assignError.message)
      setAssigning(false)
      return
    }

    // Update lead status to sent_to_attorney
    const { error: statusError } = await supabase
      .from('leads')
      .update({ status: 'sent_to_attorney' })
      .eq('id', lead.id)

    if (statusError) {
      setError('Assignment saved but status update failed: ' + statusError.message)
      setAssigning(false)
      return
    }

    // Log the activity
    await supabase.from('lead_activity').insert({
      lead_id: lead.id,
      action: 'assigned_to_attorney',
      performed_by: session?.user?.id ?? null,
      details: {
        attorney_id: selectedId,
        attorney_name: attorney?.name || 'Unknown',
        attorney_firm: attorney?.firm_name || null,
      },
    })

    setAssigning(false)
    onAssigned()
  }

  const formatCaseTypes = (types) => {
    if (!types || types.length === 0) return '—'
    return types.map((t) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2024] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#333539]">
          <div>
            <h2 className="text-lg font-bold text-[#e2e2e8] font-['Space_Grotesk']">
              Assign Lead to Attorney
            </h2>
            <p className="text-[#bbc9cf] text-sm font-['Manrope'] mt-1">
              {lead.contact_name} — {lead.case_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          </div>
          <button onClick={onClose} className="text-[#bbc9cf] hover:text-[#e2e2e8] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded-lg">
              <AlertCircle size={16} className="text-[#ffb4ab] flex-shrink-0" />
              <span className="text-[#ffb4ab] text-sm font-['Manrope']">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-[#bbc9cf] font-['Manrope'] text-center py-8">Loading eligible attorneys...</div>
          ) : attorneys.length === 0 ? (
            <div className="text-[#bbc9cf] text-center py-8 font-['Manrope']">
              No eligible attorneys found for this case type. Add an attorney who accepts{' '}
              <span className="text-[#a4e6ff]">
                {lead.case_type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>{' '}
              cases first.
            </div>
          ) : (
            <div className="space-y-2">
              {attorneys.map((att) => (
                <button
                  key={att.id}
                  onClick={() => !att.atCapacity && setSelectedId(att.id)}
                  disabled={att.atCapacity}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedId === att.id
                      ? 'border-[#a4e6ff] bg-[#a4e6ff]/10'
                      : att.atCapacity
                        ? 'border-[#333539] bg-[#333539]/30 opacity-50 cursor-not-allowed'
                        : 'border-[#333539] bg-[#333539]/50 hover:border-[#a4e6ff]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#e2e2e8] font-['Manrope'] font-medium">{att.name}</div>
                      {att.firm_name && (
                        <div className="text-[#bbc9cf] text-sm font-['Manrope']">{att.firm_name}</div>
                      )}
                      <div className="text-[#bbc9cf] text-xs font-['Manrope'] mt-1">
                        {formatCaseTypes(att.case_types_accepted)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-['Manrope'] ${att.atCapacity ? 'text-[#ffb4ab]' : 'text-[#e2e2e8]'}`}>
                        {att.monthCount} / {att.max_leads_per_month || '∞'}
                      </div>
                      <div className="text-[#bbc9cf] text-xs font-['Manrope']">this month</div>
                      {att.atCapacity && (
                        <div className="text-[#ffb4ab] text-xs font-['Manrope'] mt-1">At capacity</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          {attorneys.length > 0 && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAssign}
                disabled={!selectedId || assigning}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[#a4e6ff] to-[#00d1ff] text-[#111318] font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-['Space_Grotesk']"
              >
                <UserCheck size={18} />
                {assigning ? 'Assigning...' : 'Assign Lead'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#333539] text-[#bbc9cf] rounded-lg hover:text-[#e2e2e8] transition-colors font-['Manrope']"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

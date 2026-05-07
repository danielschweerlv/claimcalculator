import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

const actionLabels = {
  created: 'Lead submitted',
  viewed: 'Lead viewed',
  status_changed: 'Status changed',
  note_added: 'Note added',
  exported: 'Lead exported',
  sent_to_attorney: 'Sent to attorney',
  attorney_response: 'Attorney responded',
  assigned_to_attorney: 'Assigned to attorney',
  outcome_changed: 'Outcome changed',
  payout_status_changed: 'Payout status changed',
}

export function ActivityLog({ leadId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('lead_activity')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error) {
      setActivities(data || [])
    }
    setLoading(false)
  }, [leadId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  if (loading) {
    return <div className="text-[#bbc9cf] text-sm font-['Manrope']">Loading...</div>
  }

  if (activities.length === 0) {
    return <div className="text-[#bbc9cf] text-sm font-['Manrope']">No activity yet</div>
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="text-sm">
          <div className="text-[#e2e2e8] font-['Manrope']">
            {actionLabels[activity.action] || activity.action}
          </div>
          {activity.details?.from && activity.details?.to && (
            <div className="text-[#bbc9cf] font-['Manrope']">
              {activity.details.from} → {activity.details.to}
            </div>
          )}
          <div className="text-[#bbc9cf] text-xs font-['Manrope']">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  )
}

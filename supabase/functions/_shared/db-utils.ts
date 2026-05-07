import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type BackendJob = {
  id: string;
  job_type: string;
  status: string;
  lead_id?: string | null;
  payload?: Record<string, unknown> | null;
};

function isMissingRpc(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("Could not find the function") ||
    message.includes("function public.") ||
    message.includes("PGRST202");
}

export async function refreshAssignmentRollups(
  supabase: SupabaseClient,
  input: { leadId?: string | null; attorneyId?: string | null },
) {
  await Promise.all([
    input.leadId
      ? supabase.rpc("refresh_lead_assignment_summary", {
        p_lead_id: input.leadId,
      }).then(({ error }) => {
        if (error && !isMissingRpc(error)) {
          console.error("refresh_lead_assignment_summary failed", error);
        }
      })
      : Promise.resolve(),
    input.attorneyId
      ? supabase.rpc("refresh_attorney_capacity", {
        p_attorney_id: input.attorneyId,
      }).then(({ error }) => {
        if (error && !isMissingRpc(error)) {
          console.error("refresh_attorney_capacity failed", error);
        }
      })
      : Promise.resolve(),
  ]);
}

export async function claimBackendJobs(
  supabase: SupabaseClient,
  input: { jobType: string; limit: number; lockedBy: string },
): Promise<BackendJob[]> {
  const { data, error } = await supabase.rpc("claim_backend_jobs", {
    p_job_type: input.jobType,
    p_limit: input.limit,
    p_locked_by: input.lockedBy,
  });

  if (!error) return (data ?? []) as BackendJob[];
  if (!isMissingRpc(error)) throw new Error("backend job claim failed");

  const { data: jobs, error: lookupError } = await supabase
    .from("backend_jobs")
    .select("*")
    .eq("job_type", input.jobType)
    .in("status", ["queued", "failed"])
    .lte("run_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(input.limit);
  if (lookupError) throw new Error("backend job lookup failed");

  const claimed: BackendJob[] = [];
  for (const job of jobs ?? []) {
    const { data: updated, error: updateError } = await supabase
      .from("backend_jobs")
      .update({
        status: "processing",
        locked_at: new Date().toISOString(),
        locked_by: input.lockedBy,
        attempts: (job.attempts ?? 0) + 1,
      })
      .eq("id", job.id)
      .in("status", ["queued", "failed"])
      .select("*")
      .maybeSingle();
    if (!updateError && updated) claimed.push(updated as BackendJob);
  }
  return claimed;
}

export async function completeBackendJob(
  supabase: SupabaseClient,
  jobId: string,
  payload?: Record<string, unknown>,
) {
  const { error } = await supabase.rpc("complete_backend_job", {
    p_job_id: jobId,
    p_payload: payload ?? null,
  });
  if (!error) return;
  if (!isMissingRpc(error)) throw new Error("backend job complete failed");

  const { error: updateError } = await supabase
    .from("backend_jobs")
    .update({
      status: "completed",
      locked_at: null,
      locked_by: null,
      last_error: null,
      payload,
    })
    .eq("id", jobId);
  if (updateError) throw new Error("backend job complete failed");
}

export async function failBackendJob(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
) {
  const { error } = await supabase.rpc("fail_backend_job", {
    p_job_id: jobId,
    p_error: errorMessage,
    p_retry_after: "00:15:00",
  });
  if (!error) return;
  if (!isMissingRpc(error)) throw new Error("backend job fail update failed");

  const { error: updateError } = await supabase
    .from("backend_jobs")
    .update({
      status: "failed",
      locked_at: null,
      locked_by: null,
      last_error: errorMessage.slice(0, 2000),
      run_after: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    .eq("id", jobId);
  if (updateError) throw new Error("backend job fail update failed");
}

export async function claimOutboundMessages(
  supabase: SupabaseClient,
  input: { limit: number; lockedBy: string },
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase.rpc("claim_outbound_messages", {
    p_limit: input.limit,
    p_locked_by: input.lockedBy,
  });

  if (!error) return (data ?? []) as Array<{ id: string }>;
  if (!isMissingRpc(error)) throw new Error("outbound message claim failed");

  const { data: messages, error: lookupError } = await supabase
    .from("outbound_messages")
    .select("id")
    .in("delivery_status", ["queued", "failed"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(input.limit);
  if (lookupError) throw new Error("outbound queue lookup failed");
  return messages ?? [];
}

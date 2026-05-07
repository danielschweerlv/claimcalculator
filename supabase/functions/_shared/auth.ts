import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export type Actor =
  | {
    actorType: "admin";
    userId: string;
    email: string | null;
    role: string | null;
  }
  | { actorType: "system"; userId: null; email: null; role: "internal" };

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice("bearer ".length).trim();
}

export async function requireAdmin(
  req: Request,
  supabase: SupabaseClient,
): Promise<Actor> {
  const token = bearerToken(req);
  if (!token) throw new Error("unauthorized");

  const { data: userData, error: userError } = await supabase.auth.getUser(
    token,
  );
  const user = userData?.user;
  if (userError || !user) throw new Error("unauthorized");

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error("forbidden");

  return {
    actorType: "admin",
    userId: user.id,
    email: profile.email ?? user.email ?? null,
    role: profile.role ?? null,
  };
}

export async function requireAdminOrInternal(
  req: Request,
  supabase: SupabaseClient,
): Promise<Actor> {
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (
    internalSecret && req.headers.get("x-internal-secret") === internalSecret
  ) {
    return { actorType: "system", userId: null, email: null, role: "internal" };
  }

  return await requireAdmin(req, supabase);
}

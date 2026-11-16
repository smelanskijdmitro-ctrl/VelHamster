import { createClient } from "@/lib/supabase/server";
export async function getViewer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, isAdmin: false };
  const { data: profile } = await supabase.from("profiles").select("id, username, role, avatar_url").eq("id", user.id).maybeSingle();
  return { supabase, user, profile, isAdmin: profile?.role === "admin" };
}
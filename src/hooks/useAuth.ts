import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;

  useEffect(() => {
    if (!uid) {
      setRoles([]);
      return;
    }
    let alive = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .then(({ data }) => {
        if (alive) setRoles(((data ?? []) as { role: string }[]).map((r) => r.role));
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  const user: User | null = session?.user ?? null;
  return {
    session,
    user,
    roles,
    isAdmin: roles.includes("admin"),
    isStaff: roles.length > 0,
    loading,
  };
}

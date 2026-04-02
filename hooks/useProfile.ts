import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Profile } from "@/types/workout";

async function fetchProfile(userId: string): Promise<Profile | null> {
  const [{ data, error }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (error) throw error;
  if (!data) return null;
  // full_name은 auth user_metadata에서 보완 (PGRST204 스키마 캐시 이슈 우회)
  const full_name = data.full_name ?? user?.user_metadata?.full_name ?? undefined;
  return { ...data, full_name };
}

async function upsertProfile(userId: string, updates: Partial<Omit<Profile, "id" | "created_at">>): Promise<Profile> {
  const { full_name, ...rest } = updates;

  // full_name은 auth user_metadata에 저장 (profiles 스키마 캐시 이슈 우회)
  if (full_name !== undefined) {
    const { error } = await supabase.auth.updateUser({ data: { full_name } });
    if (error) throw error;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...rest, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return { ...data, full_name: full_name ?? data.full_name };
}

export function useProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Omit<Profile, "id" | "created_at">>) =>
      upsertProfile(user!.id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

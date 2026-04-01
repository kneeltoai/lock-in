import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { CardioLog, CardioType } from "@/types/workout";

async function fetchCardioLogs(userId: string): Promise<CardioLog[]> {
  const { data, error } = await supabase
    .from("cardio_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function addCardioLog(
  userId: string,
  log: Omit<CardioLog, "id" | "user_id" | "created_at">
): Promise<CardioLog> {
  const { data, error } = await supabase
    .from("cardio_logs")
    .insert({ user_id: userId, ...log })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCardioLog(id: string): Promise<void> {
  const { error } = await supabase.from("cardio_logs").delete().eq("id", id);
  if (error) throw error;
}

// ── 훅 ──────────────────────────────────────────────────

export function useCardioLogs() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["cardio-logs", user?.id],
    queryFn: () => fetchCardioLogs(user!.id),
    enabled: !!user,
  });
}

export function useAddCardioLog() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (log: Omit<CardioLog, "id" | "user_id" | "created_at">) =>
      addCardioLog(user!.id, log),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cardio-logs"] }),
  });
}

export function useDeleteCardioLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCardioLog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cardio-logs"] }),
  });
}

// ── 상수 ────────────────────────────────────────────────

export const CARDIO_TYPE_LABELS: Record<CardioType, string> = {
  running: "러닝",
  cycling: "사이클",
  swimming: "수영",
  walking: "걷기",
  jump_rope: "줄넘기",
  rowing: "로잉",
  other: "기타",
};

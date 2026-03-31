import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export interface PlateConfig {
  id: string;
  user_id: string;
  bar_weight_kg: number;
  plates: PlateSet[];
  updated_at: string;
}

export interface PlateSet {
  weight_kg: number;
  count: number;
}

export interface OverloadSettings {
  id: string;
  user_id: string;
  exercise_id: string;
  increment_kg: number;
  sessions_before_increment: number;
  updated_at: string;
}

// ── 원판 계산 유틸 ─────────────────────────────────────

/**
 * 목표 총 무게(kg)를 위해 한쪽에 올릴 원판 조합을 반환.
 * 사용 가능한 원판 무게 기준으로 최적 조합 계산.
 */
export function calculatePlates(
  targetWeightKg: number,
  barWeightKg: number,
  availablePlates: PlateSet[]
): { weight: number; count: number }[] {
  const perSide = (targetWeightKg - barWeightKg) / 2;
  if (perSide <= 0) return [];

  // 내림차순 정렬
  const sorted = [...availablePlates]
    .filter((p) => p.count >= 2)
    .sort((a, b) => b.weight_kg - a.weight_kg);

  const result: { weight: number; count: number }[] = [];
  let remaining = perSide;

  for (const plate of sorted) {
    const maxPairs = Math.floor(plate.count / 2);
    const usedPairs = Math.min(maxPairs, Math.floor(remaining / plate.weight_kg));
    if (usedPairs > 0) {
      result.push({ weight: plate.weight_kg, count: usedPairs });
      remaining -= usedPairs * plate.weight_kg;
      if (remaining < 0.01) break;
    }
  }

  return result;
}

/**
 * 다음 과부하 무게 계산.
 * 최근 N세션에서 목표 횟수를 달성했으면 increment_kg 추가.
 */
export function suggestNextWeight(
  lastWeight: number,
  incrementKg: number
): number {
  return Math.round((lastWeight + incrementKg) * 4) / 4; // 0.25kg 단위 반올림
}

// ── Supabase 훅 ──────────────────────────────────────────

async function fetchPlateConfig(userId: string): Promise<PlateConfig | null> {
  const { data, error } = await supabase
    .from("plate_configs")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertPlateConfig(
  userId: string,
  barWeightKg: number,
  plates: PlateSet[]
): Promise<PlateConfig> {
  const { data, error } = await supabase
    .from("plate_configs")
    .upsert(
      { user_id: userId, bar_weight_kg: barWeightKg, plates, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function fetchOverloadSettings(userId: string): Promise<OverloadSettings[]> {
  const { data, error } = await supabase
    .from("overload_settings")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

async function upsertOverloadSetting(
  userId: string,
  exerciseId: string,
  incrementKg: number,
  sessionsBeforeIncrement: number
): Promise<OverloadSettings> {
  const { data, error } = await supabase
    .from("overload_settings")
    .upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        increment_kg: incrementKg,
        sessions_before_increment: sessionsBeforeIncrement,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,exercise_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function usePlateConfig() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["plate-config", user?.id],
    queryFn: () => fetchPlateConfig(user!.id),
    enabled: !!user,
  });
}

export function useUpsertPlateConfig() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ barWeightKg, plates }: { barWeightKg: number; plates: PlateSet[] }) =>
      upsertPlateConfig(user!.id, barWeightKg, plates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plate-config"] }),
  });
}

export function useOverloadSettings() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["overload-settings", user?.id],
    queryFn: () => fetchOverloadSettings(user!.id),
    enabled: !!user,
  });
}

export function useUpsertOverloadSetting() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      exerciseId,
      incrementKg,
      sessionsBeforeIncrement,
    }: {
      exerciseId: string;
      incrementKg: number;
      sessionsBeforeIncrement: number;
    }) => upsertOverloadSetting(user!.id, exerciseId, incrementKg, sessionsBeforeIncrement),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overload-settings"] }),
  });
}

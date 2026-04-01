import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export interface ExerciseVolumeStat {
  date: string;
  volume: number; // kg × reps 합계
  bestOneRM: number; // 해당 날짜의 최고 1RM
}

export interface ExerciseStat {
  exerciseId: string;
  exerciseName: string;
  bestOneRM: number;        // 전체 기간 최고 1RM
  bestWeight: number;       // 최고 중량
  lastWeight: number;       // 마지막 세션 중량
  lastReps: number;         // 마지막 세션 횟수
  history: ExerciseVolumeStat[]; // 날짜별 볼륨 (오름차순, 최근 10개)
}

/** Epley 공식: 1RM = w × (1 + r/30) */
function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

async function fetchExerciseStats(userId: string): Promise<ExerciseStat[]> {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`
      date,
      session_exercises (
        exercise_id,
        exercise:exercises (id, name),
        sets:exercise_sets (weight_kg, reps, is_completed)
      )
    `)
    .eq("user_id", userId)
    .gte("date", sinceStr)
    .order("date", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  // exercise_id → { name, dailyMap: { date → { volume, bestOneRM } } }
  const map = new Map<
    string,
    {
      name: string;
      dailyMap: Map<string, { volume: number; bestOneRM: number }>;
      allSets: { weight: number; reps: number; date: string }[];
    }
  >();

  for (const session of data) {
    for (const se of session.session_exercises ?? []) {
      if (!se.exercise_id || !se.exercise) continue;
      const exId = se.exercise_id;
      const exName = (se.exercise as { id: string; name: string }).name;

      if (!map.has(exId)) {
        map.set(exId, { name: exName, dailyMap: new Map(), allSets: [] });
      }
      const entry = map.get(exId)!;

      for (const set of se.sets ?? []) {
        if (!set.is_completed || !set.weight_kg || !set.reps) continue;
        const w = set.weight_kg as number;
        const r = set.reps as number;

        const daily = entry.dailyMap.get(session.date) ?? { volume: 0, bestOneRM: 0 };
        daily.volume += w * r;
        daily.bestOneRM = Math.max(daily.bestOneRM, epley(w, r));
        entry.dailyMap.set(session.date, daily);
        entry.allSets.push({ weight: w, reps: r, date: session.date });
      }
    }
  }

  const result: ExerciseStat[] = [];

  for (const [exId, entry] of map.entries()) {
    if (entry.allSets.length === 0) continue;

    const allOnermValues = entry.allSets.map((s) => epley(s.weight, s.reps));
    const bestOneRM = Math.max(...allOnermValues);
    const bestWeight = Math.max(...entry.allSets.map((s) => s.weight));

    // 마지막 세션 데이터
    const lastSet = entry.allSets[entry.allSets.length - 1];

    // 날짜별 볼륨 히스토리 (최근 10회)
    const history: ExerciseVolumeStat[] = Array.from(entry.dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([date, val]) => ({ date, volume: val.volume, bestOneRM: val.bestOneRM }));

    result.push({
      exerciseId: exId,
      exerciseName: entry.name,
      bestOneRM: Math.round(bestOneRM * 10) / 10,
      bestWeight,
      lastWeight: lastSet.weight,
      lastReps: lastSet.reps,
      history,
    });
  }

  // 볼륨 내림차순 정렬 (자주 하는 운동 위로)
  result.sort((a, b) => b.history.length - a.history.length);

  return result;
}

export function useExerciseStats() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["exercise-stats", user?.id],
    queryFn: () => fetchExerciseStats(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

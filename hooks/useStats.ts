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

// ── 주간 스탯 ────────────────────────────────────────────

export interface WeeklyStats {
  weeklyVolume: number;  // 이번 주 총 kg×reps
  weeklyDays: number;    // 이번 주 운동일 수
  streakDays: number;    // 연속 달성일
}

async function fetchWeeklyStats(userId: string): Promise<WeeklyStats> {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 이번 주 월요일
  const dow = today.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMon);
  const mondayStr = monday.toISOString().split("T")[0];

  // 스트릭 계산용 1년치
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoStr = yearAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`
      date,
      ended_at,
      session_exercises (
        sets:exercise_sets (weight_kg, reps, is_completed)
      )
    `)
    .eq("user_id", userId)
    .gte("date", yearAgoStr)
    .lte("date", todayStr);

  if (error) throw error;
  const sessions = (data ?? []) as Array<{
    date: string;
    ended_at: string | null;
    session_exercises: Array<{
      sets: Array<{ weight_kg: number | null; reps: number | null; is_completed: boolean }>;
    }>;
  }>;

  let weeklyVolume = 0;
  const weeklyDates = new Set<string>();
  const completedDates = new Set<string>();

  for (const session of sessions) {
    if (session.ended_at) completedDates.add(session.date);
    if (session.date >= mondayStr) {
      weeklyDates.add(session.date);
      for (const se of session.session_exercises) {
        for (const s of se.sets) {
          if (s.is_completed && s.weight_kg && s.reps) {
            weeklyVolume += s.weight_kg * s.reps;
          }
        }
      }
    }
  }

  // 연속 달성일: 오늘 미완료면 어제부터 역산
  let streak = 0;
  const cursor = new Date(today);
  if (!completedDates.has(todayStr)) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 366; i++) {
    const d = cursor.toISOString().split("T")[0];
    if (!completedDates.has(d)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    weeklyVolume: Math.round(weeklyVolume),
    weeklyDays: weeklyDates.size,
    streakDays: streak,
  };
}

export function useWeeklyStats() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["weekly-stats", user?.id],
    queryFn: () => fetchWeeklyStats(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

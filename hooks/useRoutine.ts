import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export interface WeeklyRoutine {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  routine_exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  day_of_week: number; // 0=일, 1=월, ..., 6=토
  order_index: number;
  exercise?: { id: string; name: string; muscle_group: string };
}

// ── 조회 ────────────────────────────────────────────────

async function fetchRoutines(userId: string): Promise<WeeklyRoutine[]> {
  const { data, error } = await supabase
    .from("weekly_routines")
    .select(`
      *,
      routine_exercises (
        *,
        exercise:exercises (id, name, muscle_group)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── 뮤테이션 ───────────────────────────────────────────

async function createRoutine(userId: string, name: string): Promise<WeeklyRoutine> {
  const { data, error } = await supabase
    .from("weekly_routines")
    .insert({ user_id: userId, name, is_active: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function setActiveRoutine(userId: string, routineId: string): Promise<void> {
  await supabase
    .from("weekly_routines")
    .update({ is_active: false })
    .eq("user_id", userId);
  const { error } = await supabase
    .from("weekly_routines")
    .update({ is_active: true })
    .eq("id", routineId);
  if (error) throw error;
}

async function addRoutineExercise(
  routineId: string,
  exerciseId: string,
  dayOfWeek: number,
  orderIndex: number
): Promise<RoutineExercise> {
  const { data, error } = await supabase
    .from("routine_exercises")
    .insert({ routine_id: routineId, exercise_id: exerciseId, day_of_week: dayOfWeek, order_index: orderIndex })
    .select("*, exercise:exercises(id, name, muscle_group)")
    .single();
  if (error) throw error;
  return data;
}

async function removeRoutineExercise(id: string): Promise<void> {
  const { error } = await supabase.from("routine_exercises").delete().eq("id", id);
  if (error) throw error;
}

/**
 * 지정한 주 수만큼 workout_sessions를 루틴 기반으로 자동 생성.
 * 이미 세션이 있는 날짜는 upsert로 건드리지 않음.
 */
async function generateRoutineSessions(userId: string, routine: WeeklyRoutine, weeks: number): Promise<void> {
  if (!routine.routine_exercises?.length) return;

  const today = new Date();
  const sessions: { user_id: string; date: string; title: string }[] = [];

  for (let week = 0; week < weeks; week++) {
    for (const re of routine.routine_exercises) {
      const d = new Date(today);
      const diff = re.day_of_week - today.getDay() + week * 7;
      d.setDate(today.getDate() + diff);
      if (d < today && week === 0) continue;
      const date = d.toISOString().split("T")[0];
      sessions.push({ user_id: userId, date, title: routine.name });
    }
  }

  const unique = [...new Map(sessions.map((s) => [s.date, s])).values()];

  const { error } = await supabase
    .from("workout_sessions")
    .upsert(unique, { onConflict: "user_id,date", ignoreDuplicates: true });
  if (error) throw error;
}

// ── 훅 ──────────────────────────────────────────────────

export function useRoutines() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["routines", user?.id],
    queryFn: () => fetchRoutines(user!.id),
    enabled: !!user,
  });
}

export function useCreateRoutine() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createRoutine(user!.id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useSetActiveRoutine() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routineId: string) => setActiveRoutine(user!.id, routineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useAddRoutineExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      routineId,
      exerciseId,
      dayOfWeek,
      orderIndex,
    }: {
      routineId: string;
      exerciseId: string;
      dayOfWeek: number;
      orderIndex: number;
    }) => addRoutineExercise(routineId, exerciseId, dayOfWeek, orderIndex),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useRemoveRoutineExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeRoutineExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useGenerateRoutineSessions() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ routine, weeks }: { routine: WeeklyRoutine; weeks: number }) =>
      generateRoutineSessions(user!.id, routine, weeks),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions-month"] }),
  });
}

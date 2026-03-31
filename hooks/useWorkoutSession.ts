import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { WorkoutSession, SessionExercise, ExerciseSet } from "@/types/workout";

// ── 조회 ────────────────────────────────────────────────

async function fetchSessionByDate(userId: string, date: string): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      session_exercises (
        *,
        exercise:exercises (*),
        sets:exercise_sets (*)
      )
    `)
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchSessionsByMonth(userId: string, year: number, month: number): Promise<WorkoutSession[]> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-31`;
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, date, title")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to);
  if (error) throw error;
  return data ?? [];
}

// ── 세션 뮤테이션 ─────────────────────────────────────────

async function upsertSession(userId: string, date: string): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .upsert({ user_id: userId, date }, { onConflict: "user_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function addExerciseToSession(sessionId: string, exerciseId: string, orderIndex: number): Promise<SessionExercise> {
  const { data, error } = await supabase
    .from("session_exercises")
    .insert({ session_id: sessionId, exercise_id: exerciseId, order_index: orderIndex })
    .select("*, exercise:exercises(*)")
    .single();
  if (error) throw error;
  return data;
}

async function addSet(sessionExerciseId: string, set: Omit<ExerciseSet, "id" | "session_exercise_id" | "created_at">): Promise<ExerciseSet> {
  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({ session_exercise_id: sessionExerciseId, ...set })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateSet(setId: string, updates: Partial<Pick<ExerciseSet, "weight_kg" | "reps" | "equipment" | "is_completed">>): Promise<ExerciseSet> {
  const { data, error } = await supabase
    .from("exercise_sets")
    .update(updates)
    .eq("id", setId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteSet(setId: string): Promise<void> {
  const { error } = await supabase.from("exercise_sets").delete().eq("id", setId);
  if (error) throw error;
}

// ── 훅 ──────────────────────────────────────────────────

export function useSessionByDate(date: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["session", date],
    queryFn: () => fetchSessionByDate(user!.id, date),
    enabled: !!user,
  });
}

export function useSessionsByMonth(year: number, month: number) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["sessions-month", year, month],
    queryFn: () => fetchSessionsByMonth(user!.id, year, month),
    enabled: !!user,
  });
}

export function useUpsertSession() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => upsertSession(user!.id, date),
    onSuccess: (_, date) => {
      qc.invalidateQueries({ queryKey: ["session", date] });
    },
  });
}

export function useAddExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      exerciseId,
      orderIndex,
    }: {
      sessionId: string;
      exerciseId: string;
      orderIndex: number;
    }) => addExerciseToSession(sessionId, exerciseId, orderIndex),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useAddSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionExerciseId,
      set,
    }: {
      sessionExerciseId: string;
      set: Omit<ExerciseSet, "id" | "session_exercise_id" | "created_at">;
    }) => addSet(sessionExerciseId, set),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useUpdateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      setId,
      updates,
    }: {
      setId: string;
      updates: Partial<Pick<ExerciseSet, "weight_kg" | "reps" | "equipment" | "is_completed">>;
    }) => updateSet(setId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => deleteSet(setId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Exercise, MuscleGroup } from "@/types/workout";

async function fetchExercises(userId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .or(`is_custom.eq.false,user_id.eq.${userId}`)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

async function createExercise(
  userId: string,
  name: string,
  muscleGroup: MuscleGroup
): Promise<Exercise> {
  const { data, error } = await supabase
    .from("exercises")
    .insert({ user_id: userId, name: name.trim(), muscle_group: muscleGroup, is_custom: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
}

// ── 훅 ──────────────────────────────────────────────────

export function useExercises() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["exercises", user?.id],
    queryFn: () => fetchExercises(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
}

export function useExercisesByMuscle(muscleGroup: MuscleGroup | null) {
  const { data: exercises, ...rest } = useExercises();
  const filtered = muscleGroup
    ? (exercises ?? []).filter((e) => e.muscle_group === muscleGroup)
    : (exercises ?? []);
  return { data: filtered, ...rest };
}

export function useCreateExercise() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, muscleGroup }: { name: string; muscleGroup: MuscleGroup }) =>
      createExercise(user!.id, name, muscleGroup),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Exercise, MuscleGroup } from "@/types/workout";

async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: fetchExercises,
    staleTime: Infinity, // 운동 종목은 자주 바뀌지 않음
  });
}

export function useExercisesByMuscle(muscleGroup: MuscleGroup | null) {
  const { data: exercises, ...rest } = useExercises();
  const filtered = muscleGroup
    ? (exercises ?? []).filter((e) => e.muscle_group === muscleGroup)
    : (exercises ?? []);
  return { data: filtered, ...rest };
}

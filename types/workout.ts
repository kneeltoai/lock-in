export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "other";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "cardio"
  | "full_body";

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  is_custom: boolean;
  user_id?: string;
  created_at: string;
}

export interface ExerciseSet {
  id: string;
  session_exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  equipment: Equipment;
  is_completed: boolean;
  created_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  notes?: string;
  exercise?: Exercise;
  sets?: ExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  notes?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  session_exercises?: SessionExercise[];
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  weight_unit: "kg" | "lbs";
  created_at: string;
  updated_at: string;
}

export interface BodyRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  weight_kg?: number;
  photo_url?: string;
  notes?: string;
  created_at: string;
}

export type CardioType =
  | "running"
  | "cycling"
  | "swimming"
  | "walking"
  | "jump_rope"
  | "rowing"
  | "other";

export interface CardioLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  cardio_type: CardioType;
  duration_min: number;
  distance_km?: number | null;
  calories?: number | null;
  notes?: string | null;
  created_at: string;
}

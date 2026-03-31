import { create } from "zustand";
import { MuscleGroup } from "@/types/workout";

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

interface WorkoutState {
  selectedDate: string;
  selectedMuscleGroup: MuscleGroup | null;
  activeSessionId: string | null;
  setSelectedDate: (date: string) => void;
  setSelectedMuscleGroup: (group: MuscleGroup | null) => void;
  setActiveSessionId: (id: string | null) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  selectedDate: todayString(),
  selectedMuscleGroup: null,
  activeSessionId: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedMuscleGroup: (group) => set({ selectedMuscleGroup: group }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
}));

import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useExercisesByMuscle } from "@/hooks/useExercises";
import { useUpsertSession, useAddExercise, useSessionByDate } from "@/hooks/useWorkoutSession";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Exercise } from "@/types/workout";

const MUSCLE_LABELS: Record<string, string> = {
  chest: "가슴", back: "등", shoulders: "어깨", biceps: "이두",
  triceps: "삼두", core: "복근", quads: "대퇴사두", hamstrings: "햄스트링",
  glutes: "둔근", calves: "종아리", cardio: "유산소", full_body: "전신",
};

export default function ExerciseSelectScreen() {
  const { selectedDate, selectedMuscleGroup, setActiveSessionId } = useWorkoutStore();
  const { data: exercises = [], isLoading } = useExercisesByMuscle(selectedMuscleGroup);
  const { data: existingSession } = useSessionByDate(selectedDate);
  const upsertSession = useUpsertSession();
  const addExercise = useAddExercise();

  const handleSelect = async (exercise: Exercise) => {
    // 세션 없으면 생성
    let sessionId = existingSession?.id;
    if (!sessionId) {
      const session = await upsertSession.mutateAsync(selectedDate);
      sessionId = session.id;
      setActiveSessionId(sessionId);
    }

    const currentCount = existingSession?.session_exercises?.length ?? 0;
    await addExercise.mutateAsync({
      sessionId,
      exerciseId: exercise.id,
      orderIndex: currentCount,
    });

    router.push("/(app)/workout/session");
  };

  const isSubmitting = upsertSession.isPending || addExercise.isPending;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-14 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-base">← 뒤로</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-white text-xl font-bold">
            {selectedMuscleGroup ? MUSCLE_LABELS[selectedMuscleGroup] : "운동"} 선택
          </Text>
          <Text className="text-zinc-500 text-sm">{selectedDate}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-8" />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-surface border border-border rounded-2xl px-5 py-4 flex-row items-center justify-between"
              onPress={() => handleSelect(item)}
              disabled={isSubmitting}
            >
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">{item.name}</Text>
                {item.is_custom && (
                  <Text className="text-primary text-xs mt-0.5">커스텀</Text>
                )}
              </View>
              {isSubmitting ? (
                <ActivityIndicator color="#6366f1" size="small" />
              ) : (
                <Text className="text-zinc-500 text-lg">+</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Text className="text-zinc-500 text-base">운동 종목이 없습니다.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

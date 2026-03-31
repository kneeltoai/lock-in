import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useRoutines, useAddRoutineExercise, useRemoveRoutineExercise } from "@/hooks/useRoutine";
import { useExercises } from "@/hooks/useExercises";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function RoutineEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: routines = [] } = useRoutines();
  const routine = routines.find((r) => r.id === id);

  const { data: exercises = [] } = useExercises();
  const addExercise = useAddRoutineExercise();
  const removeExercise = useRemoveRoutineExercise();

  const [pickerDay, setPickerDay] = useState<number | null>(null);

  if (!routine) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  // 요일별 운동 그루핑
  const byDay: Record<number, typeof routine.routine_exercises> = {};
  for (const re of routine.routine_exercises ?? []) {
    if (!byDay[re.day_of_week]) byDay[re.day_of_week] = [];
    byDay[re.day_of_week]!.push(re);
  }

  const handleAddExercise = async (exerciseId: string) => {
    if (pickerDay === null) return;
    const dayExercises = byDay[pickerDay] ?? [];
    await addExercise.mutateAsync({
      routineId: routine.id,
      exerciseId,
      dayOfWeek: pickerDay,
      orderIndex: dayExercises.length,
    });
    setPickerDay(null);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="pt-14 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-base">← 뒤로</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">{routine.name}</Text>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-32">
        {DAYS.map((dayLabel, dayIndex) => {
          const dayExercises = byDay[dayIndex] ?? [];
          return (
            <View key={dayIndex} className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-semibold text-base">{dayLabel}요일</Text>
                <TouchableOpacity
                  onPress={() => setPickerDay(dayIndex)}
                  className="bg-surface border border-border rounded-lg px-3 py-1"
                >
                  <Text className="text-primary text-sm">+ 추가</Text>
                </TouchableOpacity>
              </View>

              {dayExercises.length === 0 ? (
                <View className="bg-surface border border-dashed border-border rounded-xl py-4 items-center">
                  <Text className="text-zinc-600 text-sm">휴식일</Text>
                </View>
              ) : (
                dayExercises.map((re) => (
                  <View
                    key={re.id}
                    className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
                  >
                    <Text className="text-white text-sm">{re.exercise?.name ?? "운동"}</Text>
                    <TouchableOpacity onPress={() => removeExercise.mutate(re.id)}>
                      <Text className="text-zinc-600">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={pickerDay !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-3xl pt-4 pb-8" style={{ maxHeight: "70%" }}>
            <View className="flex-row items-center justify-between px-6 pb-4 border-b border-border">
              <Text className="text-white font-bold text-lg">
                {pickerDay !== null ? DAYS[pickerDay] : ""}요일 운동 추가
              </Text>
              <TouchableOpacity onPress={() => setPickerDay(null)}>
                <Text className="text-zinc-400 text-base">닫기</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-3.5 border-b border-border flex-row items-center justify-between"
                  onPress={() => handleAddExercise(item.id)}
                  disabled={addExercise.isPending}
                >
                  <Text className="text-white text-sm">{item.name}</Text>
                  <Text className="text-zinc-500 text-xs">{item.muscle_group}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

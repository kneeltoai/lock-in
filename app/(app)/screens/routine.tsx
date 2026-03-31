import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useRoutines } from "@/hooks/useRoutine";
import { useWorkoutStore } from "@/stores/workoutStore";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function RoutineScreen() {
  const today = new Date();
  const todayLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${DAYS[today.getDay()]}요일`;
  const { setSelectedDate } = useWorkoutStore();

  const { data: routines = [], isLoading } = useRoutines();
  const activeRoutine = routines.find((r) => r.is_active);

  // 오늘 요일에 배정된 운동
  const todayExercises = (activeRoutine?.routine_exercises ?? []).filter(
    (re) => re.day_of_week === today.getDay()
  );

  const handleStartWorkout = () => {
    setSelectedDate(today.toISOString().split("T")[0]);
    router.push("/(app)/workout/session");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-4">
      {/* Header */}
      <View className="mb-6 flex-row items-start justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">오늘의 루틴</Text>
          <Text className="text-zinc-400 text-sm mt-1">{todayLabel}</Text>
        </View>
        <TouchableOpacity
          className="bg-surface border border-border rounded-xl px-3 py-2"
          onPress={() => router.push("/(app)/routine")}
        >
          <Text className="text-zinc-300 text-sm">루틴 설정</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" />
      ) : activeRoutine ? (
        <>
          {/* Active routine name */}
          <View className="bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3 mb-4">
            <Text className="text-primary text-xs font-medium mb-0.5">활성 루틴</Text>
            <Text className="text-white font-semibold">{activeRoutine.name}</Text>
          </View>

          {/* Today's exercises */}
          {todayExercises.length > 0 ? (
            <>
              {todayExercises.map((re) => (
                <View
                  key={re.id}
                  className="bg-surface border border-border rounded-2xl p-4 mb-3"
                >
                  <Text className="text-white font-semibold text-base">
                    {re.exercise?.name ?? "운동"}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-1">{re.exercise?.muscle_group}</Text>
                </View>
              ))}
              <TouchableOpacity
                className="mt-2 bg-primary rounded-2xl py-4 items-center"
                onPress={handleStartWorkout}
              >
                <Text className="text-white font-semibold text-base">운동 시작</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View className="items-center py-12">
              <Text className="text-zinc-500 text-base">오늘은 휴식일이에요 💤</Text>
            </View>
          )}
        </>
      ) : (
        <View className="items-center py-16">
          <Text className="text-zinc-400 text-base mb-2">활성 루틴이 없습니다</Text>
          <TouchableOpacity
            className="bg-primary rounded-2xl px-6 py-3 mt-4"
            onPress={() => router.push("/(app)/routine")}
          >
            <Text className="text-white font-semibold">루틴 만들기</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export default function RoutineScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white">오늘의 루틴</Text>
        <Text className="text-zinc-400 text-sm mt-1">2026년 3월 31일 월요일</Text>
      </View>

      {/* Placeholder workout cards */}
      {["스쿼트", "데드리프트", "벤치프레스"].map((exercise) => (
        <View
          key={exercise}
          className="bg-surface border border-border rounded-2xl p-4 mb-3"
        >
          <Text className="text-white font-semibold text-base">{exercise}</Text>
          <Text className="text-zinc-500 text-sm mt-1">세트 추가하기</Text>
        </View>
      ))}

      {/* Add Exercise Button */}
      <TouchableOpacity className="mt-4 bg-primary rounded-2xl py-4 items-center">
        <Text className="text-white font-semibold text-base">+ 운동 추가</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

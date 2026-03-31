import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useWorkoutStore } from "@/stores/workoutStore";
import { MuscleGroup } from "@/types/workout";

interface MuscleItem {
  group: MuscleGroup;
  label: string;
  emoji: string;
}

const MUSCLES: MuscleItem[] = [
  { group: "chest",       label: "가슴",   emoji: "🫀" },
  { group: "back",        label: "등",     emoji: "🔙" },
  { group: "shoulders",   label: "어깨",   emoji: "🏋️" },
  { group: "biceps",      label: "이두",   emoji: "💪" },
  { group: "triceps",     label: "삼두",   emoji: "💪" },
  { group: "core",        label: "복근",   emoji: "🎯" },
  { group: "quads",       label: "대퇴사두", emoji: "🦵" },
  { group: "hamstrings",  label: "햄스트링", emoji: "🦵" },
  { group: "glutes",      label: "둔근",   emoji: "🍑" },
  { group: "calves",      label: "종아리", emoji: "🦶" },
  { group: "cardio",      label: "유산소", emoji: "🏃" },
  { group: "full_body",   label: "전신",   emoji: "⚡" },
];

export default function MuscleSelectScreen() {
  const { selectedDate, setSelectedMuscleGroup } = useWorkoutStore();

  const handleSelect = (group: MuscleGroup) => {
    setSelectedMuscleGroup(group);
    router.push("/(app)/workout/exercise-select");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-14 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-base">← 뒤로</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-white text-xl font-bold">부위 선택</Text>
          <Text className="text-zinc-500 text-sm">{selectedDate}</Text>
        </View>
      </View>

      {/* Grid */}
      <ScrollView contentContainerClassName="px-4 pb-8">
        <View className="flex-row flex-wrap gap-3">
          {MUSCLES.map((item) => (
            <TouchableOpacity
              key={item.group}
              className="bg-surface border border-border rounded-2xl p-4 items-center justify-center"
              style={{ width: "47%" }}
              onPress={() => handleSelect(item.group)}
            >
              <Text className="text-3xl mb-2">{item.emoji}</Text>
              <Text className="text-white font-semibold text-base">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

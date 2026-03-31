import { View, Text, ScrollView, TouchableOpacity } from "react-native";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TODAY = new Date();

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const year = TODAY.getFullYear();
  const month = TODAY.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = TODAY.getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = `${year}년 ${month + 1}월`;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white">{monthLabel}</Text>
      </View>

      {/* Day headers */}
      <View className="flex-row mb-2">
        {DAYS.map((d) => (
          <Text key={d} className="flex-1 text-center text-xs text-zinc-500 font-medium">
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, index) => (
          <View key={index} className="w-[14.28%] aspect-square items-center justify-center">
            {day !== null && (
              <TouchableOpacity
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  day === today ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    day === today ? "text-white" : "text-zinc-300"
                  }`}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Recent sessions placeholder */}
      <View className="mt-8">
        <Text className="text-white font-semibold text-base mb-3">최근 기록</Text>
        {["오늘", "어제", "3일 전"].map((label) => (
          <View key={label} className="bg-surface border border-border rounded-2xl p-4 mb-2">
            <Text className="text-zinc-400 text-xs">{label}</Text>
            <Text className="text-white font-medium mt-1">운동 세션</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSessionsByMonth } from "@/hooks/useWorkoutSession";
import { useWorkoutStore } from "@/stores/workoutStore";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const { setSelectedDate } = useWorkoutStore();

  const { data: sessions = [] } = useSessionsByMonth(year, month + 1);

  const sessionDates = new Set(sessions.map((s) => s.date));

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const handleDayPress = (day: number) => {
    const date = toDateString(year, month, day);
    setSelectedDate(date);
    router.push("/(app)/workout/muscle-select");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-4">
      {/* Month Navigation */}
      <View className="flex-row items-center justify-between mb-6 px-2">
        <TouchableOpacity onPress={prevMonth} className="p-2">
          <Text className="text-white text-xl">‹</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          {year}년 {month + 1}월
        </Text>
        <TouchableOpacity onPress={nextMonth} className="p-2">
          <Text className="text-white text-xl">›</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View className="flex-row mb-2">
        {DAYS.map((d, i) => (
          <Text
            key={d}
            className={`flex-1 text-center text-xs font-medium ${
              i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-zinc-500"
            }`}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} className="w-[14.28%] aspect-square" />;
          }
          const dateStr = toDateString(year, month, day);
          const isToday = dateStr === todayStr;
          const hasSession = sessionDates.has(dateStr);
          const dayOfWeek = (firstDay + day - 1) % 7;

          return (
            <TouchableOpacity
              key={day}
              className="w-[14.28%] aspect-square items-center justify-center"
              onPress={() => handleDayPress(day)}
            >
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  isToday ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isToday
                      ? "text-white"
                      : dayOfWeek === 0
                      ? "text-red-400"
                      : dayOfWeek === 6
                      ? "text-blue-400"
                      : "text-zinc-300"
                  }`}
                >
                  {day}
                </Text>
              </View>
              {hasSession && (
                <View className="mt-0.5">
                  <View className="w-1 h-1 rounded-full bg-primary" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 이번 달 세션 리스트 */}
      {sessions.length > 0 && (
        <View className="mt-6">
          <Text className="text-white font-semibold text-base mb-3">이번 달 기록</Text>
          {sessions
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((s) => (
              <TouchableOpacity
                key={s.id}
                className="bg-surface border border-border rounded-2xl p-4 mb-2"
                onPress={() => {
                  setSelectedDate(s.date);
                  router.push("/(app)/workout/muscle-select");
                }}
              >
                <Text className="text-zinc-400 text-xs">{s.date}</Text>
                <Text className="text-white font-medium mt-1">{s.title ?? "운동 세션"}</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useExerciseStats, ExerciseStat } from "@/hooks/useStats";

const BAR_MAX_HEIGHT = 80;

// ── 볼륨 바 차트 ─────────────────────────────────────────

function VolumeChart({ history }: { history: ExerciseStat["history"] }) {
  if (history.length === 0) return null;

  const maxVolume = Math.max(...history.map((h) => h.volume));

  return (
    <View>
      <Text className="text-zinc-400 text-xs mb-3">볼륨 추이 (kg × 회)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-end gap-2">
          {history.map((item, i) => {
            const ratio = maxVolume > 0 ? item.volume / maxVolume : 0;
            const barHeight = Math.max(4, Math.round(ratio * BAR_MAX_HEIGHT));
            const isLast = i === history.length - 1;
            const label = item.date.slice(5); // MM-DD

            return (
              <View key={item.date} className="items-center" style={{ width: 36 }}>
                {/* 볼륨 수치 (마지막만 표시) */}
                {isLast && (
                  <Text className="text-primary text-xs mb-1" numberOfLines={1}>
                    {item.volume >= 1000
                      ? `${(item.volume / 1000).toFixed(1)}t`
                      : `${item.volume}kg`}
                  </Text>
                )}
                <View
                  style={{ height: barHeight }}
                  className={`w-7 rounded-t-md ${isLast ? "bg-primary" : "bg-zinc-700"}`}
                />
                <Text className="text-zinc-600 text-xs mt-1" numberOfLines={1}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ── 운동별 통계 카드 ────────────────────────────────────

function ExerciseStatCard({ stat }: { stat: ExerciseStat }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3"
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      {/* 헤더 */}
      <View className="flex-row items-start justify-between mb-3">
        <Text className="text-white font-bold text-base flex-1 mr-2">{stat.exerciseName}</Text>
        <Text className="text-zinc-600 text-base">{expanded ? "∧" : "∨"}</Text>
      </View>

      {/* 핵심 수치 */}
      <View className="flex-row gap-4">
        <View>
          <Text className="text-zinc-500 text-xs">추정 1RM</Text>
          <Text className="text-primary font-bold text-xl">{stat.bestOneRM}kg</Text>
        </View>
        <View>
          <Text className="text-zinc-500 text-xs">최고 중량</Text>
          <Text className="text-white font-bold text-xl">{stat.bestWeight}kg</Text>
        </View>
        <View>
          <Text className="text-zinc-500 text-xs">마지막 세션</Text>
          <Text className="text-white font-bold text-xl">
            {stat.lastWeight}kg × {stat.lastReps}
          </Text>
        </View>
      </View>

      {/* 볼륨 차트 (펼침) */}
      {expanded && (
        <View className="mt-4 pt-4 border-t border-border">
          <VolumeChart history={stat.history} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── 메인 화면 ────────────────────────────────────────────

export default function StatsScreen() {
  const { data: stats = [], isLoading } = useExerciseStats();

  return (
    <View className="flex-1 bg-background">
      {/* 헤더 */}
      <View className="pt-14 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-base">← 뒤로</Text>
        </TouchableOpacity>
        <View>
          <Text className="text-white text-xl font-bold">운동 통계</Text>
          <Text className="text-zinc-500 text-xs mt-0.5">최근 90일 · 카드 탭하면 차트 펼침</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-12" />
      ) : stats.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-500 text-base">완료된 세트 기록이 없습니다.</Text>
          <Text className="text-zinc-600 text-sm mt-2">운동을 기록하면 통계가 나타납니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-6 pb-32">
          {stats.map((stat) => (
            <ExerciseStatCard key={stat.exerciseId} stat={stat} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

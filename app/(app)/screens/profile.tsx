import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="text-zinc-500 text-xs mt-1">{label}</Text>
    </View>
  );
}

interface MenuItemProps {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({ label, subtitle, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-4 border-b border-border"
      onPress={onPress}
    >
      <View>
        <Text className={`font-medium ${danger ? "text-red-400" : "text-white"}`}>{label}</Text>
        {subtitle && <Text className="text-zinc-500 text-xs mt-0.5">{subtitle}</Text>}
      </View>
      {!danger && <Text className="text-zinc-600 text-lg">›</Text>}
    </TouchableOpacity>
  );
}

function useSessionStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["session-stats", userId],
    queryFn: async () => {
      if (!userId) return { total: 0, thisMonth: 0, streak: 0 };

      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const [{ count: total }, { count: thisMonth }] = await Promise.all([
        supabase
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("workout_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("date", monthStart),
      ]);

      // 연속 일수: 오늘부터 역순으로 세션 날짜 확인
      const { data: dates } = await supabase
        .from("workout_sessions")
        .select("date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(60);

      let streak = 0;
      const check = new Date();
      for (const { date } of dates ?? []) {
        const checkStr = check.toISOString().split("T")[0];
        if (date === checkStr) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else break;
      }

      return { total: total ?? 0, thisMonth: thisMonth ?? 0, streak };
    },
    enabled: !!userId,
  });
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { data: profile } = useProfile();
  const { data: stats } = useSessionStats(user?.id);

  const handleSignOut = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: signOut },
    ]);
  };

  const displayName = profile?.username ?? profile?.full_name ?? user?.email?.split("@")[0] ?? "사용자";
  const weightUnit = profile?.weight_unit ?? "kg";

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-4">
      {/* Avatar + Name */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-surface border border-border items-center justify-center mb-3">
          <Text className="text-3xl">💪</Text>
        </View>
        <Text className="text-white text-xl font-bold">{displayName}</Text>
        <Text className="text-zinc-500 text-sm mt-1">{user?.email}</Text>
      </View>

      {/* Stats */}
      <View className="flex-row gap-3 mb-8">
        <StatCard label="총 세션" value={String(stats?.total ?? 0)} />
        <StatCard label="이번 달" value={String(stats?.thisMonth ?? 0)} />
        <StatCard label="연속 일수" value={String(stats?.streak ?? 0)} />
      </View>

      {/* Settings */}
      <View className="bg-surface border border-border rounded-2xl px-4 mb-4">
        <MenuItem label="무게 단위" subtitle={weightUnit} />
        <MenuItem label="원판 설정" onPress={() => router.push("/(app)/settings/plates")} />
        <MenuItem label="점진적 과부하 설정" onPress={() => router.push("/(app)/settings/overload")} />
        <MenuItem label="운동 알림" onPress={() => router.push("/(app)/settings/notifications")} />
      </View>

      {/* Records */}
      <View className="bg-surface border border-border rounded-2xl px-4 mb-4">
        <MenuItem label="운동 통계" subtitle="1RM · 볼륨 추이" onPress={() => router.push("/(app)/stats")} />
        <MenuItem label="신체 기록" onPress={() => router.push("/(app)/body-records")} />
        <MenuItem label="카디오 기록" onPress={() => router.push("/(app)/cardio")} />
        <MenuItem label="주간 루틴 관리" onPress={() => router.push("/(app)/routine")} />
      </View>

      {/* Logout */}
      <View className="bg-surface border border-border rounded-2xl px-4">
        <MenuItem label="로그아웃" onPress={handleSignOut} danger />
      </View>
    </ScrollView>
  );
}

import { View, Text, ScrollView, TouchableOpacity } from "react-native";

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
}

function MenuItem({ label, subtitle }: MenuItemProps) {
  return (
    <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-border">
      <View>
        <Text className="text-white font-medium">{label}</Text>
        {subtitle && <Text className="text-zinc-500 text-xs mt-0.5">{subtitle}</Text>}
      </View>
      <Text className="text-zinc-600 text-lg">›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-4">
      {/* Avatar + Name */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-surface border border-border items-center justify-center mb-3">
          <Text className="text-3xl">💪</Text>
        </View>
        <Text className="text-white text-xl font-bold">사용자</Text>
        <Text className="text-zinc-500 text-sm mt-1">가입일: 2026년 1월</Text>
      </View>

      {/* Stats */}
      <View className="flex-row gap-3 mb-8">
        <StatCard label="총 세션" value="0" />
        <StatCard label="이번 달" value="0" />
        <StatCard label="연속 일수" value="0" />
      </View>

      {/* Menu */}
      <View className="bg-surface border border-border rounded-2xl px-4 mb-4">
        <MenuItem label="무게 단위" subtitle="kg" />
        <MenuItem label="원판 설정" />
        <MenuItem label="점진적 과부하 설정" />
      </View>

      <View className="bg-surface border border-border rounded-2xl px-4 mb-4">
        <MenuItem label="신체 기록" />
        <MenuItem label="운동 히스토리" />
        <MenuItem label="주간 루틴 관리" />
      </View>

      <View className="bg-surface border border-border rounded-2xl px-4">
        <MenuItem label="로그아웃" />
      </View>
    </ScrollView>
  );
}

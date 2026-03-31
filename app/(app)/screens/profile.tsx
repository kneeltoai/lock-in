import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "@/stores/authStore";

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
      className="flex-row items-center justify-between py-4 border-b border-border last:border-0"
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

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 py-4">
      {/* Avatar + Name */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-surface border border-border items-center justify-center mb-3">
          <Text className="text-3xl">💪</Text>
        </View>
        <Text className="text-white text-xl font-bold">
          {user?.email?.split("@")[0] ?? "사용자"}
        </Text>
        <Text className="text-zinc-500 text-sm mt-1">{user?.email}</Text>
      </View>

      {/* Stats */}
      <View className="flex-row gap-3 mb-8">
        <StatCard label="총 세션" value="0" />
        <StatCard label="이번 달" value="0" />
        <StatCard label="연속 일수" value="0" />
      </View>

      {/* Settings */}
      <View className="bg-surface border border-border rounded-2xl px-4 mb-4">
        <MenuItem label="무게 단위" subtitle="kg" />
        <MenuItem label="원판 설정" />
        <MenuItem label="점진적 과부하 설정" />
      </View>

      {/* Records */}
      <View className="bg-surface border border-border rounded-2xl px-4 mb-4">
        <MenuItem label="신체 기록" />
        <MenuItem label="운동 히스토리" />
        <MenuItem label="주간 루틴 관리" />
      </View>

      {/* Logout */}
      <View className="bg-surface border border-border rounded-2xl px-4">
        <MenuItem label="로그아웃" onPress={handleSignOut} danger />
      </View>
    </ScrollView>
  );
}

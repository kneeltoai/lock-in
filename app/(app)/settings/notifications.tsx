import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  requestNotificationPermission,
  scheduleWorkoutReminder,
  cancelWorkoutReminder,
  getReminderTime,
} from "@/hooks/useNotifications";

export default function NotificationsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getReminderTime().then((time) => {
      if (time) {
        setEnabled(true);
        setHour(time.hour);
        setMinute(time.minute);
      }
      setLoading(false);
    });
  }, []);

  const handleToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert("알림 권한 필요", "설정에서 알림 권한을 허용해주세요.");
        return;
      }
    }
    setEnabled(value);
    if (!value) {
      await cancelWorkoutReminder();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert("알림 권한 필요", "설정에서 알림 권한을 허용해주세요.");
          return;
        }
        await scheduleWorkoutReminder(hour, minute);
        Alert.alert("저장 완료", `매일 ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}에 알림을 보냅니다.`);
      } else {
        await cancelWorkoutReminder();
      }
    } finally {
      setSaving(false);
    }
  };

  const adjustHour = (delta: number) => {
    setHour((h) => (h + delta + 24) % 24);
  };

  const adjustMinute = (delta: number) => {
    setMinute((m) => (m + delta + 60) % 60);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="pt-14 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-base">← 뒤로</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">운동 알림</Text>
      </View>

      <View className="px-6">
        {/* 알림 토글 */}
        <View className="bg-surface border border-border rounded-2xl px-5 py-4 flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white font-semibold">매일 운동 리마인더</Text>
            <Text className="text-zinc-500 text-xs mt-0.5">설정한 시각에 알림을 보냅니다</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: "#3f3f46", true: "#6366f1" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* 시각 설정 */}
        {enabled && (
          <View className="bg-surface border border-border rounded-2xl p-6 mb-6 items-center">
            <Text className="text-zinc-400 text-sm mb-6">알림 시각</Text>
            <View className="flex-row items-center gap-4">
              {/* 시 */}
              <View className="items-center">
                <TouchableOpacity onPress={() => adjustHour(1)} className="p-3">
                  <Text className="text-white text-xl">▲</Text>
                </TouchableOpacity>
                <Text className="text-white font-bold" style={{ fontSize: 48, lineHeight: 56 }}>
                  {String(hour).padStart(2, "0")}
                </Text>
                <TouchableOpacity onPress={() => adjustHour(-1)} className="p-3">
                  <Text className="text-white text-xl">▼</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-white font-bold" style={{ fontSize: 40 }}>:</Text>

              {/* 분 */}
              <View className="items-center">
                <TouchableOpacity onPress={() => adjustMinute(5)} className="p-3">
                  <Text className="text-white text-xl">▲</Text>
                </TouchableOpacity>
                <Text className="text-white font-bold" style={{ fontSize: 48, lineHeight: 56 }}>
                  {String(minute).padStart(2, "0")}
                </Text>
                <TouchableOpacity onPress={() => adjustMinute(-5)} className="p-3">
                  <Text className="text-white text-xl">▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">저장</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

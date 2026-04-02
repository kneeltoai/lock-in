import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useUpdateProfile } from "@/hooks/useProfile";

export default function OnboardingScreen() {
  const [username, setUsername] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const updateProfile = useUpdateProfile();

  const handleDone = async () => {
    if (!username.trim()) return;
    await updateProfile.mutateAsync({
      full_name: username.trim(),
      weight_unit: weightUnit,
    });
    router.replace("/(app)");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-white mb-2">환영합니다 👋</Text>
        <Text className="text-zinc-400 text-base mb-10">기본 정보를 설정해주세요</Text>

        {/* 닉네임 */}
        <Text className="text-zinc-400 text-sm mb-2">닉네임</Text>
        <TextInput
          className="bg-surface border border-border rounded-2xl px-4 py-4 text-white text-base mb-6"
          placeholder="닉네임 입력"
          placeholderTextColor="#52525b"
          value={username}
          onChangeText={setUsername}
          autoFocus
          returnKeyType="done"
        />

        {/* 무게 단위 */}
        <Text className="text-zinc-400 text-sm mb-2">무게 단위</Text>
        <View className="flex-row gap-3 mb-10">
          {(["kg", "lbs"] as const).map((unit) => (
            <TouchableOpacity
              key={unit}
              onPress={() => setWeightUnit(unit)}
              className={`flex-1 py-4 rounded-2xl items-center border ${
                weightUnit === unit
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
            >
              <Text className={`font-semibold text-base ${weightUnit === unit ? "text-white" : "text-zinc-400"}`}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className={`rounded-2xl py-4 items-center ${username.trim() ? "bg-primary" : "bg-zinc-700"}`}
          onPress={handleDone}
          disabled={!username.trim() || updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

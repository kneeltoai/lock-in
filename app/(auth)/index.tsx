import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading } = useAuthStore();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    const error = await signIn(email.trim(), password);
    if (error) Alert.alert("로그인 실패", error);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="mb-12">
          <Text className="text-4xl font-bold text-white">Lock In</Text>
          <Text className="text-zinc-400 text-base mt-2">트레이닝에 집중하세요</Text>
        </View>

        {/* Form */}
        <View className="gap-3">
          <TextInput
            className="bg-surface border border-border rounded-2xl px-4 py-4 text-white text-base"
            placeholder="이메일"
            placeholderTextColor="#52525b"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            className="bg-surface border border-border rounded-2xl px-4 py-4 text-white text-base"
            placeholder="비밀번호"
            placeholderTextColor="#52525b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="mt-6 bg-primary rounded-2xl py-4 items-center"
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">로그인</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-zinc-500">계정이 없으신가요? </Text>
          <Link href="/(auth)/signup">
            <Text className="text-primary font-semibold">회원가입</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

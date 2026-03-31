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

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { signUp, loading } = useAuthStore();

  const handleSignUp = async () => {
    if (!email || !password || !confirm) {
      Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("입력 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("입력 오류", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    const error = await signUp(email.trim(), password);
    if (error) {
      Alert.alert("회원가입 실패", error);
    } else {
      Alert.alert("가입 완료", "이메일을 확인해 인증 링크를 클릭해주세요.");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="mb-12">
          <Text className="text-4xl font-bold text-white">시작하기</Text>
          <Text className="text-zinc-400 text-base mt-2">Lock In과 함께 성장하세요</Text>
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
            placeholder="비밀번호 (6자 이상)"
            placeholderTextColor="#52525b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            className="bg-surface border border-border rounded-2xl px-4 py-4 text-white text-base"
            placeholder="비밀번호 확인"
            placeholderTextColor="#52525b"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          className="mt-6 bg-primary rounded-2xl py-4 items-center"
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">회원가입</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-zinc-500">이미 계정이 있으신가요? </Text>
          <Link href="/(auth)">
            <Text className="text-primary font-semibold">로그인</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AppLayout() {
  const { session, initialized } = useAuthStore();

  if (!initialized) return null;
  if (!session) return <Redirect href="/(auth)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

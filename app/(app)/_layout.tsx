import { Redirect, Stack, useSegments } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useProfile } from "@/hooks/useProfile";

export default function AppLayout() {
  const { session, initialized } = useAuthStore();
  const { data: profile, isLoading } = useProfile();
  const segments = useSegments();

  if (!initialized || isLoading) return null;
  if (!session) return <Redirect href="/(auth)" />;

  const onOnboarding = segments.includes("onboarding" as never);
  const needsOnboarding = !profile?.full_name;

  if (needsOnboarding && !onOnboarding) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

import { Platform } from "react-native";

// expo-notifications를 top-level import하면 Expo Go에서
// DevicePushTokenAutoRegistration side-effect가 실행되어 에러 발생.
// 모든 함수 내부에서 require로 lazy 로드.

function getNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("expo-notifications") as typeof import("expo-notifications");
}

export function initNotificationHandler() {
  try {
    const Notifications = getNotifications();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (_) {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = getNotifications();
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("workout-reminder", {
        name: "운동 리마인더",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (_) {
    return false;
  }
}

export async function scheduleWorkoutReminder(hour: number, minute: number): Promise<void> {
  try {
    const Notifications = getNotifications();
    await cancelWorkoutReminder();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Lock In 💪",
        body: "오늘 운동 잊지 마세요!",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (_) {}
}

export async function cancelWorkoutReminder(): Promise<void> {
  try {
    const Notifications = getNotifications();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  } catch (_) {}
}

export async function getReminderTime(): Promise<{ hour: number; minute: number } | null> {
  try {
    const Notifications = getNotifications();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length === 0) return null;
    const trigger = scheduled[0].trigger as { hour?: number; minute?: number };
    if (trigger.hour == null || trigger.minute == null) return null;
    return { hour: trigger.hour, minute: trigger.minute };
  } catch (_) {
    return null;
  }
}

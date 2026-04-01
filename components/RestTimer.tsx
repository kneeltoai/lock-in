import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, Animated } from "react-native";

interface RestTimerProps {
  visible: boolean;
  duration: number;
  remaining: number;
  onSkip: () => void;
  onAdjust: (delta: number) => void;
}

export function RestTimer({ visible, duration, remaining, onSkip, onAdjust }: RestTimerProps) {
  const widthAnim = useRef(new Animated.Value(remaining / duration)).current;

  useEffect(() => {
    if (!visible) {
      widthAnim.setValue(1);
      return;
    }
    Animated.timing(widthAnim, {
      toValue: remaining / duration,
      duration: 950,
      useNativeDriver: false,
    }).start();
  }, [remaining, visible]);

  const widthPercent = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const barColor = remaining <= 10 ? "#ef4444" : remaining <= 30 ? "#facc15" : "#6366f1";

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/70 items-center justify-center px-8">
        <View className="bg-surface border border-border rounded-3xl p-8 w-full items-center">
          <Text className="text-zinc-400 text-sm font-medium mb-1">휴식 중</Text>

          {/* 카운트다운 숫자 */}
          <Text className="text-white font-bold mb-6" style={{ fontSize: 72, lineHeight: 80 }}>
            {timeStr}
          </Text>

          {/* 프로그레스 바 */}
          <View className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-8">
            <Animated.View
              style={{
                height: "100%",
                width: widthPercent,
                backgroundColor: barColor,
                borderRadius: 999,
              }}
            />
          </View>

          {/* 컨트롤 버튼 */}
          <View className="flex-row gap-4 w-full">
            <TouchableOpacity
              className="flex-1 bg-zinc-800 rounded-2xl py-3 items-center"
              onPress={() => onAdjust(-30)}
            >
              <Text className="text-white font-semibold">−30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-primary rounded-2xl py-3 items-center"
              onPress={onSkip}
            >
              <Text className="text-white font-semibold">스킵</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-zinc-800 rounded-2xl py-3 items-center"
              onPress={() => onAdjust(30)}
            >
              <Text className="text-white font-semibold">+30s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

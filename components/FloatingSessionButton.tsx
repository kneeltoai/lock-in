import { useRef } from "react";
import { Animated, PanResponder, View, Text } from "react-native";

interface FloatingSessionButtonProps {
  elapsedLabel: string;
  onTap: () => void;
}

export function FloatingSessionButton({ elapsedLabel, onTap }: FloatingSessionButtonProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const offset = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
      onPanResponderGrant: () => {
        dragged.current = false;
        pan.setOffset(offset.current);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) dragged.current = true;
        pan.x.setValue(gs.dx);
        pan.y.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        offset.current = { x: offset.current.x + gs.dx, y: offset.current.y + gs.dy };
        pan.flattenOffset();
        if (!dragged.current) onTap();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        { position: "absolute", bottom: 130, right: 24 },
        { transform: pan.getTranslateTransform() },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#D63A24",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 14, lineHeight: 16 }}>▶</Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 9, marginTop: 2 }}>
          {elapsedLabel}
        </Text>
      </View>
    </Animated.View>
  );
}

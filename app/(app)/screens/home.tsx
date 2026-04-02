import { useState, useRef } from "react";
import { View, ScrollView, LayoutChangeEvent } from "react-native";
import CalendarScreen from "./calendar";
import SessionPage from "./session-page";
import MinimiPage from "./minimi-page";

function CalendarPage({ height, onGoToSession }: { height: number; onGoToSession: () => void }) {
  return (
    <View style={{ height }}>
      <CalendarScreen onGoToSession={onGoToSession} />
    </View>
  );
}

export default function HomeScreen() {
  const [pageHeight, setPageHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSession = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setPageHeight(e.nativeEvent.layout.height);
  };

  return (
    <View className="flex-1" onLayout={handleLayout}>
      {pageHeight > 0 && (
        <ScrollView
          ref={scrollRef}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
        >
          <SessionPage height={pageHeight} />
          <MinimiPage height={pageHeight} onGoToSession={goToSession} />
          <CalendarPage height={pageHeight} onGoToSession={goToSession} />
        </ScrollView>
      )}
    </View>
  );
}

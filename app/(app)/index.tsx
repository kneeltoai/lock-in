import { useRef, useState } from "react";
import { View, Text } from "react-native";
import PagerView from "react-native-pager-view";
import RoutineScreen from "./screens/routine";
import CalendarScreen from "./screens/calendar";
import ProfileScreen from "./screens/profile";

const TABS = ["루틴", "캘린더", "프로필"] as const;

export default function MainScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  return (
    <View className="flex-1 bg-background">
      {/* Top Tab Indicator */}
      <View className="flex-row pt-14 pb-2 px-6 bg-background">
        {TABS.map((tab, index) => (
          <View key={tab} className="flex-1 items-center">
            <Text
              className={`text-sm font-semibold ${
                currentPage === index
                  ? "text-white"
                  : "text-zinc-500"
              }`}
              onPress={() => pagerRef.current?.setPage(index)}
            >
              {tab}
            </Text>
            {currentPage === index && (
              <View className="mt-1 h-0.5 w-6 rounded-full bg-primary" />
            )}
          </View>
        ))}
      </View>

      {/* Swipeable Pages */}
      <PagerView
        ref={pagerRef}
        className="flex-1"
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        <View key="routine" className="flex-1">
          <RoutineScreen />
        </View>
        <View key="calendar" className="flex-1">
          <CalendarScreen />
        </View>
        <View key="profile" className="flex-1">
          <ProfileScreen />
        </View>
      </PagerView>
    </View>
  );
}

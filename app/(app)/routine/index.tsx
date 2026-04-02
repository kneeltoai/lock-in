import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import {
  useRoutines,
  useCreateRoutine,
  useSetActiveRoutine,
  useGenerateRoutineSessions,
  WeeklyRoutine,
} from "@/hooks/useRoutine";

const DURATION_PRESETS = [1, 2, 4, 6, 8, 12, 16, 24];

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function RoutineCard({ routine }: { routine: WeeklyRoutine }) {
  const setActive = useSetActiveRoutine();
  const generate = useGenerateRoutineSessions();
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState(12);
  const [weeksInput, setWeeksInput] = useState("12");

  // 요일별로 그루핑
  const byDay: Record<number, string[]> = {};
  for (const re of routine.routine_exercises ?? []) {
    if (!byDay[re.day_of_week]) byDay[re.day_of_week] = [];
    byDay[re.day_of_week].push(re.exercise?.name ?? "");
  }

  const handleActivate = async () => {
    await setActive.mutateAsync(routine.id);
    setDurationModalVisible(true);
  };

  const handleGenerate = async () => {
    const weeks = parseInt(weeksInput, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      Alert.alert("입력 오류", "1~52 사이의 숫자를 입력해주세요.");
      return;
    }
    setDurationModalVisible(false);
    await generate.mutateAsync({ routine, weeks });
    Alert.alert("완료", `${weeks}주치 캘린더가 생성되었습니다.`);
  };

  return (
    <View className={`bg-surface border rounded-2xl p-4 mb-3 ${routine.is_active ? "border-primary" : "border-border"}`}>
      {/* 기간 선택 모달 */}
      <Modal visible={durationModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-surface border border-border rounded-2xl p-6">
            <Text className="text-white text-lg font-bold mb-1">캘린더 생성</Text>
            <Text className="text-zinc-500 text-sm mb-4">몇 주치를 생성할까요?</Text>

            {/* 직접 입력 */}
            <View className="flex-row items-center bg-background border border-border rounded-xl px-4 py-3 mb-4">
              <TextInput
                className="flex-1 text-white text-2xl font-bold text-center"
                value={weeksInput}
                onChangeText={(v) => setWeeksInput(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text className="text-zinc-500 text-base">주</Text>
            </View>

            {/* 프리셋 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              <View className="flex-row gap-2">
                {DURATION_PRESETS.map((w) => (
                  <TouchableOpacity
                    key={w}
                    onPress={() => setWeeksInput(String(w))}
                    className={`px-3 py-1.5 rounded-full border ${
                      weeksInput === String(w) ? "bg-primary border-primary" : "bg-background border-border"
                    }`}
                  >
                    <Text className={`text-sm font-medium ${weeksInput === String(w) ? "text-white" : "text-zinc-400"}`}>
                      {w}주
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-border rounded-xl py-3 items-center"
                onPress={() => setDurationModalVisible(false)}
              >
                <Text className="text-zinc-300 font-medium">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3 items-center"
                onPress={handleGenerate}
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-semibold">생성</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-bold text-base">{routine.name}</Text>
        {routine.is_active && (
          <View className="bg-primary/20 px-2 py-0.5 rounded-full">
            <Text className="text-primary text-xs font-semibold">활성</Text>
          </View>
        )}
      </View>

      {/* 요일별 운동 요약 */}
      <View className="gap-1 mb-3">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const exercises = byDay[day];
          if (!exercises?.length) return null;
          return (
            <View key={day} className="flex-row items-start gap-2">
              <Text className="text-zinc-500 text-xs w-6">{DAYS[day]}</Text>
              <Text className="text-zinc-300 text-xs flex-1">{exercises.join(", ")}</Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 border border-border rounded-xl py-2.5 items-center"
          onPress={() => router.push({ pathname: "/(app)/routine/edit", params: { id: routine.id } })}
        >
          <Text className="text-zinc-300 text-sm font-medium">편집</Text>
        </TouchableOpacity>
        {!routine.is_active && (
          <TouchableOpacity
            className="flex-1 bg-primary rounded-xl py-2.5 items-center"
            onPress={handleActivate}
            disabled={setActive.isPending || generate.isPending}
          >
            {setActive.isPending || generate.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white text-sm font-semibold">활성화</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RoutineListScreen() {
  const { data: routines = [], isLoading } = useRoutines();
  const createRoutine = useCreateRoutine();
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createRoutine.mutateAsync(newName.trim());
    setNewName("");
    setModalVisible(false);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold">루틴 관리</Text>
        <TouchableOpacity
          className="bg-primary px-4 py-2 rounded-xl"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-sm font-semibold">+ 새 루틴</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-12" />
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => <RoutineCard routine={item} />}
          ListEmptyComponent={
            <View className="items-center mt-24">
              <Text className="text-zinc-500 text-base">루틴이 없습니다.</Text>
              <Text className="text-zinc-600 text-sm mt-1">+ 새 루틴으로 시작하세요</Text>
            </View>
          }
        />
      )}

      {/* New Routine Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-surface border border-border rounded-2xl p-6">
            <Text className="text-white text-lg font-bold mb-4">새 루틴 만들기</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-white mb-4"
              placeholder="루틴 이름 (예: 3분할 A)"
              placeholderTextColor="#52525b"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-border rounded-xl py-3 items-center"
                onPress={() => { setModalVisible(false); setNewName(""); }}
              >
                <Text className="text-zinc-300 font-medium">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3 items-center"
                onPress={handleCreate}
                disabled={createRoutine.isPending}
              >
                {createRoutine.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-semibold">만들기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

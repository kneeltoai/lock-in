import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  useRoutines,
  useCreateRoutine,
  useSetActiveRoutine,
  useGenerateRoutineSessions,
  WeeklyRoutine,
} from "@/hooks/useRoutine";
import { useUpsertSession } from "@/hooks/useWorkoutSession";
import { useWorkoutStore } from "@/stores/workoutStore";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DURATION_PRESETS = [4, 8, 12, 16, 24];

function todayString() {
  return new Date().toISOString().split("T")[0];
}

// ── RoutineCard ─────────────────────────────────────────

function RoutineCard({ routine }: { routine: WeeklyRoutine }) {
  const setActive = useSetActiveRoutine();
  const generate = useGenerateRoutineSessions();
  const [calModalVisible, setCalModalVisible] = useState(false);
  const [weeksInput, setWeeksInput] = useState("12");

  const activeDays = [
    ...new Set((routine.routine_exercises ?? []).map((re) => re.day_of_week)),
  ].sort((a, b) => a - b);

  const handleActivate = async () => {
    await setActive.mutateAsync(routine.id);
    setCalModalVisible(true);
  };

  const handleGenerate = async () => {
    const weeks = parseInt(weeksInput, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      Alert.alert("입력 오류", "1~52 사이의 숫자를 입력해주세요.");
      return;
    }
    setCalModalVisible(false);
    await generate.mutateAsync({ routine, weeks });
    Alert.alert("완료", `${weeks}주치 캘린더가 생성되었습니다.`);
  };

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: routine.is_active ? "#D63A24" : "#EDE8E0",
      }}
    >
      {/* 캘린더 생성 모달 */}
      <Modal visible={calModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
              캘린더 생성
            </Text>
            <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>
              몇 주치를 생성할까요?
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              {DURATION_PRESETS.map((w) => (
                <TouchableOpacity
                  key={w}
                  onPress={() => setWeeksInput(String(w))}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: weeksInput === String(w) ? "#D63A24" : "#F5F1EB",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: weeksInput === String(w) ? "#fff" : "#374151" }}>
                    {w}주
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setCalModalVisible(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#EDE8E0" }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGenerate}
                disabled={generate.isPending}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#D63A24" }}
              >
                {generate.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>생성</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 루틴 이름 + 활성 뱃지 */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 }}>
          {routine.name}
        </Text>
        {routine.is_active && (
          <View style={{ backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#D63A24" }}>활성</Text>
          </View>
        )}
      </View>

      {/* 요일 도트 (월~일 순) */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5, 6, 0].map((day) => {
          const hasExercise = activeDays.includes(day);
          return (
            <View
              key={day}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: hasExercise ? "#D63A24" : "#F5F1EB",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: hasExercise ? "#fff" : "#C4BEB5" }}>
                {DAYS[day]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 편집 / 활성화 버튼 */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(app)/routine/edit", params: { id: routine.id } })}
          style={{ flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#EDE8E0" }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>편집</Text>
        </TouchableOpacity>
        {!routine.is_active && (
          <TouchableOpacity
            onPress={handleActivate}
            disabled={setActive.isPending}
            style={{ flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", backgroundColor: "#D63A24" }}
          >
            {setActive.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>활성화</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── RoutineScreen ───────────────────────────────────────

export default function RoutineScreen() {
  const { data: routines = [], isLoading } = useRoutines();
  const createRoutine = useCreateRoutine();
  const upsertSession = useUpsertSession();
  const { setActiveSessionId, setSelectedDate } = useWorkoutStore();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newName, setNewName] = useState("");

  const handleStartEmpty = async () => {
    const today = todayString();
    const s = await upsertSession.mutateAsync(today);
    setActiveSessionId(s.id);
    setSelectedDate(today);
    router.push("/(app)/workout/muscle-select");
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await createRoutine.mutateAsync(newName.trim());
    setNewName("");
    setCreateModalVisible(false);
    router.push({ pathname: "/(app)/routine/edit", params: { id: created.id } });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F5F1EB" }}
      contentContainerStyle={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 헤더 */}
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 24 }}>
        루틴
      </Text>

      {/* ① 빈 운동 시작하기 */}
      <TouchableOpacity
        onPress={handleStartEmpty}
        disabled={upsertSession.isPending}
        style={{
          backgroundColor: "#D63A24",
          borderRadius: 20,
          paddingVertical: 22,
          alignItems: "center",
          marginBottom: 12,
        }}
        activeOpacity={0.85}
      >
        {upsertSession.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
            빈 운동 시작하기
          </Text>
        )}
      </TouchableOpacity>

      {/* ② 새 루틴 만들기 카드 */}
      <TouchableOpacity
        onPress={() => setCreateModalVisible(true)}
        style={{
          borderRadius: 20,
          paddingVertical: 22,
          alignItems: "center",
          marginBottom: 32,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: "#C4BEB5",
        }}
        activeOpacity={0.7}
      >
        <Text style={{ color: "#374151", fontSize: 17, fontWeight: "600" }}>
          + 새 루틴 만들기
        </Text>
      </TouchableOpacity>

      {/* ③ 저장된 루틴 목록 */}
      {isLoading ? (
        <ActivityIndicator color="#D63A24" style={{ marginTop: 16 }} />
      ) : routines.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#9CA3AF", fontSize: 14, marginTop: 8 }}>
          저장된 루틴이 없어요
        </Text>
      ) : (
        routines.map((routine) => <RoutineCard key={routine.id} routine={routine} />)
      )}

      {/* 새 루틴 이름 입력 모달 */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 16 }}>
              새 루틴 만들기
            </Text>
            <TextInput
              style={{
                backgroundColor: "#F5F1EB",
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: "#111827",
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#EDE8E0",
              }}
              placeholder="루틴 이름 (예: 3분할 A)"
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setCreateModalVisible(false); setNewName(""); }}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#EDE8E0" }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={!newName.trim() || createRoutine.isPending}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: newName.trim() ? "#D63A24" : "#F0EDE8",
                }}
              >
                {createRoutine.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: newName.trim() ? "#fff" : "#C4BEB5", fontWeight: "700" }}>
                    만들기
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

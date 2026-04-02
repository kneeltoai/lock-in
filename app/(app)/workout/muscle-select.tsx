import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useExercises, useCreateExercise, useDeleteExercise } from "@/hooks/useExercises";
import { useUpsertSession, useAddExercise, useSessionByDate } from "@/hooks/useWorkoutSession";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Exercise, MuscleGroup } from "@/types/workout";

// ── 탭 정의 ─────────────────────────────────────────────

const TABS: { label: string; groups: MuscleGroup[] }[] = [
  { label: "가슴",  groups: ["chest"] },
  { label: "등",    groups: ["back"] },
  { label: "어깨",  groups: ["shoulders"] },
  { label: "하체",  groups: ["quads", "hamstrings", "glutes", "calves"] },
  { label: "팔",    groups: ["biceps", "triceps"] },
  { label: "코어",  groups: ["core"] },
  { label: "유산소", groups: ["cardio"] },
  { label: "전신",  groups: ["full_body"] },
];

// ── 커스텀 운동 추가 모달 ─────────────────────────────────

interface AddExerciseModalProps {
  visible: boolean;
  muscleGroup: MuscleGroup;
  onClose: () => void;
}

function AddExerciseModal({ visible, muscleGroup, onClose }: AddExerciseModalProps) {
  const createExercise = useCreateExercise();
  const [name, setName] = useState("");

  const LABELS: Partial<Record<MuscleGroup, string>> = {
    chest: "가슴", back: "등", shoulders: "어깨", quads: "하체",
    biceps: "팔", core: "코어", cardio: "유산소", full_body: "전신",
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("입력 오류", "운동 이름을 입력해주세요.");
      return;
    }
    await createExercise.mutateAsync({ name: name.trim(), muscleGroup });
    setName("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
            커스텀 운동 추가
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
            부위: {LABELS[muscleGroup] ?? muscleGroup}
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
            placeholder="운동 이름"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => { setName(""); onClose(); }}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#EDE8E0" }}
            >
              <Text style={{ color: "#374151", fontWeight: "600" }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={createExercise.isPending}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#D63A24" }}
            >
              {createExercise.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>추가</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── ExerciseRow ──────────────────────────────────────────

interface ExerciseRowProps {
  exercise: Exercise;
  isSelected: boolean;
  onToggle: () => void;
  onLongPress: () => void;
}

function ExerciseRow({ exercise, isSelected, onToggle, onLongPress }: ExerciseRowProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isSelected ? "#F0FAF4" : "#fff",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: isSelected ? "#4A9B6F40" : "#EDE8E0",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827" }}>
          {exercise.name}
        </Text>
        {exercise.is_custom && (
          <Text style={{ fontSize: 11, color: "#D63A24", marginTop: 2 }}>
            커스텀 · 길게 눌러 삭제
          </Text>
        )}
      </View>

      {isSelected ? (
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: "#4A9B6F",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>✓</Text>
        </View>
      ) : (
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            borderWidth: 1.5,
            borderColor: "#D1D5DB",
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// ── MuscleSelectScreen ───────────────────────────────────

export default function MuscleSelectScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addModalVisible, setAddModalVisible] = useState(false);

  const { selectedDate, setActiveSessionId } = useWorkoutStore();
  const { data: allExercises = [], isLoading } = useExercises();
  const { data: existingSession } = useSessionByDate(selectedDate);
  const upsertSession = useUpsertSession();
  const addExercise = useAddExercise();
  const deleteExercise = useDeleteExercise();

  const activeGroups = TABS[activeTab].groups;
  const filtered = allExercises.filter((e) =>
    (activeGroups as string[]).includes(e.muscle_group)
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLongPress = (exercise: Exercise) => {
    if (!exercise.is_custom) return;
    Alert.alert(
      "커스텀 운동 삭제",
      `"${exercise.name}"을(를) 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: () => deleteExercise.mutate(exercise.id) },
      ]
    );
  };

  const handleStart = async () => {
    if (selected.size === 0) return;

    let sessionId = existingSession?.id;
    if (!sessionId) {
      const s = await upsertSession.mutateAsync(selectedDate);
      sessionId = s.id;
      setActiveSessionId(sessionId);
    }

    const toAdd = allExercises.filter((e) => selected.has(e.id));
    const base = existingSession?.session_exercises?.length ?? 0;

    for (let i = 0; i < toAdd.length; i++) {
      await addExercise.mutateAsync({
        sessionId: sessionId!,
        exerciseId: toAdd[i].id,
        orderIndex: base + i,
      });
    }

    router.push("/(app)/workout/session");
  };

  const isSubmitting = upsertSession.isPending || addExercise.isPending;
  const canStart = selected.size > 0 && !isSubmitting;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F1EB" }}>
      {/* 헤더 */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
          <Text style={{ color: "#D63A24", fontSize: 15, fontWeight: "600" }}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>운동 선택</Text>
        {selected.size > 0 && (
          <View
            style={{
              marginLeft: 10,
              backgroundColor: "#D63A24",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              {selected.size}
            </Text>
          </View>
        )}
      </View>

      {/* 탭 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", gap: 8 }}
      >
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab.label}
            onPress={() => setActiveTab(i)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 9,
              borderRadius: 22,
              backgroundColor: activeTab === i ? "#D63A24" : "#fff",
              borderWidth: 1,
              borderColor: activeTab === i ? "#D63A24" : "#EDE8E0",
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: activeTab === i ? "#fff" : "#374151",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 운동 목록 */}
      {isLoading ? (
        <ActivityIndicator color="#D63A24" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ExerciseRow
              exercise={item}
              isSelected={selected.has(item.id)}
              onToggle={() => toggle(item.id)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListFooterComponent={
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={{
                marginTop: 8,
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: "center",
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#C4BEB5",
              }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 14 }}>+ 직접 추가</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 48 }}>
              <Text style={{ color: "#9CA3AF", fontSize: 14, marginBottom: 16 }}>
                운동 종목이 없어요
              </Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(true)}
                style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#D63A24", borderRadius: 14 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>+ 직접 추가</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* 하단 시작 버튼 */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
          backgroundColor: "#F5F1EB",
          borderTopWidth: 1,
          borderTopColor: "#EDE8E0",
        }}
      >
        <TouchableOpacity
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.85}
          style={{
            backgroundColor: canStart ? "#D63A24" : "#F0EDE8",
            borderRadius: 18,
            paddingVertical: 18,
            alignItems: "center",
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: canStart ? "#fff" : "#C4BEB5",
              }}
            >
              {selected.size > 0
                ? `${selected.size}개 운동으로 시작`
                : "운동을 선택해주세요"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 커스텀 운동 추가 모달 */}
      <AddExerciseModal
        visible={addModalVisible}
        muscleGroup={TABS[activeTab].groups[0]}
        onClose={() => setAddModalVisible(false)}
      />
    </View>
  );
}

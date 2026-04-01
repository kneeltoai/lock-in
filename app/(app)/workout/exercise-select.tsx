import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useExercisesByMuscle, useCreateExercise, useDeleteExercise } from "@/hooks/useExercises";
import { useUpsertSession, useAddExercise, useSessionByDate } from "@/hooks/useWorkoutSession";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Exercise, MuscleGroup } from "@/types/workout";

const MUSCLE_LABELS: Record<string, string> = {
  chest: "가슴", back: "등", shoulders: "어깨", biceps: "이두",
  triceps: "삼두", core: "복근", quads: "대퇴사두", hamstrings: "햄스트링",
  glutes: "둔근", calves: "종아리", cardio: "유산소", full_body: "전신",
};

// ── 커스텀 종목 추가 모달 ─────────────────────────────────

interface AddExerciseModalProps {
  visible: boolean;
  muscleGroup: MuscleGroup | null;
  onClose: () => void;
}

function AddExerciseModal({ visible, muscleGroup, onClose }: AddExerciseModalProps) {
  const createExercise = useCreateExercise();
  const [name, setName] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("입력 오류", "운동 이름을 입력해주세요.");
      return;
    }
    if (!muscleGroup) return;

    await createExercise.mutateAsync({ name, muscleGroup });
    setName("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/60 justify-center px-6">
        <View className="bg-surface border border-border rounded-2xl p-6">
          <Text className="text-white text-lg font-bold mb-1">커스텀 운동 추가</Text>
          <Text className="text-zinc-500 text-sm mb-4">
            부위: {muscleGroup ? MUSCLE_LABELS[muscleGroup] : ""}
          </Text>

          <TextInput
            className="bg-background border border-border rounded-xl px-4 py-3 text-white mb-4"
            placeholder="운동 이름"
            placeholderTextColor="#52525b"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 border border-border rounded-xl py-3 items-center"
              onPress={() => { setName(""); onClose(); }}
            >
              <Text className="text-zinc-300 font-medium">취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl py-3 items-center"
              onPress={handleSave}
              disabled={createExercise.isPending}
            >
              {createExercise.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold">추가</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────

export default function ExerciseSelectScreen() {
  const { selectedDate, selectedMuscleGroup, setActiveSessionId } = useWorkoutStore();
  const { data: exercises = [], isLoading } = useExercisesByMuscle(selectedMuscleGroup);
  const { data: existingSession } = useSessionByDate(selectedDate);
  const upsertSession = useUpsertSession();
  const addExercise = useAddExercise();
  const deleteExercise = useDeleteExercise();

  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = async (exercise: Exercise) => {
    let sessionId = existingSession?.id;
    if (!sessionId) {
      const session = await upsertSession.mutateAsync(selectedDate);
      sessionId = session.id;
      setActiveSessionId(sessionId);
    }

    const currentCount = existingSession?.session_exercises?.length ?? 0;
    await addExercise.mutateAsync({
      sessionId,
      exerciseId: exercise.id,
      orderIndex: currentCount,
    });

    router.push("/(app)/workout/session");
  };

  const handleLongPress = (exercise: Exercise) => {
    if (!exercise.is_custom) return;
    Alert.alert(
      "커스텀 운동 삭제",
      `"${exercise.name}"을(를) 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => deleteExercise.mutate(exercise.id),
        },
      ]
    );
  };

  const isSubmitting = upsertSession.isPending || addExercise.isPending;

  return (
    <View className="flex-1 bg-background">
      {/* 헤더 */}
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← 뒤로</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-white text-xl font-bold">
              {selectedMuscleGroup ? MUSCLE_LABELS[selectedMuscleGroup] : "운동"} 선택
            </Text>
            <Text className="text-zinc-500 text-sm">{selectedDate}</Text>
          </View>
        </View>
        <TouchableOpacity
          className="bg-surface border border-border rounded-xl px-3 py-2"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-primary text-sm font-medium">+ 직접 추가</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-8" />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-surface border border-border rounded-2xl px-5 py-4 flex-row items-center justify-between"
              onPress={() => handleSelect(item)}
              onLongPress={() => handleLongPress(item)}
              disabled={isSubmitting}
            >
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">{item.name}</Text>
                {item.is_custom && (
                  <Text className="text-primary text-xs mt-0.5">커스텀 · 길게 눌러 삭제</Text>
                )}
              </View>
              {isSubmitting ? (
                <ActivityIndicator color="#6366f1" size="small" />
              ) : (
                <Text className="text-zinc-500 text-lg">+</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Text className="text-zinc-500 text-base mb-4">운동 종목이 없습니다.</Text>
              <TouchableOpacity
                className="bg-primary rounded-2xl px-6 py-3"
                onPress={() => setModalVisible(true)}
              >
                <Text className="text-white font-semibold">+ 직접 추가</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <AddExerciseModal
        visible={modalVisible}
        muscleGroup={selectedMuscleGroup}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

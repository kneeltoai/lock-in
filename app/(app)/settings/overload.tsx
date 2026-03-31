import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useOverloadSettings, useUpsertOverloadSetting } from "@/hooks/useOverload";
import { useExercises } from "@/hooks/useExercises";

export default function OverloadScreen() {
  const { data: settings = [], isLoading } = useOverloadSettings();
  const { data: exercises = [] } = useExercises();
  const upsert = useUpsertOverloadSetting();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [incrementKg, setIncrementKg] = useState("2.5");
  const [sessions, setSessions] = useState("3");

  const getExerciseName = (id: string) =>
    exercises.find((e) => e.id === id)?.name ?? id;

  const handleSave = async () => {
    const inc = parseFloat(incrementKg);
    const sess = parseInt(sessions, 10);
    if (!selectedExerciseId || isNaN(inc) || isNaN(sess)) {
      Alert.alert("입력 오류", "모든 항목을 올바르게 입력해주세요.");
      return;
    }
    await upsert.mutateAsync({
      exerciseId: selectedExerciseId,
      incrementKg: inc,
      sessionsBeforeIncrement: sess,
    });
    setModalVisible(false);
    setSelectedExerciseId("");
  };

  return (
    <View className="flex-1 bg-background">
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← 뒤로</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">점진적 과부하</Text>
        </View>
        <TouchableOpacity
          className="bg-primary px-3 py-2 rounded-xl"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-sm font-semibold">+ 추가</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-12" />
      ) : (
        <FlatList
          data={settings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <View className="bg-surface border border-border rounded-2xl p-4">
              <Text className="text-white font-semibold text-base mb-2">
                {getExerciseName(item.exercise_id)}
              </Text>
              <View className="flex-row gap-4">
                <View>
                  <Text className="text-zinc-500 text-xs">증량</Text>
                  <Text className="text-white text-sm font-medium">{item.increment_kg}kg</Text>
                </View>
                <View>
                  <Text className="text-zinc-500 text-xs">세션 간격</Text>
                  <Text className="text-white text-sm font-medium">{item.sessions_before_increment}회</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center mt-24">
              <Text className="text-zinc-500 text-base">설정된 운동이 없습니다.</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white font-bold text-lg mb-4">과부하 설정 추가</Text>

            {/* Exercise picker */}
            <Text className="text-zinc-400 text-xs mb-2">운동 선택</Text>
            <View className="max-h-36 bg-background border border-border rounded-xl mb-4 overflow-hidden">
              <FlatList
                data={exercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`px-4 py-3 border-b border-border ${
                      selectedExerciseId === item.id ? "bg-primary/20" : ""
                    }`}
                    onPress={() => setSelectedExerciseId(item.id)}
                  >
                    <Text className={`text-sm ${selectedExerciseId === item.id ? "text-primary" : "text-white"}`}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-2">증량 (kg)</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-white"
                  value={incrementKg}
                  onChangeText={setIncrementKg}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-400 text-xs mb-2">세션 간격</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3 text-white"
                  value={sessions}
                  onChangeText={setSessions}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-border rounded-xl py-3 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-zinc-300 font-medium">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3 items-center"
                onPress={handleSave}
                disabled={upsert.isPending}
              >
                {upsert.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-semibold">저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

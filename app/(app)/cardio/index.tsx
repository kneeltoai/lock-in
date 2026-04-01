import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  useCardioLogs,
  useAddCardioLog,
  useDeleteCardioLog,
  CARDIO_TYPE_LABELS,
} from "@/hooks/useCardioLogs";
import { CardioLog, CardioType } from "@/types/workout";

const CARDIO_TYPES = Object.keys(CARDIO_TYPE_LABELS) as CardioType[];

function todayString() {
  return new Date().toISOString().split("T")[0];
}

// ── 카디오 로그 카드 ─────────────────────────────────────

function CardioCard({ log }: { log: CardioLog }) {
  const deleteLog = useDeleteCardioLog();

  const handleDelete = () => {
    Alert.alert("기록 삭제", "이 카디오 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteLog.mutate(log.id) },
    ]);
  };

  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="bg-primary/20 rounded-full px-2 py-0.5">
              <Text className="text-primary text-xs font-semibold">
                {CARDIO_TYPE_LABELS[log.cardio_type]}
              </Text>
            </View>
            <Text className="text-zinc-500 text-xs">{log.date}</Text>
          </View>

          {/* 주요 수치 */}
          <View className="flex-row gap-4 mt-2">
            <View>
              <Text className="text-zinc-500 text-xs">시간</Text>
              <Text className="text-white font-bold text-lg">{log.duration_min}분</Text>
            </View>
            {log.distance_km != null && (
              <View>
                <Text className="text-zinc-500 text-xs">거리</Text>
                <Text className="text-white font-bold text-lg">{log.distance_km}km</Text>
              </View>
            )}
            {log.calories != null && (
              <View>
                <Text className="text-zinc-500 text-xs">칼로리</Text>
                <Text className="text-white font-bold text-lg">{log.calories}kcal</Text>
              </View>
            )}
          </View>

          {log.notes && (
            <Text className="text-zinc-500 text-sm mt-2">{log.notes}</Text>
          )}
        </View>

        <TouchableOpacity onPress={handleDelete} className="p-1 ml-2">
          <Text className="text-zinc-600 text-lg">✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── 추가 모달 ────────────────────────────────────────────

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
}

function AddModal({ visible, onClose }: AddModalProps) {
  const addLog = useAddCardioLog();

  const [cardioType, setCardioType] = useState<CardioType>("running");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setCardioType("running");
    setDuration("");
    setDistance("");
    setCalories("");
    setNotes("");
  };

  const handleSave = async () => {
    const durationMin = parseInt(duration, 10);
    if (isNaN(durationMin) || durationMin <= 0) {
      Alert.alert("입력 오류", "운동 시간을 입력해주세요.");
      return;
    }

    await addLog.mutateAsync({
      date: todayString(),
      cardio_type: cardioType,
      duration_min: durationMin,
      distance_km: distance ? parseFloat(distance) : null,
      calories: calories ? parseInt(calories, 10) : null,
      notes: notes.trim() || null,
    });

    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface border-t border-border rounded-t-3xl p-6">
          <Text className="text-white text-lg font-bold mb-5">카디오 기록 추가</Text>

          {/* 종류 선택 */}
          <Text className="text-zinc-400 text-xs mb-2">종류</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {CARDIO_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setCardioType(type)}
                  className={`px-3 py-2 rounded-full border ${
                    cardioType === type
                      ? "bg-primary border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  <Text className={`text-sm font-medium ${cardioType === type ? "text-white" : "text-zinc-400"}`}>
                    {CARDIO_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* 시간 (필수) */}
          <Text className="text-zinc-400 text-xs mb-2">운동 시간 (분) *</Text>
          <View className="flex-row items-center bg-background border border-border rounded-xl px-4 py-3 mb-4">
            <TextInput
              className="flex-1 text-white"
              placeholder="30"
              placeholderTextColor="#52525b"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
            />
            <Text className="text-zinc-500">분</Text>
          </View>

          {/* 거리 + 칼로리 (선택) */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-zinc-400 text-xs mb-2">거리 (선택)</Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-4 py-3">
                <TextInput
                  className="flex-1 text-white"
                  placeholder="0.0"
                  placeholderTextColor="#52525b"
                  value={distance}
                  onChangeText={setDistance}
                  keyboardType="decimal-pad"
                />
                <Text className="text-zinc-500 text-xs">km</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 text-xs mb-2">칼로리 (선택)</Text>
              <View className="flex-row items-center bg-background border border-border rounded-xl px-4 py-3">
                <TextInput
                  className="flex-1 text-white"
                  placeholder="0"
                  placeholderTextColor="#52525b"
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="number-pad"
                />
                <Text className="text-zinc-500 text-xs">kcal</Text>
              </View>
            </View>
          </View>

          {/* 메모 */}
          <Text className="text-zinc-400 text-xs mb-2">메모 (선택)</Text>
          <TextInput
            className="bg-background border border-border rounded-xl px-4 py-3 text-white mb-6"
            placeholder="메모"
            placeholderTextColor="#52525b"
            value={notes}
            onChangeText={setNotes}
          />

          {/* 버튼 */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 border border-border rounded-2xl py-4 items-center"
              onPress={() => { reset(); onClose(); }}
            >
              <Text className="text-zinc-300 font-medium">취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary rounded-2xl py-4 items-center"
              onPress={handleSave}
              disabled={addLog.isPending}
            >
              {addLog.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold">저장</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── 메인 화면 ─────────────────────────────────────────────

export default function CardioScreen() {
  const { data: logs = [], isLoading } = useCardioLogs();
  const [modalVisible, setModalVisible] = useState(false);

  // 이번 달 총 시간
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthLogs = logs.filter((l) => l.date.startsWith(thisMonth));
  const totalMin = monthLogs.reduce((sum, l) => sum + l.duration_min, 0);
  const totalHours = Math.floor(totalMin / 60);
  const remainMin = totalMin % 60;

  return (
    <View className="flex-1 bg-background">
      {/* 헤더 */}
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← 뒤로</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">카디오 기록</Text>
        </View>
        <TouchableOpacity
          className="bg-primary px-4 py-2 rounded-xl"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-sm font-semibold">+ 기록</Text>
        </TouchableOpacity>
      </View>

      {/* 이번 달 요약 */}
      {monthLogs.length > 0 && (
        <View className="mx-6 mb-4 bg-surface border border-border rounded-2xl p-4">
          <Text className="text-zinc-400 text-xs mb-2">이번 달 총 운동시간</Text>
          <View className="flex-row gap-6">
            <View>
              <Text className="text-white text-2xl font-bold">
                {totalHours > 0 ? `${totalHours}시간 ` : ""}{remainMin}분
              </Text>
            </View>
            <View>
              <Text className="text-zinc-500 text-xs">세션</Text>
              <Text className="text-white font-bold text-lg">{monthLogs.length}회</Text>
            </View>
          </View>
        </View>
      )}

      {/* 목록 */}
      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-12" />
      ) : (
        <ScrollView contentContainerClassName="px-6 pb-32">
          {logs.length === 0 ? (
            <View className="items-center mt-24">
              <Text className="text-zinc-500 text-base">카디오 기록을 추가해보세요!</Text>
              <TouchableOpacity
                className="mt-6 bg-primary rounded-2xl px-6 py-3"
                onPress={() => setModalVisible(true)}
              >
                <Text className="text-white font-semibold">+ 기록 추가</Text>
              </TouchableOpacity>
            </View>
          ) : (
            logs.map((log) => <CardioCard key={log.id} log={log} />)
          )}
        </ScrollView>
      )}

      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

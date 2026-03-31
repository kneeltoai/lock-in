import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  useBodyRecords,
  useAddBodyRecord,
  useUploadBodyPhoto,
  pickBodyPhoto,
} from "@/hooks/useBodyRecords";
import { BodyRecord } from "@/types/workout";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function RecordCard({ record }: { record: BodyRecord }) {
  const uploadPhoto = useUploadBodyPhoto();

  const handlePhotoPress = async () => {
    const uri = await pickBodyPhoto();
    if (!uri) return;
    await uploadPhoto.mutateAsync({ recordId: record.id, imageUri: uri });
  };

  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between">
        {/* Date + weight */}
        <View className="flex-1 mr-4">
          <Text className="text-zinc-400 text-xs">{record.date}</Text>
          {record.weight_kg !== null && (
            <Text className="text-white text-2xl font-bold mt-1">{record.weight_kg}kg</Text>
          )}
          {record.notes && (
            <Text className="text-zinc-500 text-sm mt-1">{record.notes}</Text>
          )}
        </View>

        {/* Photo */}
        <TouchableOpacity onPress={handlePhotoPress} className="relative">
          {record.photo_url ? (
            <Image
              source={{ uri: record.photo_url }}
              className="w-20 h-24 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <View className="w-20 h-24 bg-background border border-dashed border-zinc-700 rounded-xl items-center justify-center">
              {uploadPhoto.isPending ? (
                <ActivityIndicator color="#6366f1" size="small" />
              ) : (
                <Text className="text-zinc-600 text-xs text-center">사진{"\n"}추가</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BodyRecordsScreen() {
  const { data: records = [], isLoading } = useBodyRecords();
  const addRecord = useAddBodyRecord();

  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  // 최근 체중으로 간단한 트렌드 계산
  const weights = records
    .filter((r) => r.weight_kg !== null)
    .map((r) => r.weight_kg as number);

  const latestWeight = weights[0] ?? null;
  const prevWeight = weights[1] ?? null;
  const diff = latestWeight !== null && prevWeight !== null ? latestWeight - prevWeight : null;

  const handleAdd = async () => {
    const wkg = parseFloat(weight);
    await addRecord.mutateAsync({
      date: todayString(),
      weightKg: isNaN(wkg) ? undefined : wkg,
      notes: notes.trim() || undefined,
    });
    setWeight("");
    setNotes("");
    setModalVisible(false);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Text className="text-primary text-base">← 뒤로</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">신체 기록</Text>
        </View>
        <TouchableOpacity
          className="bg-primary px-4 py-2 rounded-xl"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-sm font-semibold">+ 기록</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {latestWeight !== null && (
        <View className="mx-6 mb-4 bg-surface border border-border rounded-2xl p-4">
          <Text className="text-zinc-400 text-xs mb-1">현재 체중</Text>
          <View className="flex-row items-end gap-2">
            <Text className="text-white text-3xl font-bold">{latestWeight}kg</Text>
            {diff !== null && (
              <Text className={`text-sm font-medium mb-1 ${diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-zinc-500"}`}>
                {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}kg
              </Text>
            )}
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-12" />
      ) : (
        <ScrollView contentContainerClassName="px-6 pb-32">
          {records.length === 0 ? (
            <View className="items-center mt-24">
              <Text className="text-zinc-500 text-base">아직 기록이 없습니다.</Text>
            </View>
          ) : (
            records.map((r) => <RecordCard key={r.id} record={r} />)
          )}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-surface border border-border rounded-2xl p-6">
            <Text className="text-white text-lg font-bold mb-4">오늘 기록 추가</Text>

            <View className="flex-row items-center bg-background border border-border rounded-xl px-4 py-3 mb-3">
              <TextInput
                className="flex-1 text-white"
                placeholder="체중"
                placeholderTextColor="#52525b"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text className="text-zinc-500">kg</Text>
            </View>

            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-white mb-4"
              placeholder="메모 (선택)"
              placeholderTextColor="#52525b"
              value={notes}
              onChangeText={setNotes}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-border rounded-xl py-3 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-zinc-300 font-medium">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3 items-center"
                onPress={handleAdd}
                disabled={addRecord.isPending}
              >
                {addRecord.isPending ? (
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

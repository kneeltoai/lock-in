import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { usePlateConfig, useUpsertPlateConfig, PlateSet, calculatePlates } from "@/hooks/useOverload";

const DEFAULT_PLATES: PlateSet[] = [
  { weight_kg: 20, count: 4 },
  { weight_kg: 15, count: 2 },
  { weight_kg: 10, count: 4 },
  { weight_kg: 5,  count: 4 },
  { weight_kg: 2.5, count: 4 },
  { weight_kg: 1.25, count: 4 },
];

export default function PlatesScreen() {
  const { data: config, isLoading } = usePlateConfig();
  const upsert = useUpsertPlateConfig();

  const [barWeight, setBarWeight] = useState(config?.bar_weight_kg?.toString() ?? "20");
  const [plates, setPlates] = useState<PlateSet[]>(config?.plates ?? DEFAULT_PLATES);
  const [previewTarget, setPreviewTarget] = useState("100");

  const updatePlateCount = (index: number, delta: number) => {
    setPlates((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, count: Math.max(0, p.count + delta) } : p
      )
    );
  };

  const handleSave = async () => {
    const bar = parseFloat(barWeight);
    if (isNaN(bar)) {
      Alert.alert("입력 오류", "바 무게를 올바르게 입력해주세요.");
      return;
    }
    await upsert.mutateAsync({ barWeightKg: bar, plates });
    Alert.alert("저장 완료", "원판 설정이 저장되었습니다.");
  };

  const previewPlates = calculatePlates(
    parseFloat(previewTarget) || 0,
    parseFloat(barWeight) || 20,
    plates
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="pt-14 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-primary text-base">← 뒤로</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">원판 설정</Text>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-32">
        {/* Bar weight */}
        <View className="mb-6">
          <Text className="text-zinc-400 text-sm mb-2">바 무게 (kg)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-4 py-3 text-white"
            value={barWeight}
            onChangeText={setBarWeight}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Plates */}
        <Text className="text-zinc-400 text-sm mb-3">원판 보유 개수</Text>
        {plates.map((plate, i) => (
          <View
            key={plate.weight_kg}
            className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
          >
            <Text className="text-white font-medium">{plate.weight_kg}kg</Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => updatePlateCount(i, -2)}
                className="w-8 h-8 bg-background border border-border rounded-full items-center justify-center"
              >
                <Text className="text-white">−</Text>
              </TouchableOpacity>
              <Text className="text-white w-6 text-center font-semibold">{plate.count}</Text>
              <TouchableOpacity
                onPress={() => updatePlateCount(i, 2)}
                className="w-8 h-8 bg-background border border-border rounded-full items-center justify-center"
              >
                <Text className="text-white">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Preview */}
        <View className="mt-6 bg-surface border border-border rounded-2xl p-4">
          <Text className="text-zinc-400 text-sm mb-2">원판 조합 미리보기</Text>
          <View className="flex-row items-center gap-3 mb-3">
            <TextInput
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-white"
              value={previewTarget}
              onChangeText={setPreviewTarget}
              keyboardType="decimal-pad"
              placeholder="목표 무게"
              placeholderTextColor="#52525b"
            />
            <Text className="text-zinc-400">kg</Text>
          </View>
          {previewPlates.length > 0 ? (
            <View>
              <Text className="text-zinc-500 text-xs mb-2">한쪽 당:</Text>
              {previewPlates.map((p) => (
                <Text key={p.weight} className="text-white text-sm">
                  {p.weight}kg × {p.count}장
                </Text>
              ))}
            </View>
          ) : (
            <Text className="text-zinc-600 text-sm">조합 불가</Text>
          )}
        </View>

        {/* Save */}
        <TouchableOpacity
          className="mt-6 bg-primary rounded-2xl py-4 items-center"
          onPress={handleSave}
          disabled={upsert.isPending}
        >
          {upsert.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">저장</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

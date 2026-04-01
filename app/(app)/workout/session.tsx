import { useState, useRef, useEffect, useCallback } from "react";
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
import { useSessionByDate } from "@/hooks/useWorkoutSession";
import { useAddSet, useUpdateSet, useDeleteSet } from "@/hooks/useWorkoutSession";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Equipment, ExerciseSet, SessionExercise } from "@/types/workout";
import { RestTimer } from "@/components/RestTimer";

const DEFAULT_REST_SECONDS = 90;

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "barbell",    label: "바벨" },
  { value: "dumbbell",  label: "덤벨" },
  { value: "machine",   label: "머신" },
  { value: "cable",     label: "케이블" },
  { value: "bodyweight", label: "맨몸" },
  { value: "kettlebell", label: "케틀벨" },
  { value: "band",      label: "밴드" },
];

// ── Set Row ────────────────────────────────────────────

interface SetRowProps {
  set: ExerciseSet;
  setNumber: number;
  onSetCompleted: () => void;
}

function SetRow({ set, setNumber, onSetCompleted }: SetRowProps) {
  const updateSet = useUpdateSet();
  const deleteSet = useDeleteSet();

  const [weight, setWeight] = useState(set.weight_kg?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");

  const commitWeight = () => {
    const val = parseFloat(weight);
    if (!isNaN(val)) updateSet.mutate({ setId: set.id, updates: { weight_kg: val } });
  };

  const commitReps = () => {
    const val = parseInt(reps, 10);
    if (!isNaN(val)) updateSet.mutate({ setId: set.id, updates: { reps: val } });
  };

  const toggleComplete = () => {
    const nowComplete = !set.is_completed;
    updateSet.mutate({ setId: set.id, updates: { is_completed: nowComplete } });
    if (nowComplete) onSetCompleted();
  };

  const handleDelete = () => {
    Alert.alert("세트 삭제", "이 세트를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteSet.mutate(set.id) },
    ]);
  };

  return (
    <View className={`flex-row items-center gap-2 py-2 px-3 rounded-xl mb-1 ${set.is_completed ? "bg-primary/10" : "bg-surface"}`}>
      {/* Set number */}
      <TouchableOpacity onPress={toggleComplete} className="w-7 h-7 rounded-full border border-border items-center justify-center">
        <Text className={`text-xs font-bold ${set.is_completed ? "text-primary" : "text-zinc-500"}`}>
          {setNumber}
        </Text>
      </TouchableOpacity>

      {/* Weight */}
      <View className="flex-1 flex-row items-center bg-background border border-border rounded-xl px-3 py-2">
        <TextInput
          className="flex-1 text-white text-sm"
          value={weight}
          onChangeText={setWeight}
          onBlur={commitWeight}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#52525b"
        />
        <Text className="text-zinc-500 text-xs">kg</Text>
      </View>

      {/* Reps */}
      <View className="flex-1 flex-row items-center bg-background border border-border rounded-xl px-3 py-2">
        <TextInput
          className="flex-1 text-white text-sm"
          value={reps}
          onChangeText={setReps}
          onBlur={commitReps}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#52525b"
        />
        <Text className="text-zinc-500 text-xs">회</Text>
      </View>

      {/* Delete */}
      <TouchableOpacity onPress={handleDelete} className="p-1">
        <Text className="text-zinc-600 text-lg">✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Equipment Selector ────────────────────────────────

interface EquipmentSelectorProps {
  selected: Equipment;
  onChange: (eq: Equipment) => void;
}

function EquipmentSelector({ selected, onChange }: EquipmentSelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
      <View className="flex-row gap-2 py-1">
        {EQUIPMENT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-full border ${
              selected === opt.value
                ? "bg-primary border-primary"
                : "bg-surface border-border"
            }`}
          >
            <Text className={`text-xs font-medium ${selected === opt.value ? "text-white" : "text-zinc-400"}`}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Exercise Card ─────────────────────────────────────

interface ExerciseCardProps {
  sessionExercise: SessionExercise;
  onSetCompleted: () => void;
}

function ExerciseCard({ sessionExercise, onSetCompleted }: ExerciseCardProps) {
  const addSet = useAddSet();
  const [equipment, setEquipment] = useState<Equipment>("barbell");

  const sets = sessionExercise.sets ?? [];

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    addSet.mutate({
      sessionExerciseId: sessionExercise.id,
      set: {
        set_number: sets.length + 1,
        weight_kg: lastSet?.weight_kg ?? null,
        reps: lastSet?.reps ?? null,
        equipment,
        is_completed: false,
      },
    });
  };

  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
      <Text className="text-white font-bold text-lg mb-3">
        {sessionExercise.exercise?.name ?? "운동"}
      </Text>

      {/* Equipment toggle */}
      <EquipmentSelector selected={equipment} onChange={setEquipment} />

      {/* Set header */}
      {sets.length > 0 && (
        <View className="flex-row items-center gap-2 mb-1 px-1">
          <View className="w-7" />
          <Text className="flex-1 text-center text-xs text-zinc-500">무게</Text>
          <Text className="flex-1 text-center text-xs text-zinc-500">횟수</Text>
          <View className="w-6" />
        </View>
      )}

      {/* Sets */}
      {sets.map((set, i) => (
        <SetRow key={set.id} set={set} setNumber={i + 1} onSetCompleted={onSetCompleted} />
      ))}

      {/* Add Set */}
      <TouchableOpacity
        onPress={handleAddSet}
        disabled={addSet.isPending}
        className="mt-2 border border-dashed border-zinc-700 rounded-xl py-3 items-center"
      >
        {addSet.isPending ? (
          <ActivityIndicator color="#6366f1" size="small" />
        ) : (
          <Text className="text-zinc-500 text-sm">+ 세트 추가</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Main Session Screen ───────────────────────────────

export default function SessionScreen() {
  const { selectedDate } = useWorkoutStore();
  const { data: session, isLoading } = useSessionByDate(selectedDate);

  const sessionExercises = session?.session_exercises ?? [];

  // ── 타이머 상태 ──────────────────────────────────────
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerDuration, setTimerDuration] = useState(DEFAULT_REST_SECONDS);
  const [timerRemaining, setTimerRemaining] = useState(DEFAULT_REST_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerVisible(false);
  }, []);

  const startTimer = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerDuration(seconds);
    setTimerRemaining(seconds);
    setTimerVisible(true);
    intervalRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimerVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSetCompleted = useCallback(() => {
    startTimer(DEFAULT_REST_SECONDS);
  }, [startTimer]);

  const handleAdjustTimer = useCallback((delta: number) => {
    setTimerRemaining((prev) => {
      const next = Math.max(5, prev + delta);
      return next;
    });
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <View className="flex-1 bg-background">
      <RestTimer
        visible={timerVisible}
        duration={timerDuration}
        remaining={timerRemaining}
        onSkip={stopTimer}
        onAdjust={handleAdjustTimer}
      />
      {/* Header */}
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary text-base">← 뒤로</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white text-lg font-bold">오늘의 운동</Text>
          <Text className="text-zinc-500 text-sm">{selectedDate}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(app)/workout/muscle-select")}>
          <Text className="text-primary text-sm font-medium">+ 추가</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#6366f1" className="mt-12" />
      ) : (
        <ScrollView contentContainerClassName="px-4 pb-32">
          {sessionExercises.length === 0 ? (
            <View className="items-center mt-24">
              <Text className="text-zinc-500 text-base">운동을 추가해보세요!</Text>
            </View>
          ) : (
            sessionExercises
              .slice()
              .sort((a, b) => a.order_index - b.order_index)
              .map((se) => (
                <ExerciseCard key={se.id} sessionExercise={se} onSetCompleted={handleSetCompleted} />
              ))
          )}
        </ScrollView>
      )}

      {/* FAB — 운동 추가 */}
      <View className="absolute bottom-8 left-0 right-0 px-6">
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center"
          onPress={() => router.push("/(app)/workout/muscle-select")}
        >
          <Text className="text-white font-semibold text-base">+ 운동 추가</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

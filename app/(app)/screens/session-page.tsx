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
import {
  useSessionByDate,
  useAddSet,
  useUpdateSet,
  useDeleteSessionExercise,
  useFinishSession,
  useUpsertSession,
} from "@/hooks/useWorkoutSession";
import { useWorkoutStore } from "@/stores/workoutStore";
import { Equipment, ExerciseSet, SessionExercise } from "@/types/workout";

const DEFAULT_REST = 90;

function todayString() {
  return new Date().toISOString().split("T")[0];
}

// ── SetRow ──────────────────────────────────────────────

interface SetRowProps {
  set: ExerciseSet;
  setNumber: number;
  onCompleted: () => void;
}

function SetRow({ set, setNumber, onCompleted }: SetRowProps) {
  const updateSet = useUpdateSet();
  const [weight, setWeight] = useState(set.weight_kg?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const done = set.is_completed;

  const commitWeight = () => {
    const v = parseFloat(weight);
    if (!isNaN(v)) updateSet.mutate({ setId: set.id, updates: { weight_kg: v } });
  };

  const commitReps = () => {
    const v = parseInt(reps, 10);
    if (!isNaN(v)) updateSet.mutate({ setId: set.id, updates: { reps: v } });
  };

  const toggle = () => {
    const nowComplete = !done;
    updateSet.mutate({ setId: set.id, updates: { is_completed: nowComplete } });
    if (nowComplete) onCompleted();
  };

  return (
    <View
      className="flex-row items-center px-3 py-2.5 rounded-xl mb-1.5"
      style={
        done
          ? { backgroundColor: "#F0FAF4" }
          : { borderWidth: 1, borderStyle: "dashed", borderColor: "#D1FAE5" }
      }
    >
      {/* 세트 번호 */}
      <Text
        className="w-6 text-center text-sm font-bold"
        style={{ color: done ? "#4A9B6F" : "#9CA3AF" }}
      >
        {setNumber}
      </Text>

      {/* kg */}
      <View className="flex-1 flex-row items-center justify-center mx-3">
        <TextInput
          className="text-sm text-center"
          style={{ color: done ? "#166534" : "#111827", minWidth: 36 }}
          value={weight}
          onChangeText={setWeight}
          onBlur={commitWeight}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="#9CA3AF"
        />
        <Text className="text-xs ml-0.5" style={{ color: done ? "#4A9B6F" : "#6B7280" }}>
          kg
        </Text>
      </View>

      {/* 횟수 */}
      <View className="flex-1 flex-row items-center justify-center mx-3">
        <TextInput
          className="text-sm text-center"
          style={{ color: done ? "#166534" : "#111827", minWidth: 28 }}
          value={reps}
          onChangeText={setReps}
          onBlur={commitReps}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#9CA3AF"
        />
        <Text className="text-xs ml-0.5" style={{ color: done ? "#4A9B6F" : "#6B7280" }}>
          회
        </Text>
      </View>

      {/* 체크 */}
      <TouchableOpacity onPress={toggle} className="w-12 items-center py-1">
        {done ? (
          <Text style={{ color: "#4A9B6F", fontSize: 17, fontWeight: "700" }}>✓</Text>
        ) : (
          <Text style={{ color: "#9CA3AF", fontSize: 11 }}>탭 ✓</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── ExerciseCard ────────────────────────────────────────

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "barbell", label: "바벨" },
  { value: "dumbbell", label: "덤벨" },
  { value: "machine", label: "머신" },
  { value: "cable", label: "케이블" },
  { value: "bodyweight", label: "맨몸" },
  { value: "kettlebell", label: "케틀벨" },
  { value: "band", label: "밴드" },
];

interface ExerciseCardProps {
  sessionExercise: SessionExercise;
  onSetCompleted: () => void;
}

function ExerciseCard({ sessionExercise, onSetCompleted }: ExerciseCardProps) {
  const addSet = useAddSet();
  const deleteExercise = useDeleteSessionExercise();
  const [equipment, setEquipment] = useState<Equipment>("barbell");
  const sets = sessionExercise.sets ?? [];
  const allDone = sets.length > 0 && sets.every((s) => s.is_completed);

  const handleDelete = () => {
    Alert.alert(
      "운동 삭제",
      `"${sessionExercise.exercise?.name ?? "운동"}"을(를) 삭제할까요?`,
      [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: () => deleteExercise.mutate(sessionExercise.id) },
      ]
    );
  };

  const handleAddSet = () => {
    const last = sets[sets.length - 1];
    addSet.mutate({
      sessionExerciseId: sessionExercise.id,
      set: {
        set_number: sets.length + 1,
        weight_kg: last?.weight_kg ?? null,
        reps: last?.reps ?? null,
        equipment,
        is_completed: false,
      },
    });
  };

  return (
    <View
      className="bg-surface border border-border rounded-2xl p-4 mb-4"
      style={{ opacity: allDone ? 0.55 : 1 }}
    >
      {/* 헤더 */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-zinc-900 font-bold text-base flex-1">
          {sessionExercise.exercise?.name ?? "운동"}
        </Text>
        <TouchableOpacity onPress={handleDelete} className="p-1 ml-2">
          <Text className="text-zinc-400 text-sm">삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 장비 선택 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2 py-0.5">
          {EQUIPMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setEquipment(opt.value)}
              className="px-3 py-1.5 rounded-full border"
              style={
                equipment === opt.value
                  ? { backgroundColor: "#D63A24", borderColor: "#D63A24" }
                  : { backgroundColor: "#FAFAF9", borderColor: "#EDE8E0" }
              }
            >
              <Text
                className="text-xs font-medium"
                style={{ color: equipment === opt.value ? "#fff" : "#6B7280" }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 세트 헤더 */}
      {sets.length > 0 && (
        <View className="flex-row items-center px-3 mb-1">
          <View className="w-6" />
          <Text className="flex-1 text-center text-xs text-zinc-400 mx-3">무게</Text>
          <Text className="flex-1 text-center text-xs text-zinc-400 mx-3">횟수</Text>
          <View className="w-12" />
        </View>
      )}

      {/* 세트 목록 */}
      {sets.map((set, i) => (
        <SetRow key={set.id} set={set} setNumber={i + 1} onCompleted={onSetCompleted} />
      ))}

      {/* 세트 추가 */}
      <TouchableOpacity
        onPress={handleAddSet}
        disabled={addSet.isPending}
        className="mt-2 py-3 rounded-xl items-center"
        style={{ borderWidth: 1, borderStyle: "dashed", borderColor: "#EDE8E0" }}
      >
        {addSet.isPending ? (
          <ActivityIndicator size="small" color="#D63A24" />
        ) : (
          <Text className="text-zinc-400 text-sm">+ 세트 추가</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── RestTimerStrip ──────────────────────────────────────

interface RestTimerStripProps {
  active: boolean;
  remaining: number;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
}

function RestTimerStrip({ active, remaining, onAdjust, onSkip }: RestTimerStripProps) {
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const timeStr = `${mm}:${String(ss).padStart(2, "0")}`;

  return (
    <View className="flex-row items-center bg-surface border-t border-border px-4 py-3 gap-3">
      <Text
        className="w-14 text-center font-bold text-sm"
        style={{ color: active ? "#D63A24" : "#C4BEB5" }}
      >
        {active ? timeStr : "휴식"}
      </Text>
      <View className="flex-1 flex-row gap-2">
        <TouchableOpacity
          onPress={() => onAdjust(-30)}
          disabled={!active}
          className="flex-1 py-2 rounded-xl items-center"
          style={{ backgroundColor: active ? "#F0EDE8" : "#F7F4F0" }}
        >
          <Text style={{ color: active ? "#374151" : "#C4BEB5", fontSize: 13, fontWeight: "600" }}>
            −30
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSkip}
          disabled={!active}
          className="flex-1 py-2 rounded-xl items-center"
          style={{ backgroundColor: active ? "#D63A24" : "#F7F4F0" }}
        >
          <Text style={{ color: active ? "#fff" : "#C4BEB5", fontSize: 13, fontWeight: "600" }}>
            skip
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onAdjust(30)}
          disabled={!active}
          className="flex-1 py-2 rounded-xl items-center"
          style={{ backgroundColor: active ? "#F0EDE8" : "#F7F4F0" }}
        >
          <Text style={{ color: active ? "#374151" : "#C4BEB5", fontSize: 13, fontWeight: "600" }}>
            +30
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── SessionPage ─────────────────────────────────────────

interface SessionPageProps {
  height: number;
}

export default function SessionPage({ height }: SessionPageProps) {
  const today = todayString();
  const { data: session, isLoading } = useSessionByDate(today);
  const upsertSession = useUpsertSession();
  const finishSession = useFinishSession();
  const { setActiveSessionId } = useWorkoutStore();

  useEffect(() => {
    if (session?.id) setActiveSessionId(session.id);
  }, [session?.id]);

  // ── 경과 타이머 ─────────────────────────────────────
  const [elapsedSec, setElapsedSec] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session || session.ended_at) { setElapsedSec(0); return; }
    const start = session.started_at ? new Date(session.started_at).getTime() : Date.now();
    setElapsedSec(Math.floor((Date.now() - start) / 1000));
    elapsedRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [session?.id, session?.ended_at]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── 휴식 타이머 ─────────────────────────────────────
  const [restActive, setRestActive] = useState(false);
  const [restRemaining, setRestRemaining] = useState(DEFAULT_REST);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRest = useCallback(() => {
    if (restRef.current) { clearInterval(restRef.current); restRef.current = null; }
    setRestActive(false);
    setRestRemaining(DEFAULT_REST);
  }, []);

  const startRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setRestRemaining(DEFAULT_REST);
    setRestActive(true);
    restRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(restRef.current!);
          restRef.current = null;
          setRestActive(false);
          return DEFAULT_REST;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleAdjust = useCallback((delta: number) => {
    setRestRemaining((prev) => Math.max(5, prev + delta));
  }, []);

  useEffect(() => () => { if (restRef.current) clearInterval(restRef.current); }, []);

  // ── 핸들러 ──────────────────────────────────────────
  const handleStartSession = async () => {
    const s = await upsertSession.mutateAsync(today);
    setActiveSessionId(s.id);
    router.push("/(app)/workout/muscle-select");
  };

  const handleFinish = () => {
    if (!session) return;
    Alert.alert("운동 종료", "오늘 운동을 종료할까요?", [
      { text: "취소", style: "cancel" },
      { text: "종료", onPress: () => finishSession.mutate(session.id) },
    ]);
  };

  const handleAddExercise = () => {
    if (!session) return;
    setActiveSessionId(session.id);
    router.push("/(app)/workout/muscle-select");
  };

  const isFinished = !!session?.ended_at;
  const sessionExercises = (session?.session_exercises ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index);

  // ── 로딩 ────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ height }} className="bg-background items-center justify-center">
        <ActivityIndicator color="#D63A24" />
      </View>
    );
  }

  // ── 세션 없음 ────────────────────────────────────────
  if (!session) {
    return (
      <View style={{ height }} className="bg-background items-center justify-center px-8">
        <Text className="text-zinc-500 text-base mb-8 text-center">
          오늘 운동이 없어요{"\n"}시작해볼까요?
        </Text>
        <TouchableOpacity
          className="rounded-2xl py-4 px-10 items-center bg-primary"
          onPress={handleStartSession}
          disabled={upsertSession.isPending}
        >
          {upsertSession.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">운동 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ── 세션 있음 ────────────────────────────────────────
  return (
    <View style={{ height }} className="bg-background">
      {/* 헤더: 좌 공백 / 중 타이머 / 우 종료 */}
      <View className="pt-14 pb-3 px-6 flex-row items-center">
        <View className="flex-1" />
        <View className="flex-1 items-center">
          <Text className="text-zinc-900 font-bold text-xl">
            {isFinished ? "완료 ✓" : formatElapsed(elapsedSec)}
          </Text>
        </View>
        <View className="flex-1 items-end">
          {!isFinished && (
            <TouchableOpacity
              onPress={handleFinish}
              className="px-4 py-2 rounded-xl"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <Text style={{ color: "#D63A24", fontWeight: "600", fontSize: 13 }}>종료</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 운동 카드 스크롤 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sessionExercises.map((se) => (
          <ExerciseCard
            key={se.id}
            sessionExercise={se}
            onSetCompleted={startRest}
          />
        ))}

        {/* + 운동 추가 카드 */}
        {!isFinished && (
          <TouchableOpacity
            onPress={handleAddExercise}
            className="rounded-2xl py-5 items-center mb-2"
            style={{ borderWidth: 1, borderStyle: "dashed", borderColor: "#C4BEB5" }}
          >
            <Text className="text-zinc-400 font-medium">+ 운동 추가</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 휴식 타이머 스트립 (항상 표시) */}
      <RestTimerStrip
        active={restActive}
        remaining={restRemaining}
        onAdjust={handleAdjust}
        onSkip={stopRest}
      />
    </View>
  );
}

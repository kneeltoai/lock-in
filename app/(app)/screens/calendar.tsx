import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSessionsByMonth, useSessionByDate, useUpsertSession, useAddExercise, CalendarSession } from "@/hooks/useWorkoutSession";
import { useRoutines } from "@/hooks/useRoutine";
import { useProfile } from "@/hooks/useProfile";
import { useWorkoutStore } from "@/stores/workoutStore";
import { FloatingSessionButton } from "@/components/FloatingSessionButton";

// ── 상수 ────────────────────────────────────────────────

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const MUSCLE_COLORS: Record<string, string> = {
  chest:      "#f87171",
  back:       "#60a5fa",
  shoulders:  "#fb923c",
  biceps:     "#c084fc",
  triceps:    "#a78bfa",
  core:       "#facc15",
  quads:      "#4ade80",
  hamstrings: "#2dd4bf",
  glutes:     "#f472b6",
  calves:     "#38bdf8",
  cardio:     "#fb7185",
  full_body:  "#e2e8f0",
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: "가슴", back: "등", shoulders: "어깨", biceps: "이두",
  triceps: "삼두", core: "복근", quads: "대퇴", hamstrings: "햄스트링",
  glutes: "둔근", calves: "종아리", cardio: "유산소", full_body: "전신",
};

// ── 헬퍼 ────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayString() {
  const d = new Date();
  return toDateString(d.getFullYear(), d.getMonth(), d.getDate());
}
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
}
function formatElapsed(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── DayCell ──────────────────────────────────────────────

interface DayCellProps {
  day: number;
  dateStr: string;
  isToday: boolean;
  dayOfWeek: number;
  session: CalendarSession | undefined;
  onPress: () => void;
}

function DayCell({ day, isToday, dayOfWeek, session, onPress }: DayCellProps) {
  const completed = !!session?.ended_at;
  const started = !!session?.started_at && !session?.ended_at;
  const dots = session?.muscleGroups.slice(0, 4) ?? [];

  let bg = "transparent";
  let borderStyle: object = {};

  if (isToday) {
    bg = "#D63A24";
  } else if (completed) {
    bg = "#F0FAF4";
    borderStyle = { borderWidth: 1, borderColor: "#4A9B6F40" };
  } else if (started) {
    bg = "#FFF7F5";
    borderStyle = { borderWidth: 1, borderColor: "#D63A2440" };
  }

  const textColor = isToday
    ? "#fff"
    : dayOfWeek === 0
    ? "#EF4444"
    : dayOfWeek === 6
    ? "#3B82F6"
    : completed
    ? "#166534"
    : "#374151";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ width: "14.28%", aspectRatio: 0.8 }}
      activeOpacity={0.7}
    >
      <View
        style={[
          {
            flex: 1,
            margin: 2,
            borderRadius: 10,
            alignItems: "center",
            paddingTop: 6,
            paddingBottom: 4,
            backgroundColor: bg,
          },
          borderStyle,
        ]}
      >
        <Text style={{ fontSize: 13, fontWeight: isToday ? "700" : "500", color: textColor }}>
          {day}
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
            marginTop: 3,
            paddingHorizontal: 2,
          }}
        >
          {dots.map((mg, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: MUSCLE_COLORS[mg] ?? "#D63A24",
              }}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── BottomSheet ──────────────────────────────────────────

interface BottomSheetProps {
  visible: boolean;
  dateStr: string;
  session: CalendarSession | undefined;
  hasRoutine: boolean;
  routineExerciseNames: string[];
  onClose: () => void;
  onContinue: () => void;
  onStartWithRoutine: () => void;
  onStartEmpty: () => void;
  isPending: boolean;
}

function BottomSheet({
  visible, dateStr, session, hasRoutine,
  routineExerciseNames, onClose, onContinue,
  onStartWithRoutine, onStartEmpty, isPending,
}: BottomSheetProps) {
  const hasSession = !!session && (!!session.started_at || !!session.ended_at);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* 딤 배경 */}
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* 시트 본문 */}
      <View
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 48,
        }}
      >
        {/* 드래그 핸들 */}
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#E5E7EB",
            alignSelf: "center",
            marginBottom: 20,
          }}
        />

        {/* 날짜 */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
          {dateStr ? formatDate(dateStr) : ""}
        </Text>

        {hasSession ? (
          // ── 운동 있는 날 ────────────────────────────────
          <>
            {/* 근육군 pills */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 20 }}>
              {(session!.muscleGroups).map((mg, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: "#F9F9F9",
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: "#EDE8E0",
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: MUSCLE_COLORS[mg] ?? "#D63A24",
                    }}
                  />
                  <Text style={{ fontSize: 12, color: "#374151" }}>
                    {MUSCLE_LABELS[mg] ?? mg}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={onContinue}
              style={{
                backgroundColor: "#D63A24",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>이어서 보기</Text>
            </TouchableOpacity>
          </>
        ) : hasRoutine ? (
          // ── 루틴 있는 날, 운동 없음 ─────────────────────
          <>
            {routineExerciseNames.length > 0 && (
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 8, marginBottom: 20 }}>
                {routineExerciseNames.slice(0, 4).join(" · ")}
                {routineExerciseNames.length > 4 ? ` 외 ${routineExerciseNames.length - 4}개` : ""}
              </Text>
            )}

            <TouchableOpacity
              onPress={onStartWithRoutine}
              disabled={isPending}
              style={{
                backgroundColor: "#D63A24",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>루틴으로 시작</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onStartEmpty}
              disabled={isPending}
              style={{
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#EDE8E0",
              }}
            >
              <Text style={{ color: "#374151", fontWeight: "600", fontSize: 15 }}>빈 운동 시작</Text>
            </TouchableOpacity>
          </>
        ) : (
          // ── 루틴도 없는 날 ───────────────────────────────
          <>
            <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, marginBottom: 20 }}>
              등록된 루틴이 없어요
            </Text>

            <TouchableOpacity
              onPress={onStartEmpty}
              disabled={isPending}
              style={{
                backgroundColor: "#D63A24",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>빈 운동 시작하기</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

// ── CalendarScreen ───────────────────────────────────────

interface CalendarScreenProps {
  onGoToSession: () => void;
}

export default function CalendarScreen({ onGoToSession }: CalendarScreenProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sheetDate, setSheetDate] = useState<string | null>(null);

  const { setSelectedDate, setActiveSessionId } = useWorkoutStore();
  const { data: profile } = useProfile();
  const { data: sessions = [] } = useSessionsByMonth(year, month + 1);
  const { data: routines = [] } = useRoutines();
  const { data: todaySession } = useSessionByDate(todayString());
  const upsertSession = useUpsertSession();
  const addExercise = useAddExercise();

  const sessionMap = new Map(sessions.map((s) => [s.date, s]));
  const activeRoutine = routines.find((r) => r.is_active) ?? null;
  const todayStr = todayString();

  const isSessionActive = !!todaySession && !todaySession.ended_at;

  // 플로팅 버튼 경과 시간
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!isSessionActive || !todaySession?.started_at) { setElapsedSec(0); return; }
    const start = new Date(todaySession.started_at).getTime();
    setElapsedSec(Math.floor((Date.now() - start) / 1000));
    const id = setInterval(() => setElapsedSec(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isSessionActive, todaySession?.started_at]);

  // 월 이동
  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  // 그리드 계산
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // 선택된 날짜 데이터
  const sheetSession = sheetDate ? sessionMap.get(sheetDate) : undefined;
  const sheetDayOfWeek = sheetDate ? new Date(sheetDate + "T00:00:00").getDay() : -1;
  const routineForDay = activeRoutine?.routine_exercises?.filter(
    (re) => re.day_of_week === sheetDayOfWeek
  ) ?? [];
  const hasRoutineForDay = routineForDay.length > 0;
  const routineExerciseNames = routineForDay
    .sort((a, b) => a.order_index - b.order_index)
    .map((re) => re.exercise?.name ?? "")
    .filter(Boolean);

  // ── 바텀시트 액션 ───────────────────────────────────────

  const handleContinue = () => {
    if (!sheetDate) return;
    setSheetDate(null);
    setSelectedDate(sheetDate);
    router.push("/(app)/workout/session");
  };

  const handleStartEmpty = async () => {
    if (!sheetDate) return;
    setSheetDate(null);
    const s = await upsertSession.mutateAsync(sheetDate);
    setActiveSessionId(s.id);
    setSelectedDate(sheetDate);
    router.push("/(app)/workout/muscle-select");
  };

  const handleStartWithRoutine = async () => {
    if (!sheetDate || routineForDay.length === 0) return;
    setSheetDate(null);
    const s = await upsertSession.mutateAsync(sheetDate);
    setActiveSessionId(s.id);
    setSelectedDate(sheetDate);
    for (let i = 0; i < routineForDay.length; i++) {
      await addExercise.mutateAsync({
        sessionId: s.id,
        exerciseId: routineForDay[i].exercise_id,
        orderIndex: i,
      });
    }
    router.push("/(app)/workout/session");
  };

  const isPending = upsertSession.isPending || addExercise.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F1EB" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            {profile?.goal ? (
              <>
                <Text style={{ fontSize: 26, fontWeight: "700", color: "#111827", lineHeight: 32 }}>
                  {profile.goal}
                </Text>
                <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                  {year}년 {month + 1}월
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 34, fontWeight: "700", color: "#111827" }}>
                {year}년 {month + 1}월
              </Text>
            )}
          </View>

          {/* 월 이동 */}
          <View style={{ flexDirection: "row", gap: 4, paddingBottom: 4 }}>
            <TouchableOpacity
              onPress={prevMonth}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#EDE8E0", alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#374151", fontSize: 16, lineHeight: 18 }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextMonth}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#EDE8E0", alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#374151", fontSize: 16, lineHeight: 18 }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 요일 헤더 */}
        <View style={{ flexDirection: "row", paddingHorizontal: 4, marginBottom: 4 }}>
          {DAYS.map((d, i) => (
            <Text
              key={d}
              style={{
                width: "14.28%",
                textAlign: "center",
                fontSize: 11,
                fontWeight: "600",
                color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "#9CA3AF",
              }}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* 캘린더 그리드 */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4 }}>
          {cells.map((day, index) => {
            if (day === null) {
              return (
                <View key={`empty-${index}`} style={{ width: "14.28%", aspectRatio: 0.8 }} />
              );
            }
            const dateStr = toDateString(year, month, day);
            const dayOfWeek = (firstDay + day - 1) % 7;
            return (
              <DayCell
                key={day}
                day={day}
                dateStr={dateStr}
                isToday={dateStr === todayStr}
                dayOfWeek={dayOfWeek}
                session={sessionMap.get(dateStr)}
                onPress={() => setSheetDate(dateStr)}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* 플로팅 버튼 (운동 중일 때만) */}
      {isSessionActive && (
        <FloatingSessionButton
          elapsedLabel={formatElapsed(elapsedSec)}
          onTap={onGoToSession}
        />
      )}

      {/* 바텀시트 */}
      <BottomSheet
        visible={!!sheetDate}
        dateStr={sheetDate ?? ""}
        session={sheetSession}
        hasRoutine={hasRoutineForDay}
        routineExerciseNames={routineExerciseNames}
        onClose={() => setSheetDate(null)}
        onContinue={handleContinue}
        onStartWithRoutine={handleStartWithRoutine}
        onStartEmpty={handleStartEmpty}
        isPending={isPending}
      />
    </View>
  );
}

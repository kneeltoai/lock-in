import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { MinimiCharacter } from "@/components/MinimiCharacter";
import { FloatingSessionButton } from "@/components/FloatingSessionButton";
import { useSessionByDate } from "@/hooks/useWorkoutSession";
import { useWeeklyStats } from "@/hooks/useStats";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function formatElapsed(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── StatCard ────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.07)",
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18, marginBottom: 4 }}>
        {value}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textAlign: "center" }}>
        {label}
      </Text>
    </View>
  );
}

// ── MinimiPage ──────────────────────────────────────────

interface MinimiPageProps {
  height: number;
  onGoToSession: () => void;
}

export default function MinimiPage({ height, onGoToSession }: MinimiPageProps) {
  const today = todayString();
  const { data: session } = useSessionByDate(today);
  const { data: stats } = useWeeklyStats();

  const isActive = !!session && !session.ended_at;

  // 경과 시간 (플로팅 버튼 라벨)
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!isActive || !session?.started_at) { setElapsedSec(0); return; }
    const start = new Date(session.started_at).getTime();
    setElapsedSec(Math.floor((Date.now() - start) / 1000));
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, session?.started_at]);

  // 현재 운동명: order_index 가장 높은 session_exercise
  const exercises = session?.session_exercises ?? [];
  const currentName =
    exercises.length > 0
      ? [...exercises].sort((a, b) => b.order_index - a.order_index)[0].exercise?.name ?? null
      : null;

  // 스탯 포맷
  const volStr = stats
    ? stats.weeklyVolume >= 1000
      ? `${(stats.weeklyVolume / 1000).toFixed(1)}t`
      : `${stats.weeklyVolume.toLocaleString()}kg`
    : "—";
  const daysStr = stats ? `${stats.weeklyDays}일` : "—";
  const streakStr = stats ? `${stats.streakDays}일` : "—";

  return (
    <View style={{ height, backgroundColor: "#1A1A2E" }}>
      {/* 현재 운동명 (운동 중일 때만) */}
      <View style={{ paddingTop: 60, alignItems: "center", height: 80, justifyContent: "center" }}>
        {isActive && currentName && (
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, letterSpacing: 0.5 }}>
            {currentName}
          </Text>
        )}
      </View>

      {/* 캐릭터 */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <MinimiCharacter />
      </View>

      {/* 하단 스탯 */}
      <View
        style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 52 }}
      >
        <StatCard label="이번 주 총 kg" value={volStr} />
        <StatCard label="운동일 수" value={daysStr} />
        <StatCard label="연속 달성" value={streakStr} />
      </View>

      {/* 플로팅 버튼 (운동 중일 때만) */}
      {isActive && (
        <FloatingSessionButton elapsedLabel={formatElapsed(elapsedSec)} onTap={onGoToSession} />
      )}
    </View>
  );
}

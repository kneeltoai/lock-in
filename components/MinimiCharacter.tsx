import { View } from "react-native";

// 복서 픽셀아트 placeholder — 이 파일만 교체하면 캐릭터 변경 가능
// 각 View = 픽셀 블록 (8px 단위)
const P = 8; // 픽셀 크기

const SKIN = "#F4A261";
const GLOVE = "#D63A24";
const SHORTS = "#1D3557";
const SHOE = "#2D2D2D";

interface PixelProps {
  top: number;
  left: number;
  w: number;
  h: number;
  color: string;
}

function Px({ top, left, w, h, color }: PixelProps) {
  return (
    <View
      style={{
        position: "absolute",
        top: top * P,
        left: left * P,
        width: w * P,
        height: h * P,
        backgroundColor: color,
      }}
    />
  );
}

export function MinimiCharacter() {
  // 캔버스: 14×18 픽셀 (112×144px)
  return (
    <View style={{ width: 14 * P, height: 18 * P }}>
      {/* 머리 */}
      <Px top={0} left={4} w={6} h={4} color={SKIN} />
      {/* 눈 */}
      <Px top={1} left={5} w={1} h={1} color="#2D2D2D" />
      <Px top={1} left={8} w={1} h={1} color="#2D2D2D" />
      {/* 몸통 */}
      <Px top={4} left={3} w={8} h={5} color={GLOVE} />
      {/* 글러브 좌 */}
      <Px top={4} left={0} w={3} h={3} color={GLOVE} />
      {/* 글러브 우 */}
      <Px top={4} left={11} w={3} h={3} color={GLOVE} />
      {/* 반바지 */}
      <Px top={9} left={3} w={8} h={4} color={SHORTS} />
      {/* 다리 좌 */}
      <Px top={13} left={3} w={3} h={3} color={SKIN} />
      {/* 다리 우 */}
      <Px top={13} left={8} w={3} h={3} color={SKIN} />
      {/* 신발 좌 */}
      <Px top={16} left={2} w={4} h={2} color={SHOE} />
      {/* 신발 우 */}
      <Px top={16} left={8} w={4} h={2} color={SHOE} />
    </View>
  );
}

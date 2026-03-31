# CLAUDE.md — Lock In

## 프로젝트
- Lock In: 헬스 트레이닝 특화 운동 트래커 (iOS/Android)
- 스택: React Native + Expo SDK 54 + Expo Router v6 + Supabase + NativeWind v4
- 네비게이션: react-native-pager-view 기반 좌우 스와이프 3화면 (루틴 / 캘린더 / 프로필)
- 상태관리: Zustand (로컬 UI), TanStack Query (서버 상태)
- 언어: TypeScript strict mode

## 핵심 규칙
- 모든 컴포넌트는 함수형 + TypeScript
- Supabase 쿼리는 반드시 hooks/ 폴더의 커스텀 훅으로 래핑
- 스타일링은 NativeWind className만 사용 (StyleSheet.create 금지)
- 날짜는 항상 YYYY-MM-DD string으로 통일 (Date 객체 변환은 utils에서만)
- 운동 데이터 타입은 types/workout.ts에 정의, 절대 인라인 타입 금지
- 장비(equipment)는 운동 종목이 아니라 세트 기록에 귀속 (같은 운동, 다른 장비 가능)

## 폴더 구조
- app/(auth)/ → 로그인/회원가입 (비인증)
- app/(app)/ → 보호된 앱 라우트
  - index.tsx → PagerView 3화면 (루틴/캘린더/프로필)
  - screens/ → 3개 탭 컴포넌트
  - workout/ → muscle-select, exercise-select, session
  - routine/ → index, edit
  - settings/ → plates, overload
  - body-records/ → index
- hooks/ → Supabase 쿼리 훅 + 비즈니스 로직
- stores/ → authStore, workoutStore
- lib/ → supabase.ts (SecureStore 세션)
- types/ → workout.ts (전역 타입)

## Supabase 테이블 (요약)
- profiles: 유저 프로필 + 설정
- exercises: 운동 종목 (시스템 + 커스텀, 장비 분리 없음)
- workout_sessions: 날짜별 세션
- session_exercises: 세션 내 운동 목록 (순서 포함)
- exercise_sets: 개별 세트 (무게/횟수/장비)
- cardio_logs: 유산소 기록
- weekly_routines: 주간 루틴 템플릿
- routine_exercises: 루틴 내 운동
- plate_configs: 원판 구성
- overload_settings: 점진적 과부하 설정
- body_records: 신체 기록 (몸무게/사진)

## Phase 완료 현황
- [x] Phase 0: 프로젝트 초기 세팅
- [x] Phase 1: Supabase Auth + SecureStore 세션 + 라우트 가드
- [x] Phase 2: Zustand + TanStack Query 기반 + 모든 Supabase 훅
- [x] Phase 3: 캘린더 화면 (월간 뷰, 월 이동, 세션 도트 표시)
- [x] Phase 4: 운동 선택 플로우 (부위 그리드 → 종목 리스트)
- [x] Phase 5: 세트 기록 (무게/횟수 입력, 장비 토글, 세트 완료)
- [x] Phase 6: 루틴 관리 (주간 설정, 12주 캘린더 자동 생성)
- [x] Phase 7: 점진적 과부하 (원판 계산, increment 설정)
- [x] Phase 8: 신체 기록 (몸무게 + Supabase Storage 사진)

## 다음 작업 후보
- 카디오 기록 (cardio_logs)
- 운동 타이머 (세트 간 휴식)
- 1RM 계산 + 운동별 볼륨 차트
- 커스텀 운동 종목 추가
- 12주 캘린더 뷰 (루틴 화면)

# CLAUDE.md — Lock In

## 프로젝트
- Lock In: 헬스 트레이닝 특화 운동 트래커 (iOS/Android)
- 스택: React Native + Expo SDK 54 + Expo Router v6 + Supabase + NativeWind v4
- 네비게이션: react-native-pager-view 기반 좌우 스와이프 3화면 (루틴 / 홈 / 프로필)
  - 홈 안에 세로 스냅 스크롤 (pagingEnabled): [1] 운동 세션 → [2] 미니미 → [3] 캘린더
- 상태관리: Zustand (로컬 UI), TanStack Query (서버 상태)
- 언어: TypeScript strict mode
- 알림: expo-notifications (로컬 푸시)

## 핵심 규칙
- 모든 컴포넌트는 함수형 + TypeScript
- Supabase 쿼리는 반드시 hooks/ 폴더의 커스텀 훅으로 래핑
- 스타일링은 NativeWind className만 사용 (StyleSheet.create 금지)
- 날짜는 항상 YYYY-MM-DD string으로 통일 (Date 객체 변환은 utils에서만)
- 운동 데이터 타입은 types/workout.ts에 정의, 절대 인라인 타입 금지
- 장비(equipment)는 운동 종목이 아니라 세트 기록에 귀속 (같은 운동, 다른 장비 가능)

## 디자인 토큰
- 배경: #F5F1EB / 카드: #ffffff / 카드 테두리: #EDE8E0
- 강조(primary): #D63A24 / 완료: #4A9B6F / 미니미 배경: #1A1A2E

## 폴더 구조
- app/(auth)/ → 로그인/회원가입 (비인증)
- app/(app)/ → 보호된 앱 라우트
  - index.tsx → PagerView 3화면 (루틴/홈/프로필)
  - onboarding.tsx → 최초 닉네임 + 무게 단위 설정
  - screens/ → 3개 탭 컴포넌트 (routine, home, profile)
    - home.tsx 안에 세로 스냅 스크롤 (세션/미니미/캘린더)
  - workout/ → muscle-select, exercise-select, session
  - routine/ → index, edit
  - settings/ → plates, overload, notifications
  - body-records/ → index
  - cardio/ → 유산소 기록
  - stats/ → 통계
- hooks/ → Supabase 쿼리 훅 + 비즈니스 로직
- stores/ → authStore, workoutStore
- components/ → RestTimer.tsx 등 공유 컴포넌트
- lib/ → supabase.ts (SecureStore 세션)
- types/ → workout.ts (전역 타입)

## Supabase 테이블 (요약)
- profiles: 유저 프로필 + 설정 (weight_unit 등)
  - full_name은 auth user_metadata에 저장 (스키마 캐시 이슈 우회)
- exercises: 운동 종목 (is_custom, user_id 컬럼 포함 — 마이그레이션 없이 직접 추가)
- workout_sessions: 날짜별 세션 (started_at, ended_at)
- session_exercises: 세션 내 운동 목록 (order_index)
- exercise_sets: 개별 세트 (weight_kg, reps, equipment, is_completed)
- cardio_logs: 유산소 기록 (cardio_type, duration_min, distance_km, calories)
- weekly_routines: 주간 루틴 템플릿
- routine_exercises: 루틴 내 운동 (day_of_week)
- plate_configs: 원판 구성
- overload_settings: 점진적 과부하 설정
- body_records: 신체 기록 (weight_kg, photo_url)

## 알려진 이슈 / 주의사항
- **profiles PGRST204 에러**: PostgREST 스키마 캐시가 `full_name` 컬럼을 인식 못함
  - 해결책: `full_name`은 `supabase.auth.updateUser({ data: { full_name } })`로 저장
  - `fetchProfile`에서 `data.full_name` 없으면 auth user_metadata에서 보완
- exercises 테이블 `is_custom`, `user_id` 컬럼은 마이그레이션 파일 없이 직접 추가된 것
- Expo Go 원격 푸시 토큰 에러 로그는 무시 (로컬 알림은 정상 동작)

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
- [x] Phase 9: 휴식 타이머, 카디오 기록, 커스텀 운동, 통계

## UI/UX 리디자인 목표 (진행 중)

### 네비게이션 재구성
- PagerView 3탭: 루틴(좌) / 홈(중) / 프로필(우)
- 홈 안 세로 스냅 스크롤 3페이지: 운동 세션 / 미니미 / 캘린더

### 운동 세션 화면
- 상단: 중앙 경과 타이머 + 우측 종료 버튼 (뒤로가기 없음)
- 세트 탭하면 완료 (버튼 없음) / 완료: 초록 배경(#F0FAF4) / 미완료: 점선 테두리
- 하단 고정: 휴식 타이머 스트립 (−30 / +30 / skip)
- 맨 아래: "+ 운동 추가" 카드 / 플로팅 버튼 없음

### 미니미 화면
- 배경: #1A1A2E, 픽셀아트 캐릭터 placeholder
- 하단 스탯 3개: 이번 주 총 kg / 이번 주 운동일 수 / 연속 달성일
- 플로팅 버튼: 56px 원형 #D63A24, 드래그 가능(PanResponder), 탭 시 세션 복귀

### 캘린더 화면
- 목표 있을 때: 목표 텍스트 26px bold + 연월 13px / 없을 때: 연월 34px bold
- 날짜 탭 → 바텀시트: 운동 있는 날/없는 날/루틴 유무에 따라 다른 액션
- 플로팅 버튼 동일하게 표시

### 루틴 탭
- "빈 운동 시작하기" 최상단 크게
- "새 루틴" 카드 크게 + 저장된 루틴 목록
- "루틴 찾기" 제거

### 운동 중 플로팅 버튼
- 미니미/캘린더/루틴 탭에만 표시
- 56px 원형, #D63A24, PanResponder 드래그
- ▶ 아이콘 + 경과 시간, 탭 시 세션 복귀

## 다음 작업 순서
1. profiles PGRST204 버그 수정 (온보딩 정상화)
2. PagerView 3탭 재구성 (루틴/홈/프로필)
3. 홈 내 세로 스냅 스크롤 뼈대
4. 운동 세션 화면 리디자인
5. 미니미 화면
6. 캘린더 리디자인 + 바텀시트
7. 플로팅 버튼 (드래그)
8. 루틴 탭 정리

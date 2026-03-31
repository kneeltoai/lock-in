# CLAUDE.md — Lock In

## 프로젝트
- Lock In: 헬스 트레이닝 특화 운동 트래커 (iOS/Android)
- 스택: React Native + Expo SDK 52 + Expo Router v4 + Supabase + NativeWind
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

## 폴더 구조 핵심
- app/ → Expo Router 파일 기반 라우팅
- components/ → 재사용 UI (calendar/, workout/, timer/, profile/, ui/)
- hooks/ → Supabase 쿼리 훅 + 비즈니스 로직 훅
- stores/ → Zustand 스토어
- lib/ → supabase client, utils, constants
- types/ → 전역 타입 정의

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

## 현재 Phase
- [ ] Phase 0: 프로젝트 초기 세팅 (진행 중)
  - [x] Expo 프로젝트 생성
  - [x] NativeWind + Expo Router 설정
  - [x] react-native-pager-view 스와이프 3화면
  - [x] Supabase 클라이언트 연결
  - [x] CLAUDE.md 작성

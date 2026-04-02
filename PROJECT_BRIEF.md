# Lock In — 프로젝트 브리프

> 헬스 트레이닝 특화 운동 트래커 앱 (iOS/Android)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | React Native + Expo SDK 54 |
| 라우팅 | Expo Router v6 (파일 기반) |
| 스타일링 | NativeWind v4 (Tailwind CSS) |
| 상태관리 | Zustand (로컬 UI) + TanStack Query v5 (서버 상태) |
| 백엔드 | Supabase (PostgreSQL + Auth + Storage) |
| 언어 | TypeScript strict mode |
| 네비게이션 | react-native-pager-view (좌우 스와이프 3탭) |
| 알림 | expo-notifications (로컬 푸시) |

---

## 현재 미해결 버그

### `profiles` 테이블 스키마 캐시 에러
```
PGRST204: Could not find the 'username' column (또는 'full_name') of 'profiles' in the schema cache
```
- **원인**: 온보딩에서 profiles 테이블에 upsert 시도 시 PostgREST가 컬럼을 인식 못 함
- **시도한 것**:
  - `ALTER TABLE profiles ADD COLUMN username text;` → 에러 지속
  - `NOTIFY pgrst, 'reload schema';` → 에러 지속
  - 코드를 `username` → `full_name`으로 변경 → 에러 지속
- **확인 필요**: Supabase Table Editor에서 `profiles` 테이블의 실제 컬럼 목록, RLS 정책이 upsert를 막는지 여부

---

## 완성된 기능 전체 목록

### 인증
- 이메일/비밀번호 로그인 · 회원가입
- SecureStore 기반 세션 유지
- 라우트 가드 (비인증 시 로그인 화면)
- **온보딩** — 첫 로그인 시 닉네임 + 무게단위 설정 (현재 DB 에러로 미작동)

### 메인 3탭 (좌우 스와이프)
- **루틴** — 오늘 배정된 운동 표시, 운동 시작 버튼
- **캘린더** — 월간 뷰, 근육군 컬러 도트, 완료/예정/진행중 불투명도 구별
- **프로필** — 통계 요약(총 세션·이번달·연속일수), 설정 메뉴

### 운동 기록 플로우
1. 부위 그리드 선택 (12개 근육군, 컬러 카드)
2. 종목 리스트 선택 (시스템 운동 + 커스텀 운동)
3. 세트 기록 (무게·횟수·장비 입력, 완료 체크)
4. 세트 완료 시 **휴식 타이머** 자동 시작 (90초, ±30s 조정, 스킵)
5. 운동 추가 / **운동(세션 내) 삭제** / 세트 삭제
6. **운동 종료** 버튼 — `ended_at` 기록, 헤더에 경과 시간 실시간 표시

### 캘린더
- 날짜 셀에 근육군 컬러 도트 표시 (최대 4개)
- **완료** (선명) / **진행 중** (반투명) / **예정** (점선 + 흐릿)
- 세션 있는 날짜 탭 → session 화면 직행 / 없는 날짜 → muscle-select
- 이번 달 완료 기록 리스트 (근육군 도트 포함)
- 근육군 색상 범례

### 루틴 관리
- 주간 루틴 생성/편집 (요일별 운동 배정)
- 활성 루틴 설정
- **기간 자유 선택** — 직접 입력(1~52주) + 프리셋 칩 (1/2/4/6/8/12/16/24주)
- 루틴 기반 세션 자동 생성

### 커스텀 운동 종목
- 운동 선택 화면에서 직접 추가 (이름 + 부위 자동 설정)
- 길게 눌러 삭제 (커스텀만 가능)
- DB: `exercises.is_custom boolean`, `exercises.user_id uuid`

### 점진적 과부하
- 운동별 increment 설정
- 원판 구성 계산기

### 신체 기록
- 날짜별 체중 기록
- Supabase Storage 사진 업로드
- 체중 트렌드 (전회 대비 증감)

### 카디오 기록
- 종류 선택 (러닝·사이클·수영·걷기·줄넘기·로잉·기타)
- 시간(필수) + 거리·칼로리(선택) + 메모
- 이번 달 총 운동시간 요약

### 운동 통계
- 최근 90일 기준
- 운동별 **추정 1RM** (Epley 공식: w × (1 + r/30))
- 최고 중량, 마지막 세션 정보
- **볼륨 바 차트** (최근 10세션, 순수 View 구현)
- 카드 탭으로 펼침/접힘

### 푸시 알림
- 매일 운동 리마인더 (로컬 알림, expo-notifications)
- 시각 직접 설정 (시/분 ▲▼ 조정)
- 토글로 활성화/비활성화
- **주의**: Expo Go에서 원격 푸시 토큰 관련 에러 로그 발생 (로컬 알림은 동작). 해결책: development build 사용

---

## 데이터베이스 스키마 (Supabase)

```
profiles          유저 프로필 (full_name, weight_unit 등 — 실제 컬럼 확인 필요)
exercises         운동 종목 (is_custom boolean, user_id uuid — 직접 추가한 컬럼)
workout_sessions  날짜별 세션 (started_at, ended_at 포함)
session_exercises 세션 내 운동 목록 (order_index)
exercise_sets     개별 세트 (weight_kg, reps, equipment, is_completed)
weekly_routines   주간 루틴 템플릿
routine_exercises 루틴 내 운동 (day_of_week)
plate_configs     원판 구성
overload_settings 점진적 과부하 설정
body_records      신체 기록 (weight_kg, photo_url)
cardio_logs       유산소 기록 (cardio_type, duration_min, distance_km, calories)
```

---

## 파일 구조

```
app/
├── (auth)/           로그인, 회원가입
└── (app)/
    ├── index.tsx     PagerView 3탭 루트
    ├── onboarding.tsx 첫 로그인 온보딩
    ├── _layout.tsx   인증/온보딩 라우트 가드
    ├── screens/      routine.tsx · calendar.tsx · profile.tsx
    ├── workout/      muscle-select → exercise-select → session
    ├── routine/      index · edit
    ├── settings/     plates · overload · notifications
    ├── body-records/ index
    ├── cardio/       index
    └── stats/        index

hooks/
├── useWorkoutSession.ts  (CalendarSession 타입 포함)
├── useExercises.ts       (create/delete 포함)
├── useRoutine.ts         (useGenerateRoutineSessions — 기간 자유 선택)
├── useProfile.ts
├── useOverload.ts
├── useBodyRecords.ts
├── useCardioLogs.ts
├── useStats.ts
└── useNotifications.ts   (lazy require로 Expo Go 대응)

stores/
├── authStore.ts
└── workoutStore.ts

components/
└── RestTimer.tsx

types/workout.ts    (CardioLog, CardioType 포함)
```

---

## 와이어프레임

### 인증 화면

```
┌─────────────────────┐
│      Lock In        │
│   트레이닝에 집중하세요│
│  ┌───────────────┐  │
│  │ 이메일        │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ 비밀번호      │  │
│  └───────────────┘  │
│  [    로그인    ]   │
│  계정이 없으신가요?  │
│      회원가입       │
└─────────────────────┘
```

### 온보딩

```
┌─────────────────────┐
│  환영합니다 👋       │
│  기본 정보를 설정해주세요│
│  닉네임             │
│  ┌───────────────┐  │
│  │               │  │
│  └───────────────┘  │
│  무게 단위          │
│  [  kg  ] [  lbs  ] │
│  [    시작하기    ]  │
└─────────────────────┘
```

### 메인 — 캘린더 탭

```
┌─────────────────────┐
│  루틴  캘린더  프로필 │
├─────────────────────┤
│   ‹    2026년 4월  › │
│ ● 완료 ◌진행중 ⋯예정 │  ← 범례
│ [가슴●][등●][어깨●]  │  ← 근육군 색상 범례
│  일 월 화 수 목 금 토│
│ ┌─┐┌─┐┌─┐┌─┐...    │
│ │ ││ ││ ││●●│        │  ← 근육군 도트
│ └─┘└─┘└─┘└─┘        │
│ (완료=선명, 예정=흐릿)│
│ 이번 달 완료 기록    │
│ ┌─────────────────┐ │
│ │ 2026-04-15  ●●● │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### 세션 화면

```
┌─────────────────────┐
│ ← 뒤로  운동 중  +추가│
│       00:42:15      │  ← 경과 시간
│ 벤치프레스     [삭제]│
│ [바벨][덤벨][머신].. │
│ ① 100kg  8회      ✕ │
│ ② 100kg  8회      ✕ │
│ + 세트 추가         │
│ [+ 운동 추가][종료]  │
└─────────────────────┘
```

### 루틴 기간 선택

```
┌─────────────────────┐
│  캘린더 생성         │
│  ┌─────────────┐    │
│  │     12    주│    │  ← 직접 입력
│  └─────────────┘    │
│  [1주][2주][4주][6주]│  ← 프리셋
│  [8주][12주][16주].. │
│  [취소]    [생성]   │
└─────────────────────┘
```

---

## 남은 작업 후보

- **profiles 스키마 에러 수정** (온보딩 미작동 — 우선순위 높음)
- 앱 아이콘 / 스플래시 이미지 교체 (디자인 파일 준비 후)
- 운동 부위 이미지 교체 (muscle-select 컬러 카드 → 실제 이미지)
- 무게 단위 lbs 변환 실제 적용
- 세션 노트 기능
- 운동 순서 드래그 정렬
- Development build 전환 (Expo Go 한계 해소)

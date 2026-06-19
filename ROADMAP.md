# LottoLab (로또랩) Implementation Roadmap

이 로드맵은 로또랩 서비스의 핵심 기능 및 수익 모델 고도화를 위한 우선순위별 구현 계획서입니다.  
프로젝트를 처음 불러오거나 협업 시, 이 파일의 우선순위(Priority)를 조회하여 순서대로 작업을 진행합니다.

---

## 📌 기능 구현 우선순위 요약 (Priority Overview)

| 우선순위 | 기능명 | 주요 작업 내용 | 상태 |
| :--- | :--- | :--- | :--- |
| **P0** | **로또랩 MVP & 통계 엔진** | 번호 직접 선택 그리드, 홀짝/합계 기본 필터링, 당첨 번호 크롤러 배치 API, 모의 투자 시뮬레이터, AI 꿈 해몽(Gemini 1.5 Flash 연동 및 로컬 폴백) | **완료 (Completed)** |
| **P1** | **정밀 고급 필터 & 성적표** | 연속 번호 차단 필터, 일의 자리 끝수 합 필터, 과거 역대 당첨 데이터 실시간 대조 성적표 모달 구현 | **완료 (Completed)** |
| **P2** | **하이브리드 광고 지면** | 번호 생성 리스트 사이 네이티브 스폰서 카드 배치, 푸터 상단 앵커 광고 배너 추가 | **완료 (Completed)** |
| **P3** | **포트원 결제 & 송금 후원** | PortOne SDK(`iamport.js`) 연동 정기 후원 결제(월 990원), 카카오페이 QR 코드 및 가상 계좌 후원 모달 구현 | **완료 (Completed)** |
| **P4** | **PRO 멤버십 활성화 로직** | 결제/송금 완료 시 `isProMember` 상태 동적 제어, 화면 내 모든 광고(P2) 제거 및 골드 PRO 배지 노출 | **완료 (Completed)** |
| **P5** | **사주/운세 전문 플랫폼 제휴** | 운세 API 연동 및 전문 플랫폼 링크 제휴를 통한 추가 수익 모델 다각화 | *대기 (Backlog)* |

---

## 🛠️ 세부 사양 및 연동 방법

### P0. 로또랩 MVP & 통계 엔진 (Core MVP)
- **번호 선택 및 기본 필터**: `src/lib/lotto.ts` 내 `generateLottoNumbers`에서 고정수(최대 5개)/제외수 검증, 홀짝 비율 및 100~150 합계 범위 제한.
- **당첨 번호 크롤링**: `src/app/api/crawl/route.ts` 호출 시 동행복권 API로 당첨 회차 조회 후 Supabase DB 적재.
- **꿈 해몽 AI**: `src/app/api/dream/route.ts`로 Gemini Flash API 호출하여 유저가 입력한 꿈을 분석하고 행운의 6개 키워드 번호 추천.

### P1. 정밀 고급 필터 & 성적표 (Advanced Analysis)
- **연속 번호 제한**: 연속하는 정렬 숫자 개수 감지 (`getMaxConsecutiveCount`) 및 필터 적용.
- **끝수 합 필터**: 6개 번호의 1의 자리 수 합산 (`calculateEndingSum`) 제어.
- **성적표 모달**: 번호별 역대 당첨 회차 대조(`checkHistoricalPerformance`), 최고 등수와 세부 등수별 당첨 횟수 통계 팝업 출력.

### P2. 하이브리드 광고 지면 (Ad Placement)
- 리스트 렌더링 시 `idx % 3 === 0` 조건으로 스폰서 카드 삽입.
- 대시보드 하단에 반응형 배너 렌더링.

### P3. 포트원 결제 & 송금 후원 (Payment SDK)
- 포트원 SDK 스크립트 비동기 주입: `src/app/page.tsx` 내부 `<Script src="https://cdn.iamport.kr/v1/iamport.js" />`.
- 가맹점 식별코드 `imp36712356` 및 PG `kakaopay.TC00000000` 가상 연동.
- 모의 카카오페이 QR 및 가상계좌(국민은행 990-2026-LOTTOLAB) 팝업 제공.

### P4. PRO 멤버십 활성화 로직 (Ad-Free Premium)
- `localStorage`의 `lottolab_pro` 및 `isProMember` React state 동적 싱크.
- PRO 등급일 경우 헤더에 황금빛 배지 표시, 멤버십 모달 내에서 구독 해지 제공.

### P5. 사주/운세 전문 플랫폼 제휴 (Future Monetization)
- 사주/운세 관련 외부 플랫폼과의 API 연동 또는 추천 링크 제휴를 연계하여 수수료 수익 획득.

---

## 🔍 향후 작업 진행 가이드
이후 새로운 추가 개발이나 수정이 필요할 경우:
1. GitHub에서 본 `ROADMAP.md`를 조회합니다.
2. 미완료된 항목 중 상단에 위치한 우선순위(P5 등)를 확인합니다.
3. 해당 우선순위에 정의된 세부 사양을 파악하고 브랜치를 생성하여 작업을 시작합니다.

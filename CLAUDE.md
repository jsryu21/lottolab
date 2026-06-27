# 프로젝트 개요 및 기술 스택
- 프레임워크: Next.js (App Router 기반)
- 데이터베이스: Supabase (원격 Cloud 인스턴스 직접 연결)
- 호스팅 & 배포: Vercel
- 형상 관리: GitHub (기능별 브랜치 개발 전략)

# 핵심 개발 명령어
- 로컬 서버 실행: `npm run dev`
- 프로덕션 빌드 테스트: `npm run build`
- 린트 체크: `npm run lint`
- 원격 DB 기반 타입 생성: `npx supabase gen types typescript --project-id "내-프로젝트-ID" > types/supabase.ts`

# 원격 Supabase 관리 규칙
1. 본 프로젝트는 로컬 도커(Docker)를 쓰지 않고 원격 Supabase 데이터베이스에 직접 연결되어 있습니다.
2. `.env.local` 파일에 원격 접속용 `NEXT_PUBLIC_SUPABASE_URL` 및 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바르게 세팅되어 있는지 확인하세요.
3. 데이터베이스 테이블 구조(스키마)가 변경된 경우, 반드시 위의 '원격 DB 기반 타입 생성' 명령어를 실행하여 `types/supabase.ts` 파일을 최신화해야 합니다.
4. 모든 DB 수정 작업(테이블 추가, 컬럼 변경 등)은 로컬에서 임의로 처리하지 말고 원격 대시보드 상태를 먼저 확인한 후 코드를 작성하세요.
5. 데이터 유출 방지를 위해 모든 테이블은 반드시 **Row Level Security (RLS)** 설정을 활성화해야 합니다.

# Vercel & GitHub 협업 규칙
1. 모든 환경 변수는 Vercel 대시보드(Environment Variables)에 등록되어 관리되므로, 절대 `.env` 파일들을 GitHub에 커밋하지 마세요.
2. 기능 수정 및 개발은 `main` 브랜치가 아닌 `feature/기능명` 형태의 브랜치에서 진행하세요.
3. 변경 사항을 푸시하기 전, `npm run build`를 로컬에서 실행하여 Next.js 빌드 에러나 타입 에러가 없는지 먼저 확인하세요.

# Next.js 코딩 표준
1. 컴포넌트는 기본적으로 서버 컴포넌트(Server Components)로 작성합니다. 
2. 브라우저 이벤트 핸들러(onClick 등)나 상태(useState) 관리가 필요한 파일 최상단에만 `"use client"`를 명시하세요.
3. 데이터 패칭 및 Supabase 호출은 보안과 초기 로딩 성능을 위해 가급적 서버 컴포넌트 혹은 서버 액션(Server Actions) 영역에서 처리하세요.
4. 모든 파일 경로는 `@/components/...`, `@/lib/...` 와 같은 절대 경로(Path Alias)를 엄격하게 사용하세요.

# Claude 답변 및 행동 가이드
- 코드를 수정하기 전, 구현 계획과 수정할 대상 파일 목록을 사용자에게 1~2줄로 짧게 공유하세요.
- 원격 데이터베이스에 악영향을 줄 수 있는 파괴적인 쿼리나 스키마 변경 제안 시에는 반드시 사용자의 사전 승인을 받으세요.
- 답변은 장황한 설명 대신 정밀하고 깔끔한 코드 블록 위주로 출력하세요.

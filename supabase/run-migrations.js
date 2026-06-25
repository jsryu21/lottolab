#!/usr/bin/env node
/**
 * Supabase 마이그레이션 자동 실행 스크립트
 *
 * 사용법:
 *   SUPABASE_ACCESS_TOKEN=<PAT> node supabase/run-migrations.js
 *
 * PAT 발급: https://supabase.com/dashboard/account/tokens
 */

const PROJECT_REF = "hridzdojseeduqgrnnpz";
const API_BASE = "https://api.supabase.com/v1";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("❌ SUPABASE_ACCESS_TOKEN 환경 변수가 필요합니다.");
  console.error("   PAT 발급: https://supabase.com/dashboard/account/tokens");
  console.error("   실행: SUPABASE_ACCESS_TOKEN=sbp_xxx node supabase/run-migrations.js");
  process.exit(1);
}

async function execSQL(sql, label) {
  const res = await fetch(`${API_BASE}/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    console.error(`❌ [${label}] 실패:`, JSON.stringify(data));
    return false;
  }
  console.log(`✅ [${label}] 완료`);
  return true;
}

async function run() {
  console.log("🚀 LottoLab Supabase 마이그레이션 시작...\n");

  // 1. profiles 테이블 생성
  await execSQL(`
    create table if not exists public.profiles (
      id             uuid primary key references auth.users(id) on delete cascade,
      is_pro         boolean not null default false,
      pro_expires_at timestamptz,
      updated_at     timestamptz default now()
    );
  `, "profiles 테이블 생성");

  // 2. RLS 활성화
  await execSQL(
    `alter table public.profiles enable row level security;`,
    "profiles RLS 활성화"
  );

  // 3. RLS 정책 (본인만 조회/수정)
  await execSQL(`
    do $$ begin
      if not exists (
        select 1 from pg_policies where tablename='profiles' and policyname='Users can read own profile'
      ) then
        create policy "Users can read own profile"
          on public.profiles for select
          using (auth.uid() = id);
      end if;
    end $$;
  `, "profiles SELECT 정책");

  await execSQL(`
    do $$ begin
      if not exists (
        select 1 from pg_policies where tablename='profiles' and policyname='Users can update own profile'
      ) then
        create policy "Users can update own profile"
          on public.profiles for update
          using (auth.uid() = id);
      end if;
    end $$;
  `, "profiles UPDATE 정책");

  // 4. service_role INSERT 정책 (결제 서버가 PRO 상태 기록)
  await execSQL(`
    do $$ begin
      if not exists (
        select 1 from pg_policies where tablename='profiles' and policyname='Service role can upsert profiles'
      ) then
        create policy "Service role can upsert profiles"
          on public.profiles for all
          using (true)
          with check (true);
      end if;
    end $$;
  `, "profiles service_role 정책");

  // 5. 신규 가입 시 profiles 자동 생성 트리거
  await execSQL(`
    create or replace function public.handle_new_user()
    returns trigger language plpgsql security definer as $$
    begin
      insert into public.profiles (id) values (new.id)
      on conflict (id) do nothing;
      return new;
    end;
    $$;
  `, "handle_new_user 함수");

  await execSQL(`
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  `, "on_auth_user_created 트리거");

  // 6. dream_logs RLS 확인
  await execSQL(`
    alter table public.dream_logs enable row level security;
  `, "dream_logs RLS 활성화 (이미 설정된 경우 무시됨)");

  await execSQL(`
    do $$ begin
      if not exists (
        select 1 from pg_policies where tablename='dream_logs' and policyname='Users can read own dream logs'
      ) then
        create policy "Users can read own dream logs"
          on public.dream_logs for select
          using (auth.uid() = user_id);
      end if;
    end $$;
  `, "dream_logs SELECT 정책");

  await execSQL(`
    do $$ begin
      if not exists (
        select 1 from pg_policies where tablename='dream_logs' and policyname='Users can insert own dream logs'
      ) then
        create policy "Users can insert own dream logs"
          on public.dream_logs for insert
          with check (auth.uid() = user_id);
      end if;
    end $$;
  `, "dream_logs INSERT 정책");

  console.log("\n🎉 마이그레이션 완료!");
}

run().catch((err) => {
  console.error("예상치 못한 오류:", err);
  process.exit(1);
});

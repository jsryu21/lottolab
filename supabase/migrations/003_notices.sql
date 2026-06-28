-- notices 테이블 (관리자 공지사항)
create table if not exists public.notices (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  content    text not null,
  is_active  boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.notices enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notices' and policyname = 'anyone can read active notices'
  ) then
    create policy "anyone can read active notices"
      on public.notices for select
      using (is_active = true);
  end if;
end $$;

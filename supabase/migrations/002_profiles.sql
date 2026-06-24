-- profiles 테이블: PRO 멤버십 서버 사이드 저장
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  is_pro     boolean not null default false,
  pro_expires_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 조회/수정 가능
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 신규 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

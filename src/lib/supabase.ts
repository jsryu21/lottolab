import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 설정 여부 확인
export const isSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  supabaseUrl !== "https://your-project-id.supabase.co" &&
  supabaseUrl !== "";

// 빌드 에러 방지를 위해 환경 변수가 없을 경우 placeholder를 사용합니다.
const validUrl = isSupabaseConfigured ? supabaseUrl! : "https://placeholder-project.supabase.co";
const validKey = isSupabaseConfigured ? supabaseAnonKey! : "placeholder-anon-key";

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

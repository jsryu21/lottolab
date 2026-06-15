-- 1. 역대 당첨 번호 테이블 (Crawl 데이터 적재용)
CREATE TABLE IF NOT EXISTS public.draws (
    drw_no BIGINT PRIMARY KEY,
    drw_no_date DATE NOT NULL,
    no1 INT NOT NULL,
    no2 INT NOT NULL,
    no3 INT NOT NULL,
    no4 INT NOT NULL,
    no5 INT NOT NULL,
    no6 INT NOT NULL,
    bonus_no INT NOT NULL,
    tot_sell_amnt BIGINT,
    first_win_amnt BIGINT,
    first_prz_wner_co INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- draws 테이블은 모든 사용자(비로그인 포함)가 조회 가능해야 합니다.
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to draws" ON public.draws
    FOR SELECT USING (true);


-- 2. 로그인한 사용자의 로또 번호 보관함 테이블
CREATE TABLE IF NOT EXISTS public.saved_numbers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    numbers INT[] NOT NULL, -- 6개 번호 배열
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- saved_numbers RLS 설정 (본인 데이터만 CRUD 가능)
ALTER TABLE public.saved_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved numbers" ON public.saved_numbers
    FOR SELECT USING (auth.uid() = user_id);
     
CREATE POLICY "Users can insert their own saved numbers" ON public.saved_numbers
    FOR INSERT WITH CHECK (auth.uid() = user_id);
     
CREATE POLICY "Users can update their own saved numbers" ON public.saved_numbers
    FOR UPDATE USING (auth.uid() = user_id);
     
CREATE POLICY "Users can delete their own saved numbers" ON public.saved_numbers
    FOR DELETE USING (auth.uid() = user_id);


-- 3. 로그인한 사용자의 꿈 해몽 분석 기록 테이블
CREATE TABLE IF NOT EXISTS public.dream_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    dream_text TEXT NOT NULL,
    interpretation TEXT NOT NULL,
    keywords TEXT[] NOT NULL,
    numbers INT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- dream_logs RLS 설정 (본인 데이터만 CR 가능)
ALTER TABLE public.dream_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dream logs" ON public.dream_logs
    FOR SELECT USING (auth.uid() = user_id);
     
CREATE POLICY "Users can insert their own dream logs" ON public.dream_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

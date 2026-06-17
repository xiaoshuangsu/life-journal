-- =============================================================================
-- Life Journal — Database Schema
-- =============================================================================
-- Tables: profiles, entries, analysis_results
-- All tables have Row Level Security (RLS) enabled:
--   Users can ONLY read/write their own data (filtered by user_id = auth.uid())
-- =============================================================================

-- 1. PROFILES TABLE — extends Supabase auth.users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger: new user → new profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ENTRIES TABLE — diary/journal entries
-- ---------------------------------------------------------------------------
-- Note: word_count and entry_date are set by a BEFORE INSERT trigger
-- because GENERATED ALWAYS AS requires IMMUTABLE expressions,
-- and char_length() / cast-to-date are STABLE, not IMMUTABLE in PG.
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  word_count INT NOT NULL DEFAULT 0,
  mood_score DOUBLE PRECISION,              -- -1.0 (very low) to 1.0 (very high), set by AI
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'analyzed' | 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for entries
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON public.entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_status ON public.entries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON public.entries(user_id, created_at DESC);

-- Trigger: auto-set word_count and entry_date on INSERT or UPDATE of content
CREATE OR REPLACE FUNCTION public.set_entry_derived_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.word_count := char_length(NEW.content);
  NEW.entry_date := NEW.created_at::date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_entry_before_upsert ON public.entries;
CREATE TRIGGER on_entry_before_upsert
  BEFORE INSERT OR UPDATE OF content, created_at ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.set_entry_derived_fields();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_entry_update ON public.entries;
CREATE TRIGGER on_entry_update
  BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. ANALYSIS_RESULTS TABLE — AI emotion analysis output
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID UNIQUE NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion_tags TEXT[] NOT NULL DEFAULT '{}',       -- e.g. ['焦虑', '疲惫', '期待']
  primary_emotion TEXT,                             -- e.g. '焦虑'
  mood_score DOUBLE PRECISION,                      -- -1.0 to 1.0
  summary TEXT,                                     -- one-sentence AI summary
  keywords TEXT[] NOT NULL DEFAULT '{}',            -- extracted entities e.g. ['加班', '项目']
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analysis_results
CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON public.analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_entry_id ON public.analysis_results(entry_id);
CREATE INDEX IF NOT EXISTS idx_analysis_analyzed_at ON public.analysis_results(user_id, analyzed_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Principle: Every user can ONLY access rows where user_id = auth.uid()
-- The service_role key bypasses RLS for backend Edge Functions.
-- =============================================================================

-- --- Profiles RLS ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: only the trigger function can insert (handled by SECURITY DEFINER)
DROP POLICY IF EXISTS "Trigger can insert profile" ON public.profiles;
CREATE POLICY "Trigger can insert profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: users can delete their own profile (cascades)
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

-- --- Entries RLS ---
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own entries" ON public.entries;
CREATE POLICY "Users can read own entries"
  ON public.entries
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own entries" ON public.entries;
CREATE POLICY "Users can create own entries"
  ON public.entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
CREATE POLICY "Users can update own entries"
  ON public.entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own entries" ON public.entries;
CREATE POLICY "Users can delete own entries"
  ON public.entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- --- Analysis Results RLS ---
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own analysis" ON public.analysis_results;
CREATE POLICY "Users can read own analysis"
  ON public.analysis_results
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own analysis" ON public.analysis_results;
CREATE POLICY "Users can create own analysis"
  ON public.analysis_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analysis" ON public.analysis_results;
CREATE POLICY "Users can update own analysis"
  ON public.analysis_results
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analysis" ON public.analysis_results;
CREATE POLICY "Users can delete own analysis"
  ON public.analysis_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════
--  Nureal Editor — Supabase Schema
--  Execute no SQL Editor do seu projeto Supabase
-- ══════════════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT,
  name       TEXT,
  avatar_url TEXT,
  plan       TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-criar profile ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'Minha Aplicacao',
  slug          TEXT,
  data          JSONB NOT NULL DEFAULT '{"pages":[],"currentPageId":""}'::JSONB,
  is_published  BOOLEAN DEFAULT FALSE,
  published_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.projects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "projects_own" ON public.projects;
CREATE POLICY "projects_own" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_public_read" ON public.projects;
CREATE POLICY "projects_public_read" ON public.projects
  FOR SELECT USING (is_published = TRUE);

-- ── Storage bucket ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('published-sites', 'published-sites', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "published_sites_public_read" ON storage.objects;
CREATE POLICY "published_sites_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'published-sites');

DROP POLICY IF EXISTS "published_sites_auth_write" ON storage.objects;
CREATE POLICY "published_sites_auth_write" ON storage.objects
  FOR ALL USING (bucket_id = 'published-sites' AND auth.role() = 'authenticated');

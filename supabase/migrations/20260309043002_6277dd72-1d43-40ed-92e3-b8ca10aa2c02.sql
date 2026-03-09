
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enums
CREATE TYPE public.project_type AS ENUM ('web', 'android', 'module', 'stack', 'hybrid');
CREATE TYPE public.project_status AS ENUM ('draft', 'building', 'testing', 'deployed', 'archived');
CREATE TYPE public.module_type AS ENUM ('specialist', 'slm', 'router', 'evaluator', 'critic', 'comparator', 'formatter', 'extractor', 'classifier', 'memory-filter', 'human-gate', 'synthesizer');
CREATE TYPE public.run_status AS ENUM ('pending', 'running', 'success', 'failed', 'paused');

-- Projects
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type public.project_type NOT NULL DEFAULT 'web',
  status public.project_status NOT NULL DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  version_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI Modules
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  type public.module_type NOT NULL DEFAULT 'specialist',
  system_prompt TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  task_boundaries TEXT DEFAULT '',
  allowed_inputs TEXT[] DEFAULT '{}',
  expected_outputs TEXT[] DEFAULT '{}',
  output_format TEXT DEFAULT 'markdown',
  tone TEXT DEFAULT 'professional',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  max_tokens INT NOT NULL DEFAULT 1000,
  constraints TEXT[] DEFAULT '{}',
  guardrails TEXT[] DEFAULT '{}',
  memory_enabled BOOLEAN NOT NULL DEFAULT false,
  tool_access_enabled BOOLEAN NOT NULL DEFAULT false,
  slm_mode BOOLEAN NOT NULL DEFAULT false,
  deterministic_mode BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  provider TEXT DEFAULT 'openai',
  model TEXT DEFAULT 'gpt-4o',
  version_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own modules" ON public.modules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own modules" ON public.modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modules" ON public.modules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own modules" ON public.modules FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stacks
CREATE TABLE public.stacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  version_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stacks" ON public.stacks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own stacks" ON public.stacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stacks" ON public.stacks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stacks" ON public.stacks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_stacks_updated_at BEFORE UPDATE ON public.stacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Test Runs
CREATE TABLE public.runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('module', 'stack')),
  target_id UUID NOT NULL,
  target_name TEXT NOT NULL,
  status public.run_status NOT NULL DEFAULT 'pending',
  steps JSONB NOT NULL DEFAULT '[]',
  version INT NOT NULL DEFAULT 1,
  total_duration_ms INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own runs" ON public.runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own runs" ON public.runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own runs" ON public.runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own runs" ON public.runs FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_modules_user ON public.modules(user_id);
CREATE INDEX idx_stacks_user ON public.stacks(user_id);
CREATE INDEX idx_runs_user ON public.runs(user_id);
CREATE INDEX idx_runs_target ON public.runs(target_type, target_id);

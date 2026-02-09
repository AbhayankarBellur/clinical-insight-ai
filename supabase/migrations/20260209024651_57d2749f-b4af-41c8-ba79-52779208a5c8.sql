
-- Doctor profiles for persisting AI doc config
CREATE TABLE public.doctor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  doctor_config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.doctor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.doctor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.doctor_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX idx_doctor_profiles_user_id ON public.doctor_profiles(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_doctor_profiles_updated_at
BEFORE UPDATE ON public.doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7-day auto-purge function for saved_diagnoses
CREATE OR REPLACE FUNCTION public.purge_old_diagnoses()
RETURNS void AS $$
BEGIN
  DELETE FROM public.saved_diagnoses
  WHERE created_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

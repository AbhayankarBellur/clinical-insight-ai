
-- Saved diagnoses table for doctor history
CREATE TABLE public.saved_diagnoses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_id TEXT NOT NULL UNIQUE,
  doctor_config JSONB NOT NULL,
  patient_summary JSONB NOT NULL,
  diagnosis_data JSONB NOT NULL,
  diagnosis_mode TEXT NOT NULL DEFAULT 'detailed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_diagnoses ENABLE ROW LEVEL SECURITY;

-- Doctors can only see their own saved diagnoses
CREATE POLICY "Users can view own diagnoses"
  ON public.saved_diagnoses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnoses"
  ON public.saved_diagnoses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diagnoses"
  ON public.saved_diagnoses FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookup by user and token
CREATE INDEX idx_saved_diagnoses_user_id ON public.saved_diagnoses(user_id);
CREATE INDEX idx_saved_diagnoses_token_id ON public.saved_diagnoses(token_id);
CREATE INDEX idx_saved_diagnoses_created_at ON public.saved_diagnoses(created_at DESC);

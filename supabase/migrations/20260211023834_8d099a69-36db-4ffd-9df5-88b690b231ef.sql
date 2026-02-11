
-- 1. Update purge function from 7 days to 15 days
CREATE OR REPLACE FUNCTION public.purge_old_diagnoses()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.saved_diagnoses
  WHERE created_at < now() - INTERVAL '15 days';
END;
$function$;

-- 2. Create diagnosis_shares table
CREATE TABLE public.diagnosis_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnosis_id UUID NOT NULL REFERENCES public.saved_diagnoses(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(diagnosis_id, shared_with)
);

ALTER TABLE public.diagnosis_shares ENABLE ROW LEVEL SECURITY;

-- Owner can see shares they created
CREATE POLICY "Owners can view their shares"
  ON public.diagnosis_shares FOR SELECT
  USING (auth.uid() = shared_by);

-- Shared-with doctor can see shares targeting them
CREATE POLICY "Shared doctors can view their shares"
  ON public.diagnosis_shares FOR SELECT
  USING (auth.uid() = shared_with);

-- Only the owner can create shares
CREATE POLICY "Owners can create shares"
  ON public.diagnosis_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

-- Only the owner can delete shares
CREATE POLICY "Owners can delete shares"
  ON public.diagnosis_shares FOR DELETE
  USING (auth.uid() = shared_by);

-- 3. Security definer function to check if a diagnosis is shared with a user
CREATE OR REPLACE FUNCTION public.is_diagnosis_shared_with(_user_id UUID, _diagnosis_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.diagnosis_shares
    WHERE shared_with = _user_id AND diagnosis_id = _diagnosis_id
  )
$$;

-- 4. Drop old restrictive SELECT policy and replace with one that includes shared access
DROP POLICY IF EXISTS "Users can view own diagnoses" ON public.saved_diagnoses;

CREATE POLICY "Users can view own or shared diagnoses"
  ON public.saved_diagnoses FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_diagnosis_shared_with(auth.uid(), id)
  );

-- 5. Add approved_items column to saved_diagnoses for selective print
ALTER TABLE public.saved_diagnoses
  ADD COLUMN IF NOT EXISTS approved_items JSONB DEFAULT NULL;


-- Add DELETE policy for doctor_profiles
CREATE POLICY "Users can delete own profile" ON public.doctor_profiles FOR DELETE USING (auth.uid() = user_id);

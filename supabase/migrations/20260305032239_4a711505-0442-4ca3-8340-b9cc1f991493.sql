-- Create daily request tracking table
CREATE TABLE public.daily_request_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date_ist DATE NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date_ist)
);

ALTER TABLE public.daily_request_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily count"
ON public.daily_request_counts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily count"
ON public.daily_request_counts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily count"
ON public.daily_request_counts FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_daily_request_counts_updated_at
BEFORE UPDATE ON public.daily_request_counts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_ist_date()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
$$;

CREATE OR REPLACE FUNCTION public.check_and_increment_daily_request(
  _user_id UUID,
  _daily_limit INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := public.get_ist_date();
  _current_count INTEGER := 0;
  _next_reset TIMESTAMPTZ;
BEGIN
  _next_reset := ((_today + INTERVAL '1 day') AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC';

  INSERT INTO public.daily_request_counts (user_id, date_ist, request_count)
  VALUES (_user_id, _today, 0)
  ON CONFLICT (user_id, date_ist) DO NOTHING;

  SELECT request_count INTO _current_count
  FROM public.daily_request_counts
  WHERE user_id = _user_id AND date_ist = _today
  FOR UPDATE;

  IF _current_count >= _daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'count', _current_count,
      'limit', _daily_limit,
      'remaining', 0,
      'reset_at_utc', _next_reset
    );
  END IF;

  UPDATE public.daily_request_counts
  SET request_count = request_count + 1
  WHERE user_id = _user_id AND date_ist = _today;

  RETURN jsonb_build_object(
    'allowed', true,
    'count', _current_count + 1,
    'limit', _daily_limit,
    'remaining', _daily_limit - (_current_count + 1),
    'reset_at_utc', _next_reset
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_request_usage(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today DATE := public.get_ist_date();
  _count INTEGER := 0;
  _limit INTEGER := 5;
  _next_reset TIMESTAMPTZ;
BEGIN
  _next_reset := ((_today + INTERVAL '1 day') AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC';

  SELECT COALESCE(request_count, 0) INTO _count
  FROM public.daily_request_counts
  WHERE user_id = _user_id AND date_ist = _today;

  RETURN jsonb_build_object(
    'count', _count,
    'limit', _limit,
    'remaining', _limit - _count,
    'reset_at_utc', _next_reset,
    'date_ist', _today
  );
END;
$$;
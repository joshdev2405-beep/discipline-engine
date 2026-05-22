
CREATE OR REPLACE FUNCTION public.award_xp(_event_type text, _base_xp int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  prof public.profiles%ROWTYPE;
  mult numeric;
  xp int;
  allowed_events text[] := ARRAY['journal_entry','result_entry','trade_closed','daily_target','daily_target_achieved','manual'];
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (_event_type = ANY(allowed_events)) THEN
    RAISE EXCEPTION 'Invalid event_type: %', _event_type;
  END IF;
  IF _base_xp <= 0 OR _base_xp > 200 THEN
    RAISE EXCEPTION 'Invalid base_xp';
  END IF;

  SELECT * INTO prof FROM public.profiles WHERE user_id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  mult := public.streak_multiplier(COALESCE(prof.current_streak, 0));
  xp := round(_base_xp * mult);

  INSERT INTO public.xp_events (user_id, event_type, xp_amount, multiplier)
  VALUES (uid, _event_type, xp, mult);

  UPDATE public.profiles SET
    total_xp = COALESCE(total_xp, 0) + xp,
    updated_at = now()
  WHERE user_id = uid;

  RETURN xp;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_xp(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_xp(text, int) TO authenticated;

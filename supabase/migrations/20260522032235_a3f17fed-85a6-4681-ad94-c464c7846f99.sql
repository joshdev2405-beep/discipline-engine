
-- =============================================
-- 1. ROLE SYSTEM (replace hardcoded admin email)
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed existing admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'rojosh2405@gmail.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. FEEDBACK: switch admin policy to role-based
-- =============================================
DROP POLICY IF EXISTS "Admin can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. PROFILES: restrict SELECT to self, restrict UPDATE columns
-- =============================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Column-level UPDATE: only safe fields
REVOKE UPDATE ON public.profiles FROM authenticated, anon, PUBLIC;
GRANT UPDATE (username, avatar_url, continent, is_guest, has_completed_onboarding, updated_at)
  ON public.profiles TO authenticated;

-- =============================================
-- 4. XP_EVENTS: remove direct client INSERT
-- =============================================
DROP POLICY IF EXISTS "Users can insert own xp_events" ON public.xp_events;
REVOKE INSERT ON public.xp_events FROM authenticated, anon, PUBLIC;

-- =============================================
-- 5. Server-side XP / login functions
-- =============================================
CREATE OR REPLACE FUNCTION public.streak_multiplier(_streak int)
RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _streak >= 14 THEN 2.0
    WHEN _streak >= 7  THEN 1.5
    WHEN _streak >= 3  THEN 1.2
    ELSE 1.0
  END::numeric;
$$;

REVOKE EXECUTE ON FUNCTION public.streak_multiplier(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.streak_multiplier(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_daily_login()
RETURNS TABLE(xp_awarded int, new_streak int, multiplier numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := current_date;
  prof public.profiles%ROWTYPE;
  yest date := current_date - 1;
  new_str int;
  mult numeric;
  xp int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO prof FROM public.profiles WHERE user_id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;

  IF prof.last_login_date = today THEN
    RETURN QUERY SELECT 0, prof.current_streak, 1.0::numeric;
    RETURN;
  END IF;

  INSERT INTO public.daily_logins (user_id, login_date)
  VALUES (uid, today)
  ON CONFLICT DO NOTHING;

  new_str := CASE WHEN prof.last_login_date = yest THEN COALESCE(prof.current_streak, 0) + 1 ELSE 1 END;
  mult := public.streak_multiplier(new_str);
  xp := round(10 * mult);

  INSERT INTO public.xp_events (user_id, event_type, xp_amount, multiplier)
  VALUES (uid, 'daily_login', xp, mult);

  UPDATE public.profiles SET
    last_login_date = today,
    current_streak = new_str,
    longest_streak = GREATEST(new_str, COALESCE(longest_streak, 0)),
    total_xp = COALESCE(total_xp, 0) + xp,
    updated_at = now()
  WHERE user_id = uid;

  RETURN QUERY SELECT xp, new_str, mult;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_daily_login() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_daily_login() TO authenticated;

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
  allowed_events text[] := ARRAY['journal_entry','result_entry','daily_target','manual'];
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT (_event_type = ANY(allowed_events)) THEN
    RAISE EXCEPTION 'Invalid event_type';
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

-- =============================================
-- 6. Lock down other SECURITY DEFINER functions
-- =============================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO authenticated;

-- =============================================
-- 7. Storage: remove duplicate trade-screenshots INSERT policy
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can upload trade screenshots" ON storage.objects;

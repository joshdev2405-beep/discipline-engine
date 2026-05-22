
-- 1. Server-side admin check RPC (no client email leak)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role);
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Protect server-managed columns on profiles via trigger
CREATE OR REPLACE FUNCTION public.protect_profile_server_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only enforce against direct client roles. SECURITY DEFINER RPCs run as table owner.
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.total_xp := OLD.total_xp;
    NEW.current_streak := OLD.current_streak;
    NEW.longest_streak := OLD.longest_streak;
    NEW.last_login_date := OLD.last_login_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_server_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_server_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_server_columns();

-- 3. Explicit deny on direct xp_events inserts from client roles
CREATE OR REPLACE FUNCTION public.deny_client_xp_event_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'Direct writes to xp_events are not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deny_client_xp_event_writes ON public.xp_events;
CREATE TRIGGER trg_deny_client_xp_event_writes
BEFORE INSERT OR UPDATE OR DELETE ON public.xp_events
FOR EACH ROW EXECUTE FUNCTION public.deny_client_xp_event_writes();

-- 4. trade_tags: add explicit UPDATE policy mirroring DELETE/INSERT ownership
DROP POLICY IF EXISTS "Users can update tags on own trades" ON public.trade_tags;
CREATE POLICY "Users can update tags on own trades"
ON public.trade_tags
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.trades
  WHERE trades.id = trade_tags.trade_id AND trades.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trades
  WHERE trades.id = trade_tags.trade_id AND trades.user_id = auth.uid()
));

-- 5. Avatars bucket: remove overly broad public listing policies.
-- Files remain accessible via direct public URL (bucket stays public),
-- but the storage.objects SELECT policy that enables listing is removed.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND qual LIKE '%avatars%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

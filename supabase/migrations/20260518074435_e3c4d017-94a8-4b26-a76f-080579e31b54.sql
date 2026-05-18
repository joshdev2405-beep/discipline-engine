ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, is_guest)
  VALUES (
    NEW.id,
    CASE WHEN NEW.is_anonymous THEN 'Guest-' || floor(random() * 9000 + 100)::int::text
         ELSE 'Operator-' || floor(random() * 9000 + 100)::int::text END,
    COALESCE(NEW.is_anonymous, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
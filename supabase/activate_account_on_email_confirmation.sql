-- Trigger: activate_student_on_email_confirm
--
-- When a student accepts their invite and sets a password, Supabase sets
-- email_confirmed_at on their auth.users row. This trigger watches for that
-- transition (NULL → value) and sets account_status to 'active' in public.profiles.

CREATE OR REPLACE FUNCTION public.activate_profile_on_email_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when email_confirmed_at transitions from NULL to a timestamp
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET account_status = 'active'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_profile_on_email_confirm();

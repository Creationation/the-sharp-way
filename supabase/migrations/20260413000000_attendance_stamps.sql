-- ============================================================
-- Attendance tracking + automatic stamp award
-- ============================================================
-- Adds attendance_status to bookings.
-- A database trigger auto-increments user_loyalty.stamps
-- when a barber marks a booking as 'attended'.
-- After 10 stamps, free_cuts_earned increments and stamps resets to 0.
-- ============================================================

-- 1. Add attendance_status column
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS attendance_status text DEFAULT NULL;

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_attendance_status_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_attendance_status_check
CHECK (attendance_status IN ('attended', 'no_show'));

-- 2. Function: award stamp when booking is marked 'attended'
CREATE OR REPLACE FUNCTION public.award_stamp_on_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when attendance_status changes TO 'attended'
  IF NEW.attendance_status = 'attended' AND
     (OLD.attendance_status IS NULL OR OLD.attendance_status <> 'attended') THEN

    INSERT INTO public.user_loyalty (user_id, stamps, total_points, free_cuts_earned)
    VALUES (NEW.user_id, 1, 50, 0)
    ON CONFLICT (user_id) DO UPDATE
    SET
      total_points    = public.user_loyalty.total_points + 50,
      free_cuts_earned = public.user_loyalty.free_cuts_earned +
        CASE WHEN public.user_loyalty.stamps + 1 >= 10 THEN 1 ELSE 0 END,
      stamps          = CASE
        WHEN public.user_loyalty.stamps + 1 >= 10 THEN 0
        ELSE public.user_loyalty.stamps + 1
      END,
      updated_at      = now();
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger on bookings
DROP TRIGGER IF EXISTS trg_award_stamp_on_attendance ON public.bookings;
CREATE TRIGGER trg_award_stamp_on_attendance
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.award_stamp_on_attendance();

-- 4. Allow service role to update attendance_status (for edge function)
-- RLS is already permissive for admins; the trigger runs as SECURITY DEFINER
-- so it bypasses RLS when updating user_loyalty.

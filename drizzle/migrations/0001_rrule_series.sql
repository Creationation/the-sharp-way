ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recurrence_rrule text;
COMMENT ON COLUMN public.bookings.recurrence_rule IS 'DEPRECATED: replaced by recurrence_rrule (RFC 5545 RRULE string)';
COMMENT ON FUNCTION public.admin_save_appointments(jsonb,date[],uuid,jsonb) IS 'DEPRECATED: replaced by admin_save_series';

CREATE OR REPLACE FUNCTION public.admin_save_series(_booking jsonb, _dates date[], _rrule text DEFAULT NULL, _source_id uuid DEFAULT NULL, _scope text DEFAULT 'this', _series_id uuid DEFAULT NULL, _prev_rrule text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d date; src public.bookings; series uuid; old_series uuid; cutoff date; n integer := 0; i integer := 0; cnt integer; minutes integer;
  b_name text := _booking->>'barber_name'; b_time text := _booking->>'booking_time';
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _scope NOT IN ('this','following','all') THEN RAISE EXCEPTION 'Invalid scope'; END IF;
  IF cardinality(_dates) IS NULL OR cardinality(_dates) < 1 OR cardinality(_dates) > 400 THEN RAISE EXCEPTION 'Invalid occurrence count'; END IF;
  IF b_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Invalid start time'; END IF;
  IF (_booking->>'service_duration') !~ '^[0-9]+ min$' THEN RAISE EXCEPTION 'Invalid duration'; END IF;
  minutes := split_part(_booking->>'service_duration', ' ', 1)::integer;
  IF minutes <= 0 OR (extract(hour from b_time::time)*60 + extract(minute from b_time::time) + minutes) > 1440 THEN RAISE EXCEPTION 'End must be after start on the same day'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.barbers WHERE name = b_name) THEN RAISE EXCEPTION 'Unknown barber'; END IF;
  IF _rrule IS NOT NULL AND length(_rrule) > 500 THEN RAISE EXCEPTION 'Invalid rule'; END IF;

  IF _source_id IS NOT NULL THEN
    SELECT * INTO src FROM public.bookings WHERE id = _source_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
    old_series := src.recurrence_series_id;
  END IF;

  IF _source_id IS NOT NULL AND (_scope = 'this' OR (old_series IS NULL AND _rrule IS NULL)) THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(b_name || _dates[1]::text || left(b_time,2), 0));
    SELECT count(*) INTO cnt FROM public.bookings WHERE barber_name=b_name AND booking_date=_dates[1] AND left(booking_time,2)=left(b_time,2) AND status<>'cancelled' AND id<>_source_id;
    IF cnt >= 10 THEN RAISE EXCEPTION 'Hour full (max. 10): %', _dates[1]; END IF;
    UPDATE public.bookings SET barber_name=b_name, booking_date=_dates[1], booking_time=b_time, service_duration=_booking->>'service_duration', notes=_booking->>'notes' WHERE id=_source_id;
    RETURN 1;
  END IF;

  IF _source_id IS NULL THEN
    series := coalesce(_series_id, CASE WHEN _rrule IS NOT NULL THEN gen_random_uuid() END);
  ELSIF old_series IS NULL THEN
    series := gen_random_uuid();
  ELSIF _scope = 'following' THEN
    cutoff := src.booking_date;
    series := gen_random_uuid();
    UPDATE public.bookings SET recurrence_rrule=_prev_rrule WHERE recurrence_series_id=old_series AND booking_date < cutoff;
    DELETE FROM public.bookings WHERE recurrence_series_id=old_series AND booking_date >= cutoff AND status='confirmed' AND id<>_source_id;
    UPDATE public.bookings SET recurrence_series_id=series, recurrence_rrule=_rrule WHERE recurrence_series_id=old_series AND booking_date >= cutoff;
  ELSE
    cutoff := current_date;
    series := old_series;
    DELETE FROM public.bookings WHERE recurrence_series_id=series AND booking_date >= cutoff AND status='confirmed' AND id<>_source_id;
    UPDATE public.bookings SET recurrence_rrule=_rrule WHERE recurrence_series_id=series;
  END IF;

  FOREACH d IN ARRAY _dates LOOP
    i := i + 1;
    IF d IS NULL THEN RAISE EXCEPTION 'Invalid date'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(b_name || d::text || left(b_time,2), 0));
    IF _source_id IS NOT NULL AND i = 1 THEN
      SELECT count(*) INTO cnt FROM public.bookings WHERE barber_name=b_name AND booking_date=d AND left(booking_time,2)=left(b_time,2) AND status<>'cancelled' AND id<>_source_id;
      IF cnt >= 10 THEN RAISE EXCEPTION 'Hour full (max. 10): %', d; END IF;
      UPDATE public.bookings SET barber_name=b_name, booking_date=d, booking_time=b_time, service_duration=_booking->>'service_duration', notes=_booking->>'notes', recurrence_series_id=series, recurrence_rrule=_rrule WHERE id=_source_id;
    ELSE
      IF series IS NOT NULL AND EXISTS (SELECT 1 FROM public.bookings WHERE recurrence_series_id=series AND booking_date=d AND status<>'cancelled') THEN CONTINUE; END IF;
      SELECT count(*) INTO cnt FROM public.bookings WHERE barber_name=b_name AND booking_date=d AND left(booking_time,2)=left(b_time,2) AND status<>'cancelled';
      IF cnt >= 10 THEN RAISE EXCEPTION 'Hour full (max. 10): %', d; END IF;
      INSERT INTO public.bookings(user_id,barber_name,service_name,service_price,service_duration,booking_date,booking_time,status,notes,recurrence_series_id,recurrence_rrule)
      VALUES(coalesce(src.user_id,(_booking->>'user_id')::uuid), b_name, coalesce(src.service_name,_booking->>'service_name'), coalesce(src.service_price,_booking->>'service_price'), _booking->>'service_duration', d, b_time, 'confirmed', _booking->>'notes', series, _rrule);
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_series(jsonb,date[],text,uuid,text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_series(jsonb,date[],text,uuid,text,uuid,text) TO authenticated, service_role;
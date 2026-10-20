ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recurrence_series_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recurrence_rule jsonb;
CREATE INDEX IF NOT EXISTS bookings_recurrence_series_idx ON public.bookings(recurrence_series_id);
CREATE OR REPLACE FUNCTION public.admin_save_appointments(_booking jsonb, _dates date[], _source_id uuid DEFAULT NULL, _recurrence jsonb DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d date; source public.bookings; series uuid; n integer := 0; hours_count integer; minutes integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF cardinality(_dates) IS NULL OR cardinality(_dates) < 1 OR cardinality(_dates) > 366 THEN RAISE EXCEPTION 'Invalid occurrence count'; END IF;
  IF (_booking->>'booking_time') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Invalid start time'; END IF;
  IF (_booking->>'service_duration') !~ '^[0-9]+ min$' THEN RAISE EXCEPTION 'Invalid duration'; END IF;
  minutes := split_part(_booking->>'service_duration', ' ', 1)::integer;
  IF minutes <= 0 OR (extract(hour from (_booking->>'booking_time')::time)*60 + extract(minute from (_booking->>'booking_time')::time) + minutes) > 1440 THEN RAISE EXCEPTION 'End must be after start on the same day'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.barbers WHERE name = _booking->>'barber_name') THEN RAISE EXCEPTION 'Unknown barber'; END IF;
  IF _source_id IS NOT NULL THEN
    SELECT * INTO source FROM public.bookings WHERE id = _source_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
    series := source.recurrence_series_id;
  END IF;
  IF cardinality(_dates) > 1 THEN series := coalesce(series, gen_random_uuid()); END IF;
  FOREACH d IN ARRAY _dates LOOP
    IF d IS NULL THEN RAISE EXCEPTION 'Invalid date'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended((_booking->>'barber_name') || d::text || left(_booking->>'booking_time',2), 0));
    IF NOT (d = _dates[1] AND _source_id IS NOT NULL) AND series IS NOT NULL AND EXISTS (SELECT 1 FROM public.bookings WHERE recurrence_series_id=series AND booking_date=d AND booking_time=_booking->>'booking_time') THEN CONTINUE; END IF;
    SELECT count(*) INTO hours_count FROM public.bookings WHERE barber_name=_booking->>'barber_name' AND booking_date=d AND left(booking_time,2)=left(_booking->>'booking_time',2) AND status <> 'cancelled' AND (_source_id IS NULL OR id<>_source_id);
    IF hours_count >= 10 THEN RAISE EXCEPTION 'Hour full (max. 10): %', d; END IF;
    IF d = _dates[1] AND _source_id IS NOT NULL THEN
      UPDATE public.bookings SET barber_name=_booking->>'barber_name', booking_date=d, booking_time=_booking->>'booking_time', service_duration=_booking->>'service_duration', notes=_booking->>'notes', recurrence_series_id=series, recurrence_rule=coalesce(_recurrence, recurrence_rule) WHERE id=_source_id;
    ELSE
      INSERT INTO public.bookings(user_id,barber_name,service_name,service_price,service_duration,booking_date,booking_time,status,notes,recurrence_series_id,recurrence_rule)
      VALUES(coalesce(source.user_id,(_booking->>'user_id')::uuid),_booking->>'barber_name',coalesce(source.service_name,_booking->>'service_name'),coalesce(source.service_price,_booking->>'service_price'),_booking->>'service_duration',d,_booking->>'booking_time','confirmed',_booking->>'notes',series,_recurrence);
    END IF;
    n := n+1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_save_appointments(jsonb,date[],uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_appointments(jsonb,date[],uuid,jsonb) TO authenticated, service_role;
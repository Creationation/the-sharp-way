CREATE OR REPLACE FUNCTION public.get_taken_slots(_barbers text[], _from date, _to date)
RETURNS TABLE(barber_name text, booking_date date, booking_time text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.barber_name, b.booking_date, left(b.booking_time, 5)
  FROM public.bookings b
  WHERE b.barber_name = ANY(_barbers) AND b.booking_date BETWEEN _from AND least(_to, _from + 400) AND b.status = 'confirmed'
$$;
REVOKE ALL ON FUNCTION public.get_taken_slots(text[],date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_taken_slots(text[],date,date) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_remove_series(_source_id uuid, _scope text, _mode text DEFAULT 'cancel', _prev_rrule text DEFAULT NULL)
RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE src public.bookings; ids uuid[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _scope NOT IN ('this','following','all') OR _mode NOT IN ('cancel','delete') THEN RAISE EXCEPTION 'Invalid scope'; END IF;
  SELECT * INTO src FROM public.bookings WHERE id = _source_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF _scope = 'this' OR src.recurrence_series_id IS NULL THEN
    ids := ARRAY[_source_id];
  ELSIF _scope = 'following' THEN
    SELECT array_agg(id) INTO ids FROM public.bookings WHERE recurrence_series_id = src.recurrence_series_id AND booking_date >= src.booking_date AND (status = 'confirmed' OR id = _source_id);
    UPDATE public.bookings SET recurrence_rrule = _prev_rrule WHERE recurrence_series_id = src.recurrence_series_id AND booking_date < src.booking_date;
  ELSE
    SELECT array_agg(id) INTO ids FROM public.bookings WHERE recurrence_series_id = src.recurrence_series_id AND booking_date >= least(current_date, src.booking_date) AND (status = 'confirmed' OR id = _source_id);
    UPDATE public.bookings SET recurrence_rrule = NULL WHERE recurrence_series_id = src.recurrence_series_id;
  END IF;
  IF _mode = 'delete' THEN
    DELETE FROM public.bookings WHERE id = ANY(ids);
  ELSE
    UPDATE public.bookings SET status = 'cancelled', recurrence_rrule = CASE WHEN _scope = 'this' THEN recurrence_rrule ELSE NULL END WHERE id = ANY(ids);
  END IF;
  RETURN coalesce(ids, ARRAY[]::uuid[]);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_remove_series(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_remove_series(uuid,text,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.service_extend_series(_series_id uuid, _dates date[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.bookings; d date; n integer := 0; cnt integer;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin')) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF cardinality(_dates) IS NULL OR cardinality(_dates) > 400 THEN RAISE EXCEPTION 'Invalid occurrence count'; END IF;
  SELECT * INTO t FROM public.bookings WHERE recurrence_series_id = _series_id AND recurrence_rrule IS NOT NULL ORDER BY booking_date DESC LIMIT 1;
  IF NOT FOUND THEN RETURN 0; END IF;
  FOREACH d IN ARRAY _dates LOOP
    IF d IS NULL OR d <= t.booking_date THEN CONTINUE; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(t.barber_name || d::text || left(t.booking_time,2), 0));
    IF EXISTS (SELECT 1 FROM public.bookings WHERE recurrence_series_id = _series_id AND booking_date = d) THEN CONTINUE; END IF;
    SELECT count(*) INTO cnt FROM public.bookings WHERE barber_name = t.barber_name AND booking_date = d AND left(booking_time,2) = left(t.booking_time,2) AND status <> 'cancelled';
    IF cnt >= 10 THEN CONTINUE; END IF;
    INSERT INTO public.bookings(user_id,barber_name,service_name,service_price,service_duration,booking_date,booking_time,status,notes,recurrence_series_id,recurrence_rrule)
    VALUES(t.user_id,t.barber_name,t.service_name,t.service_price,t.service_duration,d,t.booking_time,'confirmed',t.notes,_series_id,t.recurrence_rrule);
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.service_extend_series(uuid,date[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.service_extend_series(uuid,date[]) TO authenticated, service_role;
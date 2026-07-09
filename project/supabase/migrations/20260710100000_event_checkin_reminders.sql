-- Check-in por token (admin del club) + lectura de token por admin

ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS check_in_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE OR REPLACE FUNCTION public.set_event_participant_check_in_token()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.check_in_token IS NULL OR NEW.check_in_token = '' THEN
    NEW.check_in_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_participant_check_in_token ON event_participants;
CREATE TRIGGER trg_event_participant_check_in_token
  BEFORE INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_event_participant_check_in_token();

CREATE OR REPLACE FUNCTION public.check_in_event_participant(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant event_participants%ROWTYPE;
  v_event events%ROWTYPE;
  v_profile profiles%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RAISE EXCEPTION 'TOKEN_INVALID' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_participant
  FROM event_participants
  WHERE check_in_token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TOKEN_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.is_org_admin_of(v_participant.organization_id) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF v_participant.checked_in_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_CHECKED_IN' USING ERRCODE = 'P0001';
  END IF;

  UPDATE event_participants
  SET checked_in_at = now(),
      status = 'attended'
  WHERE id = v_participant.id;

  SELECT * INTO v_event FROM events WHERE id = v_participant.event_id;

  IF v_participant.user_id IS NOT NULL THEN
    SELECT * INTO v_profile FROM profiles WHERE user_id = v_participant.user_id;
  END IF;

  RETURN jsonb_build_object(
    'participantId', v_participant.id,
    'eventId', v_participant.event_id,
    'eventTitle', coalesce(v_event.title, 'Evento'),
    'attendeeName', coalesce(v_profile.full_name, 'Participante'),
    'checkedInAt', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_in_event_participant(text) TO authenticated;

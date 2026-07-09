-- Corrige textos con mojibake en seeds (APPLY_SEED_AND_PHASES pegado con encoding roto).
-- Ejecutar en Supabase SQL Editor si ya aplicaste el bundle antes de la corrección.

UPDATE achievements
SET display_name = 'Reservaste instalación o mesa'
WHERE name = 'first_reservation'
  AND display_name LIKE '%instalaci%';

UPDATE tournament_participants
SET team_name = 'Equipo García'
WHERE team_name LIKE 'Equipo Garc%';

UPDATE tournament_participants
SET team_name = 'Equipo López'
WHERE team_name LIKE 'Equipo L%pez' AND team_name NOT LIKE '%Garc%';

UPDATE tournament_participants
SET team_name = 'Equipo Martín'
WHERE team_name LIKE 'Equipo Mart%';

UPDATE tournament_participants
SET team_name = 'Equipo Núñez'
WHERE team_name LIKE 'Equipo N%';

-- Función de conflicto de reservas (mensaje de error)
CREATE OR REPLACE FUNCTION public.check_reservation_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_exists boolean;
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed') OR NEW.start_time IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM reservations r
    WHERE r.organization_id = NEW.organization_id
      AND r.id IS DISTINCT FROM NEW.id
      AND r.status IN ('pending', 'confirmed')
      AND r.start_time IS NOT NULL
      AND (
        (NEW.facility_id IS NOT NULL AND r.facility_id = NEW.facility_id)
        OR (NEW.space_id IS NOT NULL AND r.space_id = NEW.space_id)
        OR (
          NEW.restaurant_id IS NOT NULL
          AND r.restaurant_id = NEW.restaurant_id
          AND COALESCE(NEW.space_id, '00000000-0000-0000-0000-000000000000'::uuid)
            = COALESCE(r.space_id, '00000000-0000-0000-0000-000000000000'::uuid)
        )
      )
      AND tstzrange(
        NEW.start_time,
        COALESCE(NEW.end_time, NEW.start_time + interval '60 minutes'),
        '[)'
      ) && tstzrange(
        r.start_time,
        COALESCE(r.end_time, r.start_time + interval '60 minutes'),
        '[)'
      )
  ) INTO conflict_exists;

  IF conflict_exists THEN
    RAISE EXCEPTION 'Este horario ya no está disponible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

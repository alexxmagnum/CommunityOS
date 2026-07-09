# Cómo aplicar la base de datos (Supabase)

Guía única para dejar tu base de datos al día. Todos los scripts son
**idempotentes**: puedes ejecutarlos varias veces sin romper nada.

## Orden de ejecución

Abre **Supabase → SQL Editor** y ejecuta, en este orden, pegando el contenido
de cada archivo y pulsando **Run**:

> **Atajo:** abre `SUPABASE_PEGAR_COMPLETO.sql` (todo en un solo archivo, ~3200
> líneas). Copia **todo** (Ctrl+A) y pégalo en el SQL Editor → **Run** una vez.
> Si da timeout, usa los archivos sueltos de la tabla de abajo, uno por uno.

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `APPLY_ALL.sql` | Esquema base: tablas, índices, RLS inicial, roles, seed IKON (migraciones 1–3). |
| 2 | `APPLY_SEED_AND_PHASES.sql` | Fases 1–4: notificaciones, invitaciones, lista de espera, torneos, analytics, pagos, storage, carta pública. |
| 3 | `APPLY_FIXES_FINAL.sql` | Estado final correcto de RLS, aislamiento multi-tenant y funciones RPC. |
| 4 | `migrations/20260710100000_event_checkin_reminders.sql` | Acreditación por token (RPC) y columna `check_in_token` en inscripciones. |
| 5 | `migrations/20260711100000_ikon_branding_preset.sql` | Preset visual IKON en `organization_settings` (hero cinemático + splash). |
| 6 | `FIX_IKON_UTF8.sql` | **Solo si ya pegaste un SQL con caracteres rotos** (`pasiÃ³n`, `mÃ¡gico`, etc.): corrige los textos IKON en la base. |
| 7 | `FIX_SEED_UTF8.sql` | Corrige seeds generales (equipos torneo, logros, mensaje reservas) si ves `GarcÃ­a` o similar. |
| 8 | `FIX_S2_DOMAINS_RLS.sql` | Dominios custom (`get_slug_by_domain`), FK roles, políticas analytics/friendships/payments. |
| 8b | `migrations/20260713100000_s2_domains_rls.sql` | Mismo contenido que paso 8 (fuente versionada). |

Si tu base **ya existe** y solo quieres asegurarte de que las políticas y
funciones están bien, basta con ejecutar el paso **3** (`APPLY_FIXES_FINAL.sql`).

Si el hero de IKON muestra `pasiÃ³n` o `PANORÃ¡MICA`, ejecuta el paso **6**
(`FIX_IKON_UTF8.sql`) o recarga la app tras el último código (fallback automático).

## Asignar administrador

Al final de `APPLY_FIXES_FINAL.sql` hay una sección **SEED ADMIN** comentada.
Descoméntala, cambia el email por el real (el usuario debe existir en
**Authentication → Users**) y ejecútala para asignar:

- **Admin de plataforma** (super admin de Community OS).
- **Dueño de un club** (por defecto `ikon`).

## Comprobación rápida

```sql
-- ¿Soy admin de plataforma?
SELECT u.email, pa.role
FROM platform_admins pa
JOIN auth.users u ON u.id = pa.user_id
WHERE lower(u.email) = lower('tu-email@ejemplo.com');

-- ¿De qué clubs soy miembro y con qué rol?
SELECT o.name, r.name AS rol, om.status
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN roles r ON r.id = om.role_id
JOIN auth.users u ON u.id = om.user_id
WHERE lower(u.email) = lower('tu-email@ejemplo.com');
```

## Notas

- Los antiguos `FIX_*.sql` quedaron **consolidados** en `APPLY_FIXES_FINAL.sql`.
  Si los ves en el historial de git, ya no hace falta ejecutarlos.
- La carpeta `migrations/` es la fuente de verdad versionada. Los `APPLY_*.sql`
  son simplemente esas migraciones agrupadas para pegar cómodamente en el editor.

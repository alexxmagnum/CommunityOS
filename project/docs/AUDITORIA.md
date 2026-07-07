# Auditoría Community OS — Estado actual vs Master Prompt

**Fecha:** Julio 2026  
**Repositorio:** `project/`  
**Tenant demo:** IKON (`/o/ikon`)

---

## Resumen ejecutivo

Community OS es un **MVP multi-tenant funcional** con buena arquitectura base, pero **no cumple aún** la visión completa del Master Prompt. La plataforma puede demostrarse como demo (IKON), pero los motores de negocio centrales — reservas universales, torneos, comunidad y recomendaciones personalizadas — están en esqueleto o ausentes.

| Dimensión | Completitud |
|-----------|-------------|
| Arquitectura multi-tenant | ~75% |
| Esquema de base de datos | ~80% |
| App miembro (homepage, discovery) | ~60% |
| Motor de reservas universal | ~30% |
| Restaurante | ~45% |
| Deportes | ~35% |
| Torneos | ~10% |
| Eventos | ~70% |
| Comunidad | ~15% |
| Recomendaciones | ~20% |
| Super Admin | ~55% |
| Org Admin | ~60% |
| Branding white-label | ~50% |
| Infra / docs / tests | ~25% |

---

## Lo construido

### Stack
- Next.js 16, React 18, TypeScript, Tailwind, shadcn/ui
- Supabase (auth, Postgres, RLS)
- Tres superficies: miembro (`/o/[slug]`), org admin (`/dashboard`), super admin (`/platform-admin`)

### Multi-tenant
- `organization_id` en tablas tenant + RLS en 24 tablas
- Branding por org (colores, logo, favicon)
- Módulos por tenant y tiers de suscripción
- Super admin: CRUD de organizaciones

### Funcionalidad operativa
- Homepage con discovery por reglas (`generate-prompts.ts`)
- Carta digital + admin de menú
- Eventos: listado, detalle, registro, admin CRUD
- Reservas básicas (instalaciones + restaurante)
- Auth email/password con roles (`org_owner`, `org_admin`, `org_member`, `platform_admin`)
- Fallback demo cuando Supabase no tiene datos

---

## Brechas críticas vs Master Prompt

### Producto
| Módulo | Gap principal |
|--------|---------------|
| Homepage viva | Sin clima, amigos, mesas en tiempo real, agenda completa |
| Discovery | Reglas estáticas, no personalizado por usuario |
| Reservas universales | Sin `time_slots`, sin disponibilidad, sin conflictos |
| Torneos | Schema SQL completo, cero UI |
| Comunidad | Módulo más débil: sin friends, badges, perfiles ricos |
| Recomendaciones | No usa historial, favoritos, clima, amigos |
| Restaurante | Sin pre-pedido, maridaje, terraza vs mesa, fotos reales |
| White-label | IKON hardcodeado; dominios sin routing; legales globales |

### Base de datos
**En uso:** organizations, profiles, roles, organization_members, venues, restaurants, menu_categories, dishes, sports, facilities, events, event_participants, reservations, activity_feed, platform_admins.

**Schema sin app:** spaces, time_slots, event_categories, tournaments, tournament_participants, matches, rankings, achievements, user_achievements, media_library, organization_settings.

**Documentadas pero no creadas:** permissions, role_permissions, dish_images, reservation_types.

**Faltan del spec:** notifications, analytics, groups, friends, payments.

### Infraestructura
- Sin README, tests, CI/CD, `.env.example`
- Sin Supabase CLI (`config.toml`)
- Migraciones aplicadas manualmente vía SQL Editor
- Sin API layer (acceso directo a Supabase desde componentes)
- Sin Supabase Realtime
- Sin Framer Motion (especificado en el prompt)
- Solo i18n español hardcodeado
- `public/` vacío

---

## Deuda técnica

1. **Demo mode como muleta** — `demo-tenant.ts` enmascara datos reales
2. **IKON hardcodeado** — `ikon-brand.ts` anula white-label
3. **RBAC superficial** — `roles.permissions` JSON sin uso en frontend
4. **Migraciones manuales** — riesgo en producción
5. **Sin baseline git** — repo sin commits al momento de esta auditoría

---

## Criterio de éxito (del Master Prompt)

> No bookings. No users. **Real human participation.**

La métrica no es cuántas tablas hay, sino si el software hace que la gente participe, vuelva y se conozca. Hoy el producto gestiona contenido; aún no impulsa comunidad de forma sistemática.

---

## Referencia

Plan de implementación por fases: [ROADMAP.md](./ROADMAP.md)

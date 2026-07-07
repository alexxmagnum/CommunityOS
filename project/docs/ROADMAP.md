# Roadmap Community OS — Plan por fases

**Objetivo:** Transformar el MVP actual en el operating system de comunidades descrito en el Master Prompt.  
**Principio rector:** Cada feature debe responder: *"¿Esto crea más interacción humana real?"*

---

## Antes de empezar — Preparación (Fase 0)

### ¿Hacer commit antes?

**Sí, recomendado.** Al momento de esta auditoría el repositorio no tenía ningún commit (`main` vacío, carpeta `project/` sin trackear). Antes de tocar código de Fase 1 conviene:

1. **Commit baseline** — congelar el estado actual del MVP como punto de partida
2. **`.env.example`** — documentar variables sin secretos
3. **README mínimo** — cómo arrancar, aplicar migraciones, tenant demo

Esto no es obligatorio para documentar el plan, pero **sí para trabajar con seguridad**: poder comparar diffs, revertir y ramificar por fase.

### Checklist Fase 0

| # | Tarea | Prioridad | Esfuerzo |
|---|-------|-----------|----------|
| 0.1 | Commit inicial del estado actual | Alta | 30 min |
| 0.2 | Crear `.env.example` | Alta | 15 min |
| 0.3 | README con setup local + migraciones | Alta | 1 h |
| 0.4 | Verificar `npm run build` y `npm run typecheck` | Alta | 30 min |
| 0.5 | Aplicar migraciones Supabase en entorno dev | Alta | 1 h |
| 0.6 | Crear rama `develop` para trabajo de fases | Media | 5 min |
| 0.7 | Añadir `supabase/config.toml` + CLI | Media | 2 h |

**Entregable:** Repo versionado, entorno reproducible, equipo alineado con [AUDITORIA.md](./AUDITORIA.md).

---

## Fase 1 — Producto vendible (4–6 semanas)

**Meta:** Un tenant real (IKON u otro) puede operar sin depender del modo demo. Reservas fiables, admin completo, white-label real.

### 1.1 Fundamentos e infraestructura

| Tarea | Descripción | Archivos / área |
|-------|-------------|-----------------|
| Supabase CLI | Migraciones versionadas, `db push`, tipos generados | `supabase/` |
| `.env.example` + README | Onboarding de desarrolladores | raíz `project/` |
| Quitar dependencia demo | Homepage y menú funcionan solo con datos reales; demo como flag explícito | `lib/org/demo-tenant.ts`, `load-tenant-home.ts` |
| Deshardcodear IKON | Branding 100% desde `organizations`; `ikon-brand.ts` solo como preset opcional | `lib/org/ikon-brand.ts`, `OrgThemeProvider` |

### 1.2 Motor de disponibilidad y reservas

| Tarea | Descripción | DB / App |
|-------|-------------|----------|
| Activar `time_slots` | Generación de slots por facility/restaurant/space | Migración SQL + lib |
| Calendario de reserva | UI semanal/diario con slots libres/ocupados | `/o/[slug]/reservations` |
| Detección de conflictos | Trigger o función que impida doble booking | SQL + validación cliente |
| Reservas por `space` | Terrazas, salas privadas | Conectar tabla `spaces` |
| Estados de reserva | pending → confirmed → completed / cancelled | `reservations` + admin |
| Admin de reservas | Inbox en `/dashboard/reservations` | Nueva ruta org-admin |
| Código de confirmación | Ya existe trigger; mostrar en UI miembro | reservations page |

**Criterio de aceptación:** Un miembro reserva una pista de pádel o mesa en un slot real; un admin ve y gestiona la reserva.

### 1.3 Notificaciones básicas

| Tarea | Descripción |
|-------|-------------|
| Tabla `notifications` | `organization_id`, `user_id`, `type`, `payload`, `read_at` |
| In-app | Campana en header miembro + admin |
| Email (opcional Fase 1) | Supabase Edge Function o Resend para confirmación de reserva |

### 1.4 Miembros e invitaciones

| Tarea | Descripción |
|-------|-------------|
| Invitar por email | Flujo real en `/dashboard/members` (no stub) |
| Aceptar invitación | Link con token → `organization_members.status = active` |
| Roles al invitar | Seleccionar `org_member` / `org_admin` |

### 1.5 Media library

| Tarea | Descripción |
|-------|-------------|
| Subida a Supabase Storage | Fotos de platos, eventos, hero |
| Admin media | `/dashboard/media` |
| Conectar a menú y eventos | `cover_image_url`, `dish_images` o FK a `media_library` |

## Fase 1 — En progreso

### Completado en código (rama `develop`)
- [x] Motor de disponibilidad (`lib/reservations/availability.ts`)
- [x] Selector de horarios en reservas miembro
- [x] Prevención de conflictos (trigger SQL)
- [x] Admin de reservas (`/dashboard/reservations`)
- [x] Notificaciones in-app (tabla + campana)
- [x] Invitaciones por enlace (`/invite/[token]`)
- [x] Media library básica (`/dashboard/media`)
- [x] Espacios terraza/salón seed IKON

### Pendiente Fase 1
- [ ] Aplicar migraciones SQL en Supabase (phase1 + branding assets)
- [ ] Email transaccional para invitaciones

### Completado Fase 1 (código)
- [x] Reducir demo mode — solo sin Supabase o sin org en DB
- [x] Branding dinámico desde `organizations` (`resolve-theme.ts`)
- [x] Sin mezcla de datos demo cuando la org existe en DB


**Rama sugerida:** `feature/phase-1-vendible`

---

## Fase 2 — Diferenciación (6–8 semanas)

**Meta:** Torneos, comunidad y discovery personalizado. El producto deja de parecer "gestor de reservas" y empieza a parecer "club vivo".

### 2.1 Tournament Engine

| Tarea | Descripción |
|-------|-------------|
| Admin torneos | `/dashboard/tournaments` — crear, formatos, categorías |
| Formatos | Single/double elimination, round robin (MVP: 2–3 formatos) |
| Brackets UI | Vista pública `/o/[slug]/tournaments/[id]` |
| Matches | Resultados, scheduling, check-in |
| Rankings | Tabla por deporte/categoría |
| Seed IKON | Datos demo de torneo de pádel/golf en migración |
| Vincular con eventos | `tournaments.event_id` opcional |

**Criterio de aceptación:** Torneo de pádel con bracket visible, resultados actualizables y ranking.

### 2.2 Comunidad

| Tarea | Descripción |
|-------|-------------|
| Perfil rico | Bio, avatar upload, deportes favoritos, platos favoritos |
| Historial | Eventos asistidos, reservas pasadas, torneos jugados |
| Achievements | UI de badges; desbloqueo por participación |
| Activity timeline personal | `/o/[slug]/profile` ampliado |
| Feed mejorado | Acciones reales (se apuntó, ganó partido, reservó mesa) |

### 2.3 Discovery y recomendaciones personalizadas

| Tarea | Descripción |
|-------|-------------|
| Perfil de preferencias | Tabla o JSON en `profiles` / `organization_settings` |
| Motor v2 | `generate-prompts.ts` usa historial, favoritos, hora, reservas activas |
| Urgencia real | Plazas y slots desde DB en tiempo real |
| Clima (opcional) | API OpenWeather por ubicación del venue |
| "Para ti" | Sección dedicada en homepage |

### 2.4 Eventos premium

| Tarea | Descripción |
|-------|-------------|
| QR check-in | Generar QR por participante; escanear en admin |
| Lista de espera | Cuando `available_spots = 0` |
| Recordatorios | Notificación 24h / 1h antes |
| Creación rápida | Wizard < 1 minuto en admin |

### 2.5 Restaurante ampliado

| Tarea | Descripción |
|-------|-------------|
| Terraza vs sala | Tipos de `space` en reserva restaurante |
| Recomendaciones chef | Destacados en carta |
| Eventos gastronómicos | Vincular platos/menús a eventos |
| Pre-pedido (MVP) | Notas de plato al reservar mesa |

### Entregables Fase 2
- [ ] Al menos un torneo end-to-end con bracket
- [ ] Perfiles con historial y badges
- [ ] Discovery personalizado por usuario
- [ ] QR check-in en eventos
- [ ] Homepage que cambia según quién eres y qué hiciste antes

**Rama sugerida:** `feature/phase-2-diferenciacion`

---

## Fase 3 — Escala SaaS (8+ semanas)

**Meta:** Vender a cientos de tenants sin tocar código. Operación de plataforma profesional.

### 3.1 White-label completo

| Tarea | Descripción |
|-------|-------------|
| Dominios custom | Middleware por `Host` → resolver `organizations.domain` |
| Páginas legales por tenant | Privacy, terms, cookies editables en admin |
| Tipografía y dark mode | Aplicar `font_family` y `theme_mode` de verdad |
| Hero y banners | Configurables desde branding admin |
| Segundo tenant demo | Crear org distinta a IKON para validar white-label |

### 3.2 Super Admin enterprise

| Tarea | Descripción |
|-------|-------------|
| Analytics globales | Tabla/vistas `analytics_events` o integración externa |
| Salud de plataforma | Dashboard: errores, orgs activas, reservas/día |
| Idiomas y monedas | `organization_settings` + i18n framework |
| Soporte | Impersonación segura (solo platform admin) |
| Reset org | Flujo controlado con confirmación |

### 3.3 Billing

| Tarea | Descripción |
|-------|-------------|
| Stripe | Planes alineados con `subscription_tier` |
| Límites por tier | Módulos, miembros, eventos |
| Portal de facturación | Para org admin |

### 3.4 Realtime y experiencia viva

| Tarea | Descripción |
|-------|-------------|
| Supabase Realtime | Plazas de eventos, feed, brackets en vivo |
| Framer Motion | Transiciones homepage, cards, modales |
| "Solo quedan X" | Actualización sin refresh |

### 3.5 Comunidad social (future-ready)

| Tarea | Descripción |
|-------|-------------|
| Friends | Tabla `friendships`, solicitudes, privacidad |
| Grupos | Tabla `groups`, membresía, eventos de grupo |
| "Tus amigos van" | En discovery y eventos |

### 3.6 Calidad y operaciones

| Tarea | Descripción |
|-------|-------------|
| Tests | Vitest (lib) + Playwright (flujos críticos) |
| CI | GitHub Actions: lint, typecheck, build, tests |
| API layer (opcional) | Route handlers para lógica sensible |
| Documentación API interna | Para integraciones futuras |

### Entregables Fase 3
- [ ] Nuevo tenant operativo solo desde Super Admin
- [ ] Dominio custom funcionando
- [ ] Billing con Stripe
- [ ] Realtime en homepage y eventos
- [ ] CI verde en cada PR

**Rama sugerida:** `feature/phase-3-escala`

---

## Fase 4 — Visión completa (continuo)

Items del Master Prompt que pueden ir en paralelo o post-lanzamiento:

| Área | Features |
|------|----------|
| Pagos | Checkout reservas, eventos de pago |
| ML recommendations | Modelo sobre historial agregado |
| App móvil | PWA primero, nativo después |
| Integraciones | Google Calendar, Mailchimp, POS restaurante |
| Más deportes | Reglas configurables por `sport` en admin |
| Multi-idioma completo | EN, ES, PT mínimo |

---

## Dependencias entre fases

```
Fase 0 (baseline git + entorno)
    ↓
Fase 1 (reservas reales + admin + media + notificaciones)
    ↓
Fase 2 (torneos + comunidad + discovery personalizado)
    ↓
Fase 3 (white-label total + billing + realtime + escala)
    ↓
Fase 4 (visión completa / continuous)
```

**No saltar Fase 1:** Sin disponibilidad real y sin quitar el demo mode, Fase 2 y 3 se construyen sobre arena.

---

## Estimación de esfuerzo

| Fase | Duración | Equipo mínimo |
|------|----------|---------------|
| 0 | 1–2 días | 1 dev |
| 1 | 4–6 semanas | 1–2 devs |
| 2 | 6–8 semanas | 2 devs |
| 3 | 8+ semanas | 2 devs + diseño part-time |
| 4 | Continuo | Según prioridad producto |

---

## Métricas de progreso por fase

| Fase | Pregunta clave |
|------|----------------|
| 1 | ¿Un club real opera reservas sin modo demo? |
| 2 | ¿La gente vuelve por torneos, perfil y recomendaciones? |
| 3 | ¿Puedes activar un nuevo cliente sin deploy de código? |
| 4 | ¿La participación humana crece mes a mes? |

---

## Próximo paso recomendado

1. Revisar y aprobar este roadmap
2. Ejecutar **Fase 0** (commit baseline + README + `.env.example`)
3. Abrir issue/tarea por cada ítem de Fase 1.1
4. Empezar por **motor de disponibilidad** (mayor impacto, desbloquea restaurante y deportes)

---

## Documentos relacionados

- [AUDITORIA.md](./AUDITORIA.md) — Estado actual detallado
- Master Prompt — Fuente de verdad de producto (conversación / Notion)

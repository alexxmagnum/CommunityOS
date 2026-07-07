# Community OS

Multi-tenant SaaS white-label para comunidades, clubs y experiencias. El primer tenant demo es **IKON** (golf club).

## Stack

- Next.js 16 · React 18 · TypeScript
- Tailwind CSS · shadcn/ui
- Supabase (Auth, PostgreSQL, RLS, Storage)

## Inicio rápido

```bash
cd project
npm install
cp .env.example .env.local   # rellenar con tu proyecto Supabase
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) → redirige a `/o/ikon`.

## Variables de entorno

Ver [.env.example](./.env.example).

## Base de datos

1. Crea un proyecto en [Supabase](https://supabase.com)
2. En SQL Editor, ejecuta en orden:
   - Base vacía → `supabase/APPLY_ALL.sql`
   - Ya tienes foundation → `supabase/APPLY_REMAINING.sql`
3. Verifica: `npm run db:check`

Guía en la app: [/setup](http://localhost:3000/setup)

## Estructura

| Ruta | Descripción |
|------|-------------|
| `/o/[slug]` | App miembro (tenant) |
| `/dashboard` | Admin de organización |
| `/platform-admin` | Super admin de plataforma |
| `/auth/login` | Autenticación |

## Documentación

- [Auditoría vs Master Prompt](./docs/AUDITORIA.md)
- [Roadmap por fases](./docs/ROADMAP.md)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | Verificación TypeScript |
| `npm run db:check` | Comprueba conexión Supabase |

## Licencia

Privado — uso interno.

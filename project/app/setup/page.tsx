'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, Database, RefreshCw } from 'lucide-react'

const STEPS = [
  'Confirma .env con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (Settings → API).',
  'Si la base está vacía (sin tablas): ejecuta supabase/APPLY_ALL.sql en el SQL Editor.',
  'Luego ejecuta supabase/APPLY_SEED_AND_PHASES.sql (seed IKON + migraciones fase 1–4).',
  'Si ya tenías esquema pero sin datos: solo APPLY_SEED_AND_PHASES.sql.',
  'Reinicia npm run dev y abre /o/ikon — ya no debería salir el banner demo.',
]

function supabaseSqlEditorUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  return ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : 'https://supabase.com/dashboard'
}

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-[#0c0f14] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <Database className="mx-auto mb-4 h-12 w-12 text-amber-400" />
          <h1 className="text-3xl font-semibold">Configurar base de datos</h1>
          <p className="mt-2 text-white/60">
            La app necesita las migraciones de Supabase y los datos demo de IKON.
          </p>
        </div>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Pasos</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5 text-white/80">
              {STEPS.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/o/ikon">
            <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto">
              Demo IKON
            </Button>
          </Link>
          <Link href="/o/marina">
            <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto">
              Demo Marina
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={supabaseSqlEditorUrl()} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 bg-amber-500 text-black hover:bg-amber-400 sm:w-auto">
              <ExternalLink className="h-4 w-4" />
              Abrir SQL Editor
            </Button>
          </a>
          <Link href="/">
            <Button variant="outline" className="w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto">
              <RefreshCw className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-white/40">
          <code className="text-amber-300/80">APPLY_ALL.sql</code> (esquema)
          {' · '}
          <code className="text-amber-300/80">APPLY_SEED_AND_PHASES.sql</code> (datos IKON + fases 1–4)
        </p>
      </div>
    </div>
  )
}

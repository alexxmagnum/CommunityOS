import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Política de privacidad</h1>
        <p className="mt-2 text-muted-foreground">Última actualización: julio 2026</p>
        <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground">
          <p>Community OS respeta tu privacidad. Recopilamos la información de cuenta (email, nombre) y datos de uso necesarios para operar la plataforma. Los datos se almacenan de forma segura en Supabase con seguridad a nivel de fila por organización.</p>
          <p>Para consultas, utiliza la página de contacto.</p>
        </div>
        <Link href="/"><Button variant="outline" className="mt-8">Volver al inicio</Button></Link>
      </article>
      <SiteFooter />
    </div>
  )
}

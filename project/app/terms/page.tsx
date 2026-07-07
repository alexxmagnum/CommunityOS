import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Términos de servicio</h1>
        <p className="mt-2 text-muted-foreground">Última actualización: julio 2026</p>
        <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground">
          <p>Al usar Community OS aceptas utilizar la plataforma de forma responsable y conforme a la legislación aplicable. Las organizaciones son responsables del contenido que publican.</p>
          <p>Las cuentas son personales e intransferibles. Podemos suspender cuentas que incumplan estos términos.</p>
        </div>
        <Link href="/"><Button variant="outline" className="mt-8">Volver al inicio</Button></Link>
      </article>
      <SiteFooter />
    </div>
  )
}

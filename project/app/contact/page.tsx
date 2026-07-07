import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <Mail className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight">Contacto</h1>
        <p className="mt-4 text-muted-foreground">
          ¿Preguntas sobre Community OS o la configuración de tu organización? Contacta con el administrador de tu plataforma o escribe a soporte@communityos.app
        </p>
        <Link href="/"><Button variant="outline" className="mt-8">Volver al inicio</Button></Link>
      </div>
      <SiteFooter />
    </div>
  )
}

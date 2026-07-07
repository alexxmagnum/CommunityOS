import Link from 'next/link'
import { DEFAULT_TENANT_SLUG, tenantPath } from '@/lib/org/tenant-path'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-semibold">Community OS</p>
            <p className="mt-2 text-sm text-muted-foreground">
              El sistema operativo para clubs, espacios y comunidades vivas.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Producto</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href={tenantPath(DEFAULT_TENANT_SLUG, '/events')} className="hover:text-foreground">Experiencias</Link></li>
              <li><Link href="/auth/signup" className="hover:text-foreground">Crear cuenta</Link></li>
              <li><Link href="/auth/login" className="hover:text-foreground">Iniciar sesión</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacidad</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Términos</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contacto</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">© 2026 Community OS</p>
      </div>
    </footer>
  )
}

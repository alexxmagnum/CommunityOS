import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0c0f14] px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
        <ShieldX className="h-8 w-8 text-red-400" />
      </div>
      <h1 className="mt-6 font-serif text-3xl">Acceso denegado</h1>
      <p className="mt-3 max-w-md text-white/50">
        No tienes permiso para ver esta zona. Se requiere acceso de administrador de plataforma.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/">
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            Ir al inicio
          </Button>
        </Link>
        <Link href="/auth/login">
          <Button className="bg-amber-500 text-[#0c0f14] hover:bg-amber-400">
            Entrar con otra cuenta
          </Button>
        </Link>
      </div>
    </div>
  )
}

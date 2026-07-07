'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

export default function TenantProfilePage() {
  const { user, loading } = useAuth()
  const { org, path } = useTenant()

  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="mt-2 text-muted-foreground">Tu participación en {org.name}</p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : user ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Correo</span><span>{user.email}</span></div>
                <Link href={path('/reservations')}><Button variant="outline" size="sm" className="mt-2">Mis reservas</Button></Link>
                <Link href={path('/events')}><Button variant="outline" size="sm" className="ml-2">Mis experiencias</Button></Link>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Inicia sesión para ver tu perfil y participación.</p>
                <Link href={`/auth/login?redirect=${encodeURIComponent(path('/profile'))}`}>
                  <Button variant="ghost" className="btn-motanos">Entrar</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

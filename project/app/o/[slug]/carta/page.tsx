'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTenant } from '@/contexts/TenantContext'
import { loadTenantMenu } from '@/lib/org/load-tenant-menu'
import { MemberHeader } from '@/components/member/member-header'
import { DigitalMenu } from '@/components/member/digital-menu'
import type { TenantMenuData } from '@/lib/org/types'
import { Loader2 } from 'lucide-react'

export default function TenantCartaPage() {
  const { slug } = useParams<{ slug: string }>()
  const { path } = useTenant()
  const [menu, setMenu] = useState<TenantMenuData | null>(null)

  useEffect(() => {
    setMenu(null)
    loadTenantMenu(slug).then(setMenu)
  }, [slug])

  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        {!menu ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {menu.demoMode && (
              <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900/80">
                Carta demo · conecta Supabase para ver la carta real del restaurante
              </p>
            )}
            <DigitalMenu
              restaurant={menu.restaurant}
              categories={menu.categories}
              dishes={menu.dishes}
              reserveHref={path('/reservations?type=restaurant')}
            />
          </>
        )}
      </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getDefaultLegalPages, LEGAL_PAGE_LABELS, type LegalPageKey, type LegalPagesMap } from '@/lib/org/legal-content'
import { loadLegalPages, saveLegalPages } from '@/lib/org/load-legal-pages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { FileText, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_KEYS: LegalPageKey[] = ['privacy', 'terms', 'cookies']

export default function LegalAdminPage() {
  const { activeOrganization } = useAuth()
  const [pages, setPages] = useState<LegalPagesMap | null>(null)
  const [active, setActive] = useState<LegalPageKey>('privacy')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const slug = activeOrganization?.organization?.slug ?? 'ikon'
  const orgName = activeOrganization?.organization?.name ?? slug
  const orgId = activeOrganization?.organization_id ?? 'demo-ikon'

  useEffect(() => {
    setLoading(true)
    loadLegalPages(orgId, slug, orgName).then((data) => {
      setPages(data)
      setLoading(false)
    })
  }, [orgId, slug, orgName])

  async function handleSave() {
    if (!pages) return
    setSaving(true)
    try {
      if (orgId.startsWith('demo-')) {
        toast.success('Guardado en demo (conecta Supabase para persistir)')
        return
      }
      await saveLegalPages(orgId, pages)
      toast.success('Páginas legales actualizadas')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !pages) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const current = pages[active]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FileText className="h-6 w-6 text-blue-600" />
          Páginas legales
        </h1>
        <p className="mt-1 text-slate-500">
          Privacidad, términos y cookies visibles en{' '}
          <code className="text-xs">/o/{slug}/legal/…</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PAGE_KEYS.map((key) => (
          <Button
            key={key}
            variant={active === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActive(key)}
          >
            {LEGAL_PAGE_LABELS[key]}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPages(getDefaultLegalPages(orgName, slug))}
        >
          Restaurar plantilla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{LEGAL_PAGE_LABELS[active]}</CardTitle>
          <CardDescription>Contenido en markdown simple (párrafos separados por línea en blanco)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={current.title}
              onChange={(e) =>
                setPages((prev) =>
                  prev ? { ...prev, [active]: { ...prev[active], title: e.target.value } } : prev
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Contenido</Label>
            <Textarea
              id="body"
              rows={12}
              value={current.body}
              onChange={(e) =>
                setPages((prev) =>
                  prev ? { ...prev, [active]: { ...prev[active], body: e.target.value } } : prev
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar
        </Button>
      </div>
    </div>
  )
}

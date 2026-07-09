'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  url: string
  filename: string
  mime_type: string | null
  created_at: string
}

export default function MediaPage() {
  const { activeOrganization } = useAuth()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = getSupabaseClient()

  async function load() {
    if (!activeOrganization) return
    const { data } = await supabase
      .from('media_library')
      .select('id, url, filename, mime_type, created_at')
      .eq('organization_id', activeOrganization.organization_id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeOrganization])

  async function handleUpload(file: File) {
    if (!activeOrganization) return
    setUploading(true)
    const orgId = activeOrganization.organization_id
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage.from('media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      toast.error(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)

    const { error: dbError } = await supabase.from('media_library').insert({
      organization_id: orgId,
      filename: path.split('/').pop() || file.name,
      original_filename: file.name,
      mime_type: file.type,
      size: file.size,
      url: urlData.publicUrl,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    })

    if (dbError) toast.error(dbError.message)
    else {
      toast.success('Archivo subido')
      load()
    }
    setUploading(false)
  }

  async function removeItem(item: MediaItem) {
    if (!confirm('¿Eliminar este archivo?')) return
    const { error } = await supabase.from('media_library').delete().eq('id', item.id)
    if (error) toast.error(error.message)
    else { toast.success('Eliminado'); load() }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Biblioteca de medios</h1>
          <p className="mt-1 text-muted-foreground">Fotos para menú, eventos y branding</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUpload(file)
              e.target.value = ''
            }}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
            Subir imagen
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aún no hay archivos</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-video bg-muted">
                {item.mime_type?.startsWith('image/') ? (
                  <img src={item.url} alt={item.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{item.filename}</div>
                )}
              </div>
              <CardContent className="flex items-center justify-between p-3">
                <p className="truncate text-sm">{item.filename}</p>
                <Button size="icon" variant="ghost" onClick={() => removeItem(item)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

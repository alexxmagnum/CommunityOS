import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AcreditacionPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { slug, token } = await params
  const shortCode = token.slice(0, 8)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0f14] p-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <QrCode className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-4 text-xl font-semibold">Código de acreditación</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Muestra este código o el QR de tu inscripción al personal del club en la entrada.
        </p>
        <p className="mt-6 font-mono text-lg tracking-widest text-amber-300">{shortCode}…</p>
        <Button asChild variant="outline" className="mt-8 border-white/20 text-white hover:bg-white/10">
          <Link href={`/o/${slug}`}>Volver al club</Link>
        </Button>
      </div>
    </div>
  )
}

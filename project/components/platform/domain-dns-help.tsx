'use client'

import { getPlatformCnameTarget } from '@/lib/org/normalize-domain'

type DomainDnsHelpProps = {
  domain: string
  slug: string
}

/** Instrucciones DNS para conectar dominio custom del club. */
export function DomainDnsHelp({ domain, slug }: DomainDnsHelpProps) {
  const normalized = domain.trim().toLowerCase()
  if (!normalized) return null

  const cnameTarget = getPlatformCnameTarget()
  const pathUrl = `/o/${slug}`

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-medium text-slate-900">Configuración DNS</p>
      <p className="mt-2 text-slate-600">
        En el panel DNS del dominio <strong>{normalized}</strong>, crea un registro:
      </p>
      <ul className="mt-3 space-y-2 font-mono text-xs">
        <li>
          <span className="text-slate-500">Tipo:</span> CNAME
        </li>
        <li>
          <span className="text-slate-500">Nombre:</span> {normalized.includes('.') ? normalized.split('.')[0] : '@'}
        </li>
        <li>
          <span className="text-slate-500">Destino:</span> {cnameTarget}
        </li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Tras propagar (5–60 min), el club cargará en{' '}
        <strong>https://{normalized}</strong> sin mostrar <code className="rounded bg-white px-1">{pathUrl}</code> en la URL.
        Mientras tanto sigue disponible en la ruta estándar.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        En Vercel/Netlify, añade también <strong>{normalized}</strong> como dominio del proyecto.
      </p>
    </div>
  )
}

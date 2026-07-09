import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canManageOrganization } from '@/lib/auth/can-org-admin'
import { parseCheckInToken } from '@/lib/events/parse-check-in-token'

const bodySchema = z.object({
  token: z.string().min(8),
  organizationId: z.string().uuid().optional(),
})

const CHECK_IN_ERRORS: Record<string, string> = {
  TOKEN_INVALID: 'Código de acreditación no válido',
  TOKEN_NOT_FOUND: 'No se encontró ninguna inscripción con ese código',
  FORBIDDEN: 'No tienes permiso para acreditar en este club',
  ALREADY_CHECKED_IN: 'Este participante ya está acreditado',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Datos de acreditación no válidos' }, { status: 400 })
  }

  const token = parseCheckInToken(body.token)
  if (!token) {
    return NextResponse.json({ error: CHECK_IN_ERRORS.TOKEN_INVALID }, { status: 400 })
  }

  if (body.organizationId) {
    const allowed = await canManageOrganization(supabase, body.organizationId, user.id)
    if (!allowed) {
      return NextResponse.json({ error: CHECK_IN_ERRORS.FORBIDDEN }, { status: 403 })
    }
  }

  const { data, error } = await supabase.rpc('check_in_event_participant', { p_token: token })

  if (error) {
    const code = error.message?.includes('TOKEN_NOT_FOUND')
      ? 'TOKEN_NOT_FOUND'
      : error.message?.includes('ALREADY_CHECKED_IN')
        ? 'ALREADY_CHECKED_IN'
        : error.message?.includes('FORBIDDEN')
          ? 'FORBIDDEN'
          : error.message?.includes('TOKEN_INVALID')
            ? 'TOKEN_INVALID'
            : 'UNKNOWN'

    const status =
      code === 'FORBIDDEN' ? 403 : code === 'TOKEN_NOT_FOUND' || code === 'TOKEN_INVALID' ? 404 : 409

    return NextResponse.json(
      { error: CHECK_IN_ERRORS[code] || 'No se pudo completar la acreditación', code },
      { status }
    )
  }

  const result = data as {
    participantId: string
    eventId: string
    eventTitle: string
    attendeeName: string
    checkedInAt: string
  }

  return NextResponse.json({
    ok: true,
    participantId: result.participantId,
    eventId: result.eventId,
    eventTitle: result.eventTitle,
    attendeeName: result.attendeeName,
    checkedInAt: result.checkedInAt,
  })
}

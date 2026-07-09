import { NextResponse } from 'next/server'
import { getAppOrigin } from '@/lib/email/config'
import { sendDueEventReminders } from '@/lib/events/send-event-reminders'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false

  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true

  const header = request.headers.get('x-cron-secret')
  return header === secret
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const origin = getAppOrigin(request)
  const result = await sendDueEventReminders(new Date(), origin)

  return NextResponse.json({
    ok: result.errors.length === 0 || result.sent > 0,
    ...result,
    ranAt: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  return GET(request)
}

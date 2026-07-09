import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEventReminderEmail } from '@/lib/email/send-event-reminder-email'
import type { EventReminderKind } from '@/lib/email/event-reminder-template'
import type { Json } from '@/lib/supabase/database.types'
import {
  hasReminderBeenSent,
  isWithinReminderWindow,
  withReminderSent,
} from '@/lib/events/reminder-windows'

export type SendEventRemindersResult = {
  scanned: number
  sent: number
  skipped: number
  errors: string[]
}

type ParticipantRow = {
  id: string
  user_id: string | null
  metadata: unknown
  event: {
    id: string
    title: string
    starts_at: string
    location_details: string | null
    status: string
    organization: {
      id: string
      name: string
      slug: string
    } | null
  } | null
}

export async function sendDueEventReminders(
  now = new Date(),
  appOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000'
): Promise<SendEventRemindersResult> {
  const admin = createAdminClient()
  if (!admin) {
    return {
      scanned: 0,
      sent: 0,
      skipped: 0,
      errors: ['SUPABASE_SERVICE_ROLE_KEY no configurada'],
    }
  }

  const kinds: EventReminderKind[] = ['24h', '1h']
  const result: SendEventRemindersResult = { scanned: 0, sent: 0, skipped: 0, errors: [] }

  const { data: participants, error } = await admin
    .from('event_participants')
    .select(
      `id, user_id, metadata,
      event:events!inner(id, title, starts_at, location_details, status, organization:organizations(id, name, slug))`
    )
    .in('status', ['registered', 'confirmed'])
    .is('checked_in_at', null)

  if (error) {
    result.errors.push(error.message)
    return result
  }

  for (const row of (participants || []) as ParticipantRow[]) {
    result.scanned += 1
    const event = row.event
    if (!event || event.status !== 'published') {
      result.skipped += 1
      continue
    }

    const org = event.organization
    if (!org?.slug) {
      result.skipped += 1
      continue
    }

    const startsAt = new Date(event.starts_at)
    if (Number.isNaN(startsAt.getTime()) || startsAt <= now) {
      result.skipped += 1
      continue
    }

    const dueKind = kinds.find(
      (kind) => isWithinReminderWindow(startsAt, now, kind) && !hasReminderBeenSent(row.metadata, kind)
    )

    if (!dueKind || !row.user_id) {
      result.skipped += 1
      continue
    }

    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(row.user_id)
    const email = authUser?.user?.email
    if (authError || !email) {
      result.errors.push(`Sin email para participante ${row.id}`)
      result.skipped += 1
      continue
    }

    const { data: profileRow } = await admin
      .from('profiles')
      .select('full_name')
      .eq('user_id', row.user_id)
      .maybeSingle()

    const attendeeName = (profileRow as { full_name: string | null } | null)?.full_name

    const eventUrl = `${appOrigin}/o/${org.slug}/events/${event.id}`
    const sendResult = await sendEventReminderEmail({
      to: email,
      organizationName: org.name,
      eventTitle: event.title,
      startsAt,
      location: event.location_details,
      eventUrl,
      reminderKind: dueKind,
      attendeeName,
    })

    if (!sendResult.ok) {
      result.errors.push(
        sendResult.reason === 'not_configured'
          ? 'Resend no configurado'
          : sendResult.message || 'Error al enviar recordatorio'
      )
      continue
    }

    const nextMetadata = withReminderSent(row.metadata, dueKind, now)
    const { error: updateError } = await (admin as SupabaseClient)
      .from('event_participants')
      .update({ metadata: nextMetadata as Json })
      .eq('id', row.id)

    if (updateError) {
      result.errors.push(`Recordatorio enviado pero no guardado: ${row.id}`)
    } else {
      result.sent += 1
    }
  }

  return result
}

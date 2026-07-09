export type EventReminderKind = '24h' | '1h'

export type EventReminderEmailParams = {
  organizationName: string
  eventTitle: string
  startsAt: Date
  location?: string | null
  eventUrl: string
  reminderKind: EventReminderKind
  attendeeName?: string | null
}

export function buildEventReminderSubject(
  organizationName: string,
  eventTitle: string,
  reminderKind: EventReminderKind
) {
  const prefix = reminderKind === '24h' ? 'Mañana' : 'En 1 hora'
  return `${prefix}: ${eventTitle} — ${organizationName}`
}

export function buildEventReminderHtml({
  organizationName,
  eventTitle,
  startsAt,
  location,
  eventUrl,
  reminderKind,
  attendeeName,
}: EventReminderEmailParams) {
  const greeting = attendeeName
    ? `<p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.5;">Hola ${escapeHtml(attendeeName)},</p>`
    : ''

  const lead =
    reminderKind === '24h'
      ? 'Te recordamos que mañana tienes un evento en el club.'
      : 'Tu evento empieza en aproximadamente una hora.'

  const when = startsAt.toLocaleString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  const locationLine = location
    ? `<p style="margin:0 0 8px;color:#444;font-size:15px;"><strong>Ubicación:</strong> ${escapeHtml(location)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f5f4f2;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:32px 28px 8px;">
          <p style="margin:0 0 8px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;">Recordatorio de evento</p>
          <h1 style="margin:0 0 16px;color:#111;font-size:22px;line-height:1.3;">${escapeHtml(eventTitle)}</h1>
          ${greeting}
          <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.5;">${lead}</p>
          <p style="margin:0 0 8px;color:#444;font-size:15px;"><strong>Club:</strong> ${escapeHtml(organizationName)}</p>
          <p style="margin:0 0 8px;color:#444;font-size:15px;"><strong>Fecha y hora:</strong> ${escapeHtml(when)}</p>
          ${locationLine}
          <a href="${escapeHtml(eventUrl)}" style="display:inline-block;margin-top:20px;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:600;">Ver evento</a>
          <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.5;">Si no puedes asistir, cancela tu inscripción desde la app del club.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

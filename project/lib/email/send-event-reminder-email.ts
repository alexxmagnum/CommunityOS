import { getEmailConfig, senderFrom } from '@/lib/email/config'
import {
  buildEventReminderHtml,
  buildEventReminderSubject,
  type EventReminderEmailParams,
} from '@/lib/email/event-reminder-template'

export type SendEventReminderEmailInput = EventReminderEmailParams & {
  to: string
}

export type SendEventReminderEmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: 'not_configured' | 'provider_error'; message?: string }

export async function sendEventReminderEmail(
  input: SendEventReminderEmailInput
): Promise<SendEventReminderEmailResult> {
  const { apiKey, fromAddress, isConfigured } = getEmailConfig()

  if (!isConfigured || !apiKey) {
    return { ok: false, reason: 'not_configured' }
  }

  const from = senderFrom(input.organizationName, fromAddress)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: buildEventReminderSubject(
        input.organizationName,
        input.eventTitle,
        input.reminderKind
      ),
      html: buildEventReminderHtml(input),
    }),
  })

  if (!response.ok) {
    let message = `Resend error ${response.status}`
    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message) message = payload.message
    } catch {
      // ignore
    }
    return { ok: false, reason: 'provider_error', message }
  }

  let id: string | undefined
  try {
    const payload = (await response.json()) as { id?: string }
    id = payload.id
  } catch {
    // optional
  }

  return { ok: true, id }
}

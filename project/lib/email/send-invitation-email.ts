import { getEmailConfig, senderFrom } from '@/lib/email/config'
import {
  buildInvitationEmailHtml,
  buildInvitationEmailSubject,
  type InvitationEmailParams,
} from '@/lib/email/invitation-template'

export type SendInvitationEmailInput = InvitationEmailParams & {
  to: string
}

export type SendInvitationEmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: 'not_configured' | 'provider_error'; message?: string }

export async function sendInvitationEmail(
  input: SendInvitationEmailInput
): Promise<SendInvitationEmailResult> {
  const { apiKey, fromAddress, isConfigured } = getEmailConfig()

  if (!isConfigured || !apiKey) {
    return { ok: false, reason: 'not_configured' }
  }

  // El correo se envía en nombre del club que invita (white-label).
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
      subject: buildInvitationEmailSubject(input.organizationName),
      html: buildInvitationEmailHtml(input),
    }),
  })

  if (!response.ok) {
    let message = `Resend error ${response.status}`
    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message) message = payload.message
    } catch {
      // ignore parse errors
    }
    return { ok: false, reason: 'provider_error', message }
  }

  let id: string | undefined
  try {
    const payload = (await response.json()) as { id?: string }
    id = payload.id
  } catch {
    // response body optional
  }

  return { ok: true, id }
}

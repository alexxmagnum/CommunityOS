export type InvitationEmailParams = {
  organizationName: string
  inviteLink: string
  roleLabel: string
  invitedByName?: string | null
}

export function buildInvitationEmailSubject(organizationName: string) {
  return `Te han invitado a ${organizationName}`
}

export function buildInvitationEmailHtml({
  organizationName,
  inviteLink,
  roleLabel,
  invitedByName,
}: InvitationEmailParams) {
  const inviterLine = invitedByName
    ? `<p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.5;">${escapeHtml(invitedByName)} te ha invitado a unirte como <strong>${escapeHtml(roleLabel)}</strong>.</p>`
    : `<p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.5;">Has sido invitado a unirte como <strong>${escapeHtml(roleLabel)}</strong>.</p>`

  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f5f4f2;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:32px 28px 8px;">
          <p style="margin:0 0 8px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;">Invitación al club</p>
          <h1 style="margin:0 0 16px;color:#111;font-size:24px;line-height:1.3;">${escapeHtml(organizationName)}</h1>
          ${inviterLine}
          <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.5;">Pulsa el botón para crear tu cuenta o iniciar sesión y aceptar la invitación.</p>
          <a href="${escapeHtml(inviteLink)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:600;">Aceptar invitación</a>
          <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.5;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${escapeHtml(inviteLink)}" style="color:#b45309;word-break:break-all;">${escapeHtml(inviteLink)}</a></p>
          <p style="margin:24px 0 0;color:#aaa;font-size:12px;line-height:1.5;">Este enlace caduca en 14 días.</p>
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

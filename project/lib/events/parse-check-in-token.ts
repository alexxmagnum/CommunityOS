const TOKEN_RE = /^[a-f0-9]{16,64}$/i

/** Extrae el token de check-in desde texto pegado o URL de QR. */
export function parseCheckInToken(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (TOKEN_RE.test(trimmed)) return trimmed.toLowerCase()

  const deepLink = trimmed.match(/(?:checkin|acreditacion)\/([a-f0-9]+)/i)
  if (deepLink?.[1]) return deepLink[1].toLowerCase()

  try {
    const url = new URL(trimmed)
    const queryToken = url.searchParams.get('token')
    if (queryToken && TOKEN_RE.test(queryToken)) return queryToken.toLowerCase()

    const segments = url.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    if (last && TOKEN_RE.test(last)) return last.toLowerCase()
  } catch {
    // no es URL
  }

  return null
}

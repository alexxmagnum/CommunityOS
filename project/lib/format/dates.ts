export function formatEventDate(dateStr: string, locale = 'es-ES') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(dateStr))
}

export function formatRelativeTime(dateStr: string, locale = 'es-ES') {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(dateStr))
}

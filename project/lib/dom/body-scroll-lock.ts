let lockCount = 0
let previousOverflow = ''

/** Bloquea scroll del documento (ref-counted para splash + menú móvil). */
export function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow || ''
    previousOverflow = ''
  }
}

/** Fuerza desbloqueo (p. ej. al terminar splash). */
export function forceUnlockBodyScroll() {
  if (typeof document === 'undefined') return
  lockCount = 0
  document.body.style.overflow = ''
  previousOverflow = ''
}

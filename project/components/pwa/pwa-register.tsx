'use client'

import { useEffect } from 'react'

/** Elimina service workers y cachés del navegador (evita JS antiguo). */
export function PwaRegister() {
  useEffect(() => {
    async function purge() {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    }

    void purge()
    window.addEventListener('focus', purge)
    return () => window.removeEventListener('focus', purge)
  }, [])

  return null
}

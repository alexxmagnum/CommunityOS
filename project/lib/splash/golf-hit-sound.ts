/** Golpe de golf — MP3 real en /sounds/golf-hit.mp3 */
const HIT_SOUND_SRC = '/sounds/golf-hit.mp3'

let hitAudio: HTMLAudioElement | null = null
let audioReady = false

export function bindGolfHitAudio(element: HTMLAudioElement | null) {
  if (!element) return
  hitAudio = element
  element.volume = 1
  element.preload = 'auto'
  audioReady = true
}

export function unlockSplashAudio() {
  const audio = hitAudio
  if (!audio || typeof window === 'undefined') return

  audio.volume = 0.001
  void audio.play().then(() => {
    audio.pause()
    audio.currentTime = 0
    audio.volume = 1
  }).catch(() => {
    audio.volume = 1
  })
}

export function playGolfHitSound() {
  const audio = hitAudio
  if (!audio || typeof window === 'undefined') return

  audio.volume = 1
  audio.currentTime = 0

  const attempt = () => {
    void audio.play().catch(() => {
      unlockSplashAudio()
      window.setTimeout(() => {
        audio.currentTime = 0
        void audio.play().catch(() => {})
      }, 40)
    })
  }

  if (audioReady) {
    attempt()
    return
  }

  const fallback = new Audio(HIT_SOUND_SRC)
  fallback.volume = 1
  fallback.preload = 'auto'
  void fallback.play().catch(() => {})
}

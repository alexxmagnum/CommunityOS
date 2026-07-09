/** Golpe de golf — MP3 en /sounds/golf-hit.mp3 */
const HIT_SOUND_SRC = '/sounds/golf-hit.mp3?v=5'

let hitAudio: HTMLAudioElement | null = null
let bedActive = false
let gestureUnlocked = false
let webCtx: AudioContext | null = null
let webBuffer: AudioBuffer | null = null
let bufferLoading: Promise<void> | null = null

function loadWebBuffer() {
  if (webBuffer || typeof window === 'undefined') return Promise.resolve()
  if (bufferLoading) return bufferLoading

  bufferLoading = (async () => {
    try {
      webCtx = new AudioContext()
      const res = await fetch(HIT_SOUND_SRC)
      if (!res.ok) return
      webBuffer = await webCtx.decodeAudioData(await res.arrayBuffer())
    } catch {
      // fallback HTMLAudio
    }
  })()

  return bufferLoading
}

function getOrCreateAudio(): HTMLAudioElement {
  if (hitAudio) return hitAudio

  const audio = document.createElement('audio')
  audio.src = HIT_SOUND_SRC
  audio.preload = 'auto'
  audio.setAttribute('playsinline', '')
  audio.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none'
  document.body.appendChild(audio)
  hitAudio = audio
  return audio
}

async function ensureMutedBed(): Promise<boolean> {
  const audio = getOrCreateAudio()
  if (bedActive && !audio.paused) return true

  audio.loop = true
  audio.muted = true
  audio.volume = 0.001
  audio.currentTime = 0

  return new Promise((resolve) => {
    const start = () => {
      void audio
        .play()
        .then(() => {
          bedActive = true
          resolve(true)
        })
        .catch(() => resolve(false))
    }

    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      start()
    } else {
      audio.addEventListener('canplaythrough', () => start(), { once: true })
      audio.load()
      window.setTimeout(() => resolve(false), 800)
    }
  })
}

/** Precalienta audio en silencio. */
export function prewarmSplashAudio() {
  if (typeof window === 'undefined') return
  void ensureMutedBed()
  void loadWebBuffer()
}

/** Desbloquea sonido con gesto del usuario (botón Golpea). */
export async function unlockSplashAudioWithGesture(): Promise<void> {
  const audio = getOrCreateAudio()
  gestureUnlocked = true

  audio.muted = false
  audio.volume = 1
  audio.currentTime = 0

  try {
    await audio.play()
    audio.pause()
    audio.currentTime = 0
    bedActive = true
  } catch {
    try {
      audio.muted = true
      await audio.play()
      audio.pause()
      audio.currentTime = 0
      audio.muted = false
      bedActive = true
    } catch {
      // sin audio en este dispositivo
    }
  }

  if (webCtx?.state === 'suspended') {
    try {
      await webCtx.resume()
    } catch {
      // ignore
    }
  }
}

export function primeGolfImpact() {
  const audio = hitAudio
  if (!audio) return
  audio.loop = true
  audio.muted = !gestureUnlocked
  audio.volume = gestureUnlocked ? 1 : 0.001
  audio.currentTime = 0
  if (audio.paused) void audio.play().catch(() => {})
}

function playWebAudio() {
  if (!webCtx || !webBuffer) return false
  try {
    if (webCtx.state === 'suspended') void webCtx.resume()
    const source = webCtx.createBufferSource()
    source.buffer = webBuffer
    source.connect(webCtx.destination)
    source.start(0)
    return true
  } catch {
    return false
  }
}

export function playGolfHitSound() {
  if (typeof window === 'undefined') return

  const audio = hitAudio ?? getOrCreateAudio()

  audio.loop = false
  audio.pause()
  audio.currentTime = 0
  audio.muted = false
  audio.volume = 1

  void audio.play().catch(() => {
    if (!playWebAudio()) {
      void audio.play().catch(() => {})
    }
  })
}

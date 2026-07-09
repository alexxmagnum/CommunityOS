/** Golpe de golf — MP3 en /sounds/golf-hit.mp3 */
const HIT_SOUND_SRC = '/sounds/golf-hit.mp3?v=4'

let hitAudio: HTMLAudioElement | null = null
let bedActive = false
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

/** Arranca audio en silencio lo antes posible (layout + splash). */
export function prewarmSplashAudio() {
  if (typeof window === 'undefined') return
  void ensureMutedBed()
  void loadWebBuffer()
}

async function ensureMutedBed() {
  const audio = getOrCreateAudio()
  if (bedActive && !audio.paused) return

  audio.loop = true
  audio.muted = true
  audio.volume = 0.001
  audio.currentTime = 0

  const start = () => {
    void audio
      .play()
      .then(() => {
        bedActive = true
      })
      .catch(() => {
        // volumen cero sin muted como alternativa
        audio.muted = false
        audio.volume = 0.001
        void audio.play().then(() => {
          bedActive = true
        }).catch(() => {})
      })
  }

  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    start()
  } else {
    audio.addEventListener('canplaythrough', start, { once: true })
    audio.load()
  }
}

export function bindGolfHitAudio(element: HTMLAudioElement | null) {
  if (!element) return
  // El splash monta <audio>; reutilizamos ese nodo en lugar del oculto
  if (hitAudio && hitAudio !== element && hitAudio.parentNode) {
    hitAudio.parentNode.removeChild(hitAudio)
  }
  hitAudio = element
  element.preload = 'auto'
  element.setAttribute('playsinline', '')
  void ensureMutedBed()
}

/** Reinicia el loop silencioso antes del golpe visual. */
export function primeGolfImpact() {
  const audio = hitAudio
  if (!audio) return
  audio.loop = true
  audio.muted = true
  audio.volume = 0.001
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
  audio.currentTime = 0
  audio.muted = false
  audio.volume = 1

  // Si el bed silencioso sigue activo, solo desmutar (sin pause → play)
  if (!audio.paused && bedActive) {
    return
  }

  void audio.play().catch(() => {
    if (!playWebAudio()) {
      void ensureMutedBed().then(() => {
        audio.loop = false
        audio.currentTime = 0
        audio.muted = false
        audio.volume = 1
        void audio.play().catch(() => {})
      })
    }
  })
}

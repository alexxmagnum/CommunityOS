/** Golpe de golf — MP3 en /sounds/golf-hit.mp3 */
const HIT_SOUND_SRC = '/sounds/golf-hit.mp3?v=3'

let hitAudio: HTMLAudioElement | null = null
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
      // Sin Web Audio; se usará HTMLAudioElement
    }
  })()

  return bufferLoading
}

/** Reproduce en silencio al cargar — desbloquea autoplay en Chrome/Android. */
function startMutedBed(audio: HTMLAudioElement) {
  audio.muted = true
  audio.volume = 1
  audio.loop = true
  audio.currentTime = 0
  void audio.play().catch(() => {})
  void loadWebBuffer()
}

export function bindGolfHitAudio(element: HTMLAudioElement | null) {
  if (!element) return
  hitAudio = element
  element.preload = 'auto'
  element.setAttribute('playsinline', '')
  startMutedBed(element)
}

function playWebAudio() {
  if (!webCtx || !webBuffer) return false

  try {
    if (webCtx.state === 'suspended') {
      void webCtx.resume()
    }
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

  const playHtml = async (audio: HTMLAudioElement) => {
    audio.loop = false
    audio.pause()
    audio.currentTime = 0
    audio.muted = false
    audio.volume = 1

    try {
      await audio.play()
      return
    } catch {
      if (playWebAudio()) return
    }
  }

  if (hitAudio) {
    void playHtml(hitAudio)
    return
  }

  const fallback = new Audio(HIT_SOUND_SRC)
  fallback.preload = 'auto'
  fallback.setAttribute('playsinline', '')
  void playHtml(fallback)
}

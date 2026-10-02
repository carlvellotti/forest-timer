// One soft chime when a session finishes: a single sine note that fades out, made in the browser.

const NOTE_HZ = 659.25 // E5
const PEAK = 0.2
const FADE_SECONDS = 2.5

// One sound context for the whole page, made on the first Start. It stays awake between
// sessions, because waking it again without a press is unreliable on Safari.
let context = null

// Browsers only allow sound after you've pressed something, so Start wakes the sound up.
export function unlockChime() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) return
  try {
    context ??= new AudioContextClass()
    if (context.state !== 'running') context.resume().catch(() => {})
  } catch {
    // No sound available: the session still works without the chime
  }
}

export async function playChime() {
  if (!context) return
  try {
    // A locked phone or a long background stretch can pause the sound; wake it first.
    if (context.state !== 'running') await context.resume()
    const now = context.currentTime
    const note = context.createOscillator()
    const volume = context.createGain()
    note.type = 'sine'
    note.frequency.value = NOTE_HZ
    volume.gain.setValueAtTime(0, now)
    volume.gain.linearRampToValueAtTime(PEAK, now + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, now + FADE_SECONDS)
    note.connect(volume).connect(context.destination)
    note.start(now)
    note.stop(now + FADE_SECONDS)
  } catch {
    // No sound available: the tree still grows
  }
}

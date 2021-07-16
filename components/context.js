import { create, effect } from '../dist/index.js'

let audioContext

function stringOrNumber(value) {
  const num = Number(value)
  if (num == value) {
    return num
  }
  else {
    return value
  }
}

export default create({
  class: 'context',

  attrs: { latency: String },

  slot: true,

  component() {
    effect(() => {
      const latencyHint = stringOrNumber(this.latency)
      audioContext ??= new AudioContext({ latencyHint })

      window.addEventListener('mousedown', () => {
        audioContext.resume()
      }, { once: true, capture: true, passive: false })

      window.addEventListener('touchstart', () => {
        audioContext.resume()
      }, { once: true, capture: true, passive: false })
    }, this.latency)

    effect(
      () => {
        for (const el of this.slotted) {
          el.audioContext = audioContext
        }
      },
      this.latency,
      this.slotted,
    )
  },
})

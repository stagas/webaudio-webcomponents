import { create, effect } from '../dist/index.js'

let audioContext

export default create({
  class: 'context',

  slot: true,

  component() {
    audioContext ??= new AudioContext()

    window.addEventListener('mousedown', () => {
      audioContext.resume()
    }, { once: true, capture: true, passive: false })

    window.addEventListener('touchstart', () => {
      audioContext.resume()
    }, { once: true, capture: true, passive: false })

    effect(() => {
      for (const el of this.slotted) {
        el.audioContext = audioContext
      }
    }, this.slotted)
  },
})

import { create, effect } from '../dist/index.js'

let audioContext

export default create({
  class: 'context',

  slot: true,

  component() {
    audioContext ??= new AudioContext()

    document.body.addEventListener('mousedown', () => {
      audioContext.resume()
    }, { once: true })

    document.body.addEventListener('touchstart', () => {
      audioContext.resume()
    }, { once: true })

    effect(() => {
      for (const el of this.slotted) {
        el.audioContext = audioContext
      }
    }, this.slotted)
  },
})

import { create, effect } from '../dist/index.js'

let audioContext

export default create({
  class: 'context',

  slot: true,

  component() {
    audioContext ??= new AudioContext()

    effect(() => {
      for (const el of this.slotted) {
        el.audioContext = audioContext
      }
    }, this.slotted)
  },
})

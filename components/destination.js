import WebAudioNode, { create, effect } from './node.js'

export default create({
  class: 'destination',
  extends: WebAudioNode,

  component() {
    effect(() => {
      this.audioNode = this.audioContext.destination
    }, this.audioContext)
  },
})

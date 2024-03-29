import WebAudioNode, { atomic, create, effect } from './node.js'

export default create({
  class: 'worklet',
  extends: WebAudioNode,

  attrs: { name: String, src: String },
  props: { workletModuleReady: Boolean },

  component() {
    effect(
      atomic(async () => {
        if (this.workletModuleReady) return
        await this.audioContext.audioWorklet.addModule(this.src)
        this.workletModuleReady = true
      }),
      this.name,
      this.src,
      this.audioContext,
    )

    effect(
      () => {
        if (!this.workletModuleReady) return
        if (this.audioNode) this.audioNode.disconnect()
        this.audioNode = new AudioWorkletNode(this.audioContext, this.name, {
          numberOfInputs: 2,
        })
      },
      this.workletModuleReady,
      this.name,
      this.src,
      this.audioContext,
    )
  },
})

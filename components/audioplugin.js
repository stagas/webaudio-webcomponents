import { load } from '../vendor/audioplugin/index.js'

import WebAudioNode, { atomic, create, effect, flatten, wrap } from './node.js'

export default create({
  class: 'audioplugin',
  extends: WebAudioNode,

  attrs: { src: String },
  // props: { workletModuleReady: Boolean },

  pins: { worklet: '#worklet' },

  component() {
    effect(
      atomic(async () => {
        const plugin = await load(this.src)

        this.render `
          <style>
            ${document.getElementById('globstyle').innerHTML}
          </style>

          <w-worklet id="worklet" name="${plugin.name}" src="${this.src.value}">
            <div class="worklet-inner">
          ${
          plugin.parameters.map(p => `
            <w-param name="${p.name}">
              <w-knob name="${p.name}" shape="hexagon" size="80"></w-knob>
            </w-param>
            `).join('')
        }</div></w-worklet>
        `
      }),
      this.src,
      this.audioContext,
    )

    effect(
      () => {
        this.worklet.audioContext = this.audioContext
        // effect.once(() => {
        //   this.audioNode = this.worklet.audioNode
        // }, this.worklet.audioNode)
      },
      this.worklet,
      this.audioContext,
    )
    // effect(
    //   () => {
    //     if (!this.workletModuleReady) return
    //     if (this.audioNode) this.audioNode.disconnect()
    //     this.audioNode = new AudioWorkletNode(this.audioContext, this.name)
    //   },
    //   this.workletModuleReady,
    //   this.name,
    //   this.src,
    //   this.audioContext,
    // )
  },
})

import { dispatchMIDIMessageEvent, load } from '../vendor/audioplugin/index.js'

import WebAudioNode, { atomic, callback, create, effect } from './node.js'

export default create({
  class: 'audioplugin',
  extends: WebAudioNode,

  slot: true,

  attrs: { src: String },

  pins: { worklet: 'w-worklet', piano: 'w-piano' },

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
            <w-param name="${p.name}" precision="${Math.max(
            p.minValue.toString().length,
            p.maxValue.toString().length,
          ) + 2}" slope="${p.slope}">
              <w-knob shape="${
            [
              'hexagon',
              'octagon',
              'decagon',
              'dodecagon',
            ][Math.random() * 4 | 0]
          }" size="${80 + (Math.random() * 4 | 0) * 10}"></w-knob>
            </w-param>
            `).join('')
        }
        </div>
        <w-piano></w-piano>
        <w-destination></w-destination>
        </w-worklet>
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

    effect(
      () => {
        this.piano.addEventListener(
          'midimessage',
          callback((e) => {
            e.detail.receivedTime = performance.now() // + 100
            // this.worklet.dispatch('midimessage', e.detail)
            // // if (this.worklet.audioNode) {
            dispatchMIDIMessageEvent(this.worklet.audioNode, e.detail)
            // // }
            // // console.log(e.detail.data.slice())
          }),
        )
      },
      this.worklet,
      this.piano,
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

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
              <w-param name="${p.name}" slope="${p.slope}">
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
      },
      this.worklet,
      this.audioContext,
    )

    effect(
      () => {
        this.piano.addEventListener(
          'midimessage',
          callback((e) => {
            this.audioContext.resume()
            e.detail.receivedTime = performance.now()
            dispatchMIDIMessageEvent(this.worklet.audioNode, e.detail)
          }),
        )
      },
      this.worklet,
      this.piano,
    )
  },
})

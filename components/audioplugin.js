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

        const groups = new Map()

        groups.set('other', [])

        plugin.parameters.forEach(p => {
          const [first, ...rest] = p.name.split(' ')

          if (groups.has(first)) {
            groups.get(first).push(p)
          }
          else {
            groups.set(first, [p])
          }
        })

        const groupItems = [...groups].filter(([g, params]) => {
          if (params.length === 1) {
            groups.get('other').push(params[0])
            return false
          }
          else {
            return true
          }
        })

        this.render `
          <style>
            ${document.getElementById('globstyle').innerHTML}
          </style>

          <w-worklet id="worklet" name="${plugin.name}" src="${this.src.value}">
            <div class="worklet-inner">
            ${
          groupItems.map(([group, params]) => {
            return params.length === 0
              ? ''
              : `<fieldset part="param-group">${
                group === 'other'
                  ? ''
                  : `<legend part="param-group-legend">${group}</legend>`
              }` + params.map(p => `
              <w-param ${
                p.symmetric ? 'symmetric' : ''
              }  name="${p.name}" group="${group}" slope="${p.slope}">
                <w-knob ${p.symmetric ? 'symmetric' : ''} shape="${
                [
                  'hexagon',
                  'octagon',
                  'decagon',
                  'dodecagon',
                ][Math.random() * 4 | 0]
              }" size="${65 + (Math.random() * 3 | 0) * 10}"></w-knob>
              </w-param>
              `).join('') + '</fieldset>'
          }).join('')
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

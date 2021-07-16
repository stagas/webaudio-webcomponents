import { dispatchMIDIMessageEvent, load } from '../vendor/audioplugin/index.js'

import WebAudioNode, { atomic, callback, create, effect, wrap } from './node.js'

const events = []
const eventsMap = new WeakMap()

export default create({
  class: 'audioplugin',
  extends: WebAudioNode,

  slot: true,

  attrs: { src: String, styling: '' },
  props: { events, connected: Boolean },

  pins: { worklet: 'w-worklet', piano: 'w-piano', pianoroll: 'w-pianoroll' },

  addNoteEvent(event) {
    let didChange = false
    if (this.events.indexOf(event) < 0) {
      didChange = true
      this.events = [...this.events, event]
    }
    const events = this.scheduler.addNote(
      event.step * (1 / 16),
      event.note,
      127,
      event.length * (1 / 16),
    )
    eventsMap.set(event, events)
    if (this.worklet.audioNode) {
      for (const ev of events) {
        this.scheduler.attachEvent(ev, this.worklet.audioNode)
      }
    }
    if (didChange) {
      this.dispatch('change', this)
    }
  },

  deleteNoteEvent(event) {
    if (!event) return

    let keyEvent
    for (const ev of this.events) {
      if (ev && ev.note == event.note && ev.step == event.step) {
        keyEvent = ev
        break
      }
    }
    if (keyEvent) {
      const events = eventsMap.get(keyEvent)
      if (events) {
        for (const ev of events) {
          this.scheduler.removeEvent(ev)
        }
      }
      this.events.splice(this.events.indexOf(keyEvent), 1)
      this.events = this.events.slice()
      this.dispatch('change', this)
    }
  },

  paint(plugin) {
    const groups = new Map()

    groups.set('other', [])

    plugin.parameters.forEach(p => {
      const [first, ..._rest] = p.name.split(' ')

      if (groups.has(first)) {
        groups.get(first).push(p)
      }
      else {
        groups.set(first, [p])
      }
    })

    const groupItems = [...groups].filter(([_g, params]) => {
      if (params.length === 1) {
        groups.get('other').push(params[0])
        return false
      }
      else {
        return true
      }
    })

    const styling = Object.fromEntries(
      this.styling.split(';').filter(Boolean).map(el => el.split(':')).map(
        el => [el[0], el[1].split(',')]
      ),
    )

    const lfo = [
      `<fieldset part='param-group'>`,
      `<legend part='param-group-legend'>lfo</legend>`,
      `<w-param value=0 min=0 max=1 name='lfo amount' group='lfo' slope='1'><w-knob value=0 min=0 max=127 kind='soft' shape='hexagon' size=60></w-knob></w-param>`,
      `<w-param value=0 min=0.001 max=1000 name='lfo freq' group='lfo' slope='0.2'><w-knob value=0 min=0 max=127 kind='soft' shape='hexagon' size=60></w-knob></w-param>`,
      `<w-param value=0 min=-1 max=1 name='lfo base' group='lfo' slope='1'><w-knob value=0 min=0 max=127 kind='soft' shape='hexagon' size=60></w-knob></w-param>`,
      `<w-param value=0 min=-1 max=1 name='lfo phase' group='lfo' slope='1'><w-knob value=0 min=0 max=127 kind='soft' shape='hexagon' size=60></w-knob></w-param>`,
      `</fieldset>`,
    ].join('')

    this.render `
      <w-worklet id="worklet"
        name="${plugin.name}"
        src="${this.src}"
        part="audioplugin-outer">

        <w-spacer horizontal>
          <div class="worklet-inner">
        ${
      groupItems.map(([group, params]) => {
        return params.length === 0
          ? ''
          : `<fieldset part="param-group">${
            group === 'other'
              ? ''
              : `<legend part="param-group-legend">${group}</legend>`
          }` + params.map(p => {
            const st = styling[p.name]
            if (st && st.length) {
              const [type, size, kind, shape] = st
              let html = `
                  <w-tooltip content="${lfo}">
                    <w-param ${p.symmetric ? 'symmetric' : ''}
                      name="${p.name}"
                      group="${group}"
                      slope="${p.slope}">`

              if (type === 'fader') {
                html += `
                      <w-fader ${p.symmetric ? 'symmetric' : ''}
                        size="100"
                        sizebroken="${size || 100}"
                      ></w-fader>`
              }
              else if (type === 'knob') {
                html += `
                      <w-knob ${p.symmetric ? 'symmetric' : ''}
                        kind="${kind || 'soft'}"
                        shape="${shape || 'hexagon'}"
                        size="${size || 60}"
                      ></w-knob>`
              }
              html += `
                    </w-param>
                  </w-tooltip>`
              return html
            }
            return p.select.length
              ? `<w-radio name="${p.name}" group="${group}"></w-radio>`
              : `
          <w-param ${
                p.symmetric ? 'symmetric' : ''
              }  name="${p.name}" group="${group}" slope="${p.slope}">
              ${
                (Math.random() * 3 | 0) === 0
                  ? `<w-fader ${
                    p.symmetric
                      ? 'symmetric'
                      : ''
                  } size="100"></w-fader>`
                  : `<w-knob ${p.symmetric ? 'symmetric' : ''} kind="${
                    ['soft', 'hard'][Math.random() * 2 | 0]
                  }" shape="${
                    [
                      'hexagon',
                      'octagon',
                      'decagon',
                      'dodecagon',
                    ][Math.random() * 4 | 0]
                  }" size="${65 + (Math.random() * 3 | 0) * 10}"></w-knob>`
              }
          </w-param>
          `
          }).join('') + '</fieldset>'
      }).join('')
    }
      </div>
      <!-- <w-piano vertical halfoctaves="${8 * 2}"></w-piano> -->
      <w-pianoroll></w-pianoroll>
    </w-spacer>
    <slot></slot>
    <w-destination></w-destination>
  </w-worklet>
  `
    ;[...this.root.querySelectorAll('w-radio')].forEach(el => {
      const param = plugin.parameters.find(p => p.name == el.name)
      el.value = param.value
      el.select = param.select
    })
  },

  component() {
    effect(
      atomic(async () => {
        const plugin = await load(this.src)
        this.paint(plugin)
      }),
      this.src,
      this.styling,
      this.audioContext,
    )

    effect(
      () => {
        this.worklet.audioContext = this.audioContext
      },
      this.worklet,
      this.audioContext,
    )

    effect(() => {
      if (this.connected) {
        this.scheduler.connect(this.worklet.audioNode)
      }
    }, this.connected)

    effect(
      () => {
        this.worklet.addEventListener(
          'ready',
          callback(() => {
            if (!this.worklet.audioNode) return
            this.connected = true
          }),
        )
        this.pianoroll.events = this.events
        this.pianoroll.addEventListener(
          'noteadd',
          callback(({ detail: event }) => {
            this.addNoteEvent(event)
          }),
        )
        this.pianoroll.addEventListener(
          'notedelete',
          callback(({ detail: event }) => {
            this.deleteNoteEvent(event)
          }),
        )
      },
      this.pianoroll,
      this.worklet,
      this.audioContext,
    )

    effect(() => {
      for (const event of this.events) {
        if (event) {
          this.addNoteEvent(event)
        }
      }
    }, this.connected)

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

    effect(
      () => {
        this.pianoroll.addEventListener(
          'midimessage',
          callback((e) => {
            this.audioContext.resume()
            e.detail.receivedTime = performance.now()
            dispatchMIDIMessageEvent(this.worklet.audioNode, e.detail)
          }),
        )
      },
      this.worklet,
      this.pianoroll,
    )
  },
})

import { callback, create, effect } from '../dist/index.js'

const midiMessageEvent = new MIDIMessageEvent('midimessage', {
  data: new Uint8Array([0, 0, 0]),
})

export default create({
  class: 'pianoroll',

  attrs: { octaves: 8 },

  component() {
    const { octaves } = this

    this.render `
      <div id="outer">
        <div id="velocity"></div>
        <div class="pianoroll">
          <div class="inner">
            <div id="keys"></div>
            <div id="grid-timeline"></div>
            <div class="grid-events">
            </div>
            <div id="#grid-steps">
              ${12 * octaves}
            </div>
          </div>
        </div>
      </div>
    `
  },
})

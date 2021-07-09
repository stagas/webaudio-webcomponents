import { callback, create, effect } from '../dist/index.js'

const midiMessageEvent = new MIDIMessageEvent('midimessage', {
  data: new Uint8Array([0, 0, 0]),
})

export default create({
  class: 'piano',

  attrs: { halfOctaves: 4, startOctave: 5 },

  props: { notePressed: Number },

  pins: { outer: '#outer', button: 'button', keyboard: '[part=keyboard]' },

  turnOnKey(note) {
    try {
      const el = this.get(`[data-note="${note}"]`)
      if (el.classList.contains('pressed')) return
      el.classList.add('pressed')
      midiMessageEvent.data[0] = 0x90
      midiMessageEvent.data[1] = (12 * this.startOctave) + Number(note)
      midiMessageEvent.data[2] = 127
      this.dispatch('midimessage', midiMessageEvent)
    }
    catch {
      //
    }
  },

  turnOffKey(note) {
    try {
      const el = this.get(`[data-note="${note}"]`)
      if (!el.classList.contains('pressed')) return
      el.classList.remove('pressed')
      midiMessageEvent.data[0] = 0x89
      midiMessageEvent.data[1] = (12 * this.startOctave) + Number(note)
      midiMessageEvent.data[2] = 0
      this.dispatch('midimessage', midiMessageEvent)
    }
    catch {
      //
    }
  },

  getNote(key) {
    key = key.toLowerCase()
    let note = "zsxdcvgbhnjm,l.;/'\\".indexOf(key)
    if (note < 0) {
      note = 'q2w3er5t6y7ui9o0p[=]'.indexOf(key)
      if (note >= 0) note += 12
      else return -1
    }
    return note
  },

  component() {
    effect(() => {
      this.render `
        <style>
          :host {
            --pressed-white: #e44;
            --pressed-black: #e44;
          }

          #outer {
            position: relative;
            user-select: none;
            height: 100%;
            width: 100%;
            display: inline-flex;
            margin: auto;
            justify-content: center;
            align-items: center;
          }

          .key {
            box-sizing: border-box;
            float: left;
            position: relative;
            color: #999;
            display: flex;
            flex-flow: row nowrap;
            flex: 1;
            align-items:flex-end;
            white-space: nowrap;
            text-transform: uppercase;
            font-family: sans-serif;
            font-size: 6pt;
            padding: 3px;
          }

          .white {
            height: calc(8vh + 8vw);
            flex: 10;
            z-index: 1;
            background-color: #CBCBCB;
          }

          .black {
            z-index: 2;
            flex: 5;
            height: calc(6vw + 3.5vh);
            background-color: #101010;
          }

          .black {
            margin: 0 -${[10, 4, 3, 2, 2][this.halfOctaves - 1] || 1.3}vw;
          }

          .pressed.white {
            background: var(--pressed-white) !important;
          }

          .pressed.black {
            background: var(--pressed-black) !important;
          }

          button {
            box-sizing: border-box;
            pointer-events: none;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            position: absolute;
            top: 0;
            background: none;
            color: #fff;
            z-index: 0;
            caret: none;
            resize: none;
          }

          #keyboard {
            position: relative;
            display: flex;
            flex-flow: row nowrap;
            flex: 1;
          }
          #keyboard .key:last-child {
            border-right: none !important;
          }
        </style>

        <div id="outer">
          <button></button>
          <div id="keyboard" part="keyboard">
            ${
        Array(
          6 * this.halfOctaves + (this.halfOctaves % 2 === 0
            ? 1
            : this.halfOctaves % 1 === 0
            ? -1
            : 1),
        ).fill(0).map((_, i) => {
          const ii = i % 12
          const bw = 'wbwbwwbwbwbw'[ii] === 'b'
          const nt = 'ccddeffggaab'[ii]
          const sh = '-s-s--s-s-s-'[ii] === 's'
          return `<div data-note="${i}" part="${
            bw
              ? 'piano-black'
              : 'piano-white'
          }" class="note key ${bw ? 'black' : 'white'} ${nt}">${nt}${
            sh ? '#' : ''
          }</div>`
        }).join('')
      }
          </div>
        </div>
      `
    }, this.halfOctaves)

    effect(() => {
      const resizeObserver = new ResizeObserver(callback(() => {
        this.halfOctaves = Math.round(
          (this.outer.getBoundingClientRect().width / 28) / 6,
        )
      }))
      resizeObserver.observe(this.outer)
    }, this.outer)

    effect(() => {
      this.button.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') return
        e.preventDefault()
        e.stopPropagation()
        const note = this.getNote(e.key)
        if (note >= 0) this.turnOnKey(note)
      })
      this.button.addEventListener('keyup', (e) => {
        if (e.key === 'Tab') return
        e.preventDefault()
        e.stopPropagation()
        const note = this.getNote(e.key)
        if (note >= 0) this.turnOffKey(note)
      })
    }, this.button)

    effect(() => {
      this.keyboard.addEventListener(
        'mousedown',
        callback((e) => {
          e.preventDefault()
          e.stopPropagation()

          this.button.focus()
          const onmousemove = callback((e) => {
            const note = e.target.dataset.note
            if (note) {
              this.turnOffKey(this.notePressed)
              this.turnOnKey(note)
              this.notePressed = note
            }
          })

          const onmouseup = callback(() => {
            this.turnOffKey(this.notePressed)
            this.keyboard.removeEventListener('mousemove', onmousemove)
          })

          this.keyboard.addEventListener('mousemove', onmousemove)
          window.addEventListener('mouseup', onmouseup, { once: true })

          onmousemove(e)
        }),
      )
    }, this.keyboard)

    effect(() => {
    }, this.notePressed)
  },
})

import { callback, create, effect } from '../dist/index.js'

export default create({
  class: 'piano',

  attrs: {},

  props: { notePressed: Number },

  pins: { keyboard: '[part=keyboard]' },

  component() {
    this.html = `
      <style>
        :host {
          --pressed-white: #e44;
          --pressed-black: #e44;
        }

        #outer {
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
          height: 15vw;
          flex: 1;
          z-index: 1;
          background-color: #CBCBCB;
        }

        .black {
          flex: 0.8;
          height: 9.2vw;
          width: calc(100vw/10*0.5);
          z-index: 2;
          background-color: #101010;
        }

        .a, .b, .d, .e, .g, .black {
          margin: 0 0 0 -3vw;
        }

        .pressed.white {
          background: var(--pressed-white) !important;
        }

        .pressed.black {
          background: var(--pressed-black) !important;
        }

        #keyboard {
          display: flex;
          flex-flow: row nowrap;
          flex: 1;
        }

        #keyboard > .note:last-child {
          border-right: 0.12vw solid #AAAAAA;
        }
      </style>

      <div id="outer">
        <div id="keyboard" part="keyboard">
          ${
      Array(12 * 2).fill(0).map((_, i) => {
        const ii = i % 12
        const bw = 'wbwbwwbwbwbw'[ii] === 'b'
        const nt = 'ccddeffggaab'[ii]
        const sh = '-s-s--s-s-s-'[ii] === 's'
        return `<div data-note="${i}" part="${
          bw ? 'piano-black' : 'piano-white'
        }" class="note key ${bw ? 'black' : 'white'} ${nt}">${nt}${
          sh ? '#' : ''
        }</div>`
      }).join('')
    }
        </div>
      </div>
    `

    effect(() => {
      this.keyboard.addEventListener(
        'mousedown',
        callback((e) => {
          e.preventDefault()
          e.stopPropagation()

          const onmousemove = callback((e) => {
            const note = e.target.dataset.note
            if (note) {
              try {
                this.get(`[data-note="${this.notePressed}"]`).classList.remove(
                  'pressed',
                )
              }
              catch {
                //
              }
              this.notePressed = note
              e.target.classList.add('pressed')
            }
          })

          const onmouseup = callback((e) => {
            try {
              this.get(`[data-note="${this.notePressed}"]`).classList.remove(
                'pressed',
              )
            }
            catch {
              //
            }
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

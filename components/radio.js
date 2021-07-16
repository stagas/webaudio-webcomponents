import { create, effect, slug } from '../dist/index.js'

export default create({
  class: 'radio',

  attrs: {
    group: String,
    name: String,
    max: Number,
    min: Number,
    value: Number,
  },

  props: { acting: Boolean, select: [] },

  pins: { radios: '#radios' },

  setRadio(n) {
    const scale = (this.max - this.min)
    this.value = Math.ceil((+n / this.select.length) * scale + this.min)
  },

  component() {
    effect(
      () => {
        if (!this.select.length) return

        const activeIndex = this.value // (this.select.length / this.value) | 0

        this.render `
          <style>

          :root {
            --radio-color: var(--black);
            --radio-checked-circle-color: var(--white);
            --radio-checked-color: var(--grey);
            --radio-size: 1em;
          }

          #radios {
            position: relative;
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            padding: 0;
            margin: 0;
            margin-top: 0px;
            border: none;
          }

          #inner {
            position: relative;
          }

          #back {
            background: var(--black);
            height: 96%;
            position: absolute;

            top: 0em;
            margin-left: 0.25em;
            width: 1.5rem;
          }

          #radios > label {
            display: inline-flex;
            font-size: 8pt;
            font-weight: bold;
            margin: 0em 0em 0 0;
            writing-mode: vertical-rl;
            transform: scale(-1);
            text-align: center;
            color: var(--light);
            white-space: nowrap;
            font-family: sans-serif;
          }

          .radio {
            font-family: sans-serif;
            display: flex;
          }

          .radio input {
            opacity: 0;
            width: 0;
            height: 0;
            padding: 0;
            margin: 0;
          }
          .radio input:checked + label:after {
            border-color: var(--primary);
          }
          .radio input:checked + label:before {
            transform: scale(0.5);
          }

          .radio label {
            font-family: sans-serif;
            font-size: 8pt;
            user-select: none;
            top: 0.02rem;
            position: relative;
            box-sizing: border-box;
            color: var(--grey);
            font-weight: bold;
            cursor: pointer;
            padding: 2px 0;
            padding-left: calc(1.5rem + 1.3vw);
          }
          .radio input:checked + label {
            color: var(--white);
          }
          .radio label:after {
            left: 0;
            top: 0;
          }
          .radio label:before {
            content: '';
            transform: scale(0);
            display: inline-block;
            position: absolute;
            filter: saturate(5);

            background: var(--white);

            position: absolute;
            left: calc(0.31rem);
            top: 0.3rem;
            height: 0.5rem;
            width: 1.5rem;
          }

          .radio-group:not(:hover)
            .radio input:focus
              + label:before {
                  border-left: 1.5px solid $white;
                  border-right: 1.5px solid $white;
                }




          </style>

          <fieldset id="radios" class="radio-group">
            <label for="${this.name}">${
          this.name.replace(this.group, '').trim()
        }</label>
          <div id="inner">
          <div id="back" part="radio-back"></div>
              ${
          this.select.map((radioName, index) => `
                <div class="radio">
                  <input type="radio"
                    name="${slug(this.name)}"
                    id="${slug(this.name + radioName)}"
                    oninput="setRadio(${index})"
                  ${index === activeIndex ? 'checked' : ''} />
                  <label for="${
            slug(this.name + radioName)
          }">${radioName}</label>
                </div>`).join('')
        }
              </div>
            </div>
          </fieldset>

        `
      },
      this.name,
      this.min,
      this.max,
      this.value,
      this.select,
    )
  },
})

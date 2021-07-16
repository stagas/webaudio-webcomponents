import {
  callback,
  create,
  effect,
  getRelativeMouseCoords,
} from '../dist/index.js'

export default create({
  class: 'tooltip',
  slot: true,
  attrs: { content: String },
  pins: { tooltip: '.tooltip' },
  component() {
    effect(() => {
      this.render `
        <slot part="tooltip-wrap"></slot>
        <div class="tooltip" part="tooltip-content">
          ${this.content}
        </div>`
    }, this.content)

    effect(() => {
      document.body.appendChild(this.tooltip)
      this.addEventListener(
        'contextmenu',
        callback((e) => {
          e.preventDefault()
          e.stopPropagation()
          this.tooltip.classList.add('show')
          // const box = this.getBoundingClientRect()
          const rect = this.tooltip.getBoundingClientRect()
          this.tooltip.style.top = e.pageY - (rect.height / 2) + 'px'
          this.tooltip.style.left = e.pageX + 10 + 'px'
          let ignoreMouseLeave = false
          this.tooltip.addEventListener(
            'mouseenter',
            callback(() => {
              ignoreMouseLeave = true
              this.tooltip.addEventListener(
                'mouseleave',
                callback(() => {
                  this.tooltip.classList.remove('show')
                }),
                { once: true },
              )
            }),
          )
          this.addEventListener(
            'mouseleave',
            callback(() => {
              setTimeout(
                callback(() => {
                  if (ignoreMouseLeave) return
                  this.tooltip.classList.remove('show')
                }),
                1,
              )
            }),
            { once: true },
          )
        }),
      )
    }, this.tooltip)
  },
})

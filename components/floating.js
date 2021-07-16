import { callback, create, effect } from '../dist/index.js'

export default create({
  class: 'floating',
  slot: true,
  attrs: { center: true },
  props: { isDragging: false },
  component() {
    this.style.position = 'fixed'
    this.addEventListener('mousedown', e => {
      e.preventDefault()
      e.stopPropagation()

      const rect = this.getBoundingClientRect()
      const offsetX = e.clientX - rect.x
      const offsetY = e.clientY - rect.y

      this.style.right = 'auto'
      this.style.bottom = 'auto'

      this.isDragging = true
      this.classList.add('dragging')

      const onmousemove = callback(e => {
        Object.assign(this.style, {
          left: (e.clientX - offsetX) + 'px',
          top: (e.clientY - offsetY) + 'px',
        })
      })

      window.addEventListener('mousemove', onmousemove)
      window.addEventListener('mouseup', () => {
        window.removeEventListener('mousemove', onmousemove)
        this.classList.remove('dragging')
        this.isDragging = false
      }, { once: true })
    })

    effect(
      () => {
        const rect = this.getBoundingClientRect()
        if (this.center) {
          this.style.left = window.innerWidth / 2 - rect.width / 2 + 'px'
          this.style.top = window.innerHeight / 2 - rect.height / 2 + 'px'
          this.style.right = 'auto'
          this.style.bottom = 'auto'
        }
      },
      this.slotted,
      this.center,
    )
  },
})

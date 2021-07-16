import { create, effect } from '../dist/index.js'

const icons = {
  'play': 'box:24;width:.1;fill:black;path:M8 5v14l11-7z',
  'stop': 'box:24;width:.1;fill:black;path:M6 6h12v12H6z',
  'pause': 'box:24;width:.1;fill:black;path:M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  'volume':
    'box:24;width:.1;fill:black;path:M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  'volume_off':
    'box:24;width:.1;fill:black;path:M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
  'fullscreen':
    'box:24;width:.1;fill:black;path:M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  'drag':
    'box:36;fill:#000;width:.1;path:M13.5 12a1.5 1.5 0 1 03 0a1.5 1.5 0 1 0 -3 0M13.5 24a1.5 1.5 0 1 03 0a1.5 1.5 0 1 0 -3 0M19.5 12a1.5 1.5 0 1 03 0a1.5 1.5 0 1 0 -3 0M19.5 24a1.5 1.5 0 1 03 0a1.5 1.5 0 1 0 -3 0M19.5 18a1.5 1.5 0 1 03 0a1.5 1.5 0 1 0 -3 0M13.5 18a1.5 1.5 0 1 03 0a1.5 1.5 0 1 0 -3 0',
}

customElements.define(
  'svg-icon',
  create({
    class: 'svg-icon',
    attrs: { is: String },

    component() {
      effect(() => {
        const [box, , , path] = icons[this.is].split(';').map(x =>
          x.split(':')[1]
        )
        this.html =
          `<svg viewBox="0 0 ${box} ${box}" style="vertical-align:top"><path part="svg-icon-path" d="${path}" /></svg>`
      }, this.is)
    },
  }),
)

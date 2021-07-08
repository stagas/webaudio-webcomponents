class Noise extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      name: 'volume',
      defaultValue: 30,
      minValue: 0,
      maxValue: 150,
      automationRate: 'a-rate',
    }, {
      name: 'filter',
      defaultValue: 0.5,
      minValue: 0,
      maxValue: 1,
      automationRate: 'a-rate',
    }]
  }
  process(_inputs, outputs, parameters) {
    const output = outputs[0]
    const volume = parameters.volume
    if (volume.length === 1) {
      const v = volume[0] * 0.01
      output.forEach((channel) => {
        for (let i = 0; i < channel.length; i++) {
          channel[i] = (Math.random() * 2 - 1) * v
        }
      })
    }
    else {
      output.forEach((channel) => {
        for (let i = 0; i < channel.length; i++) {
          channel[i] = (Math.random() * 2 - 1) * volume[i] * 0.01
        }
      })
    }
    return true
  }
}

registerProcessor('noise', Noise)

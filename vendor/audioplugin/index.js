// midi event singleton to prevent memory leaks
class Uint8SharedArray extends Uint8Array {
    constructor(length) {
        super(new SharedArrayBuffer(length * Uint8Array.BYTES_PER_ELEMENT));
    }
}
const midiEventSingleton = {
    type: 'midimessage',
    data: new Uint8SharedArray(3),
    receivedTime: 0,
};
export function copyMIDIMessageEvent(audio, event) {
    const midiTime = performance.now();
    const audioTime = audio.currentTime * 1000;
    const offsetTime = audioTime - midiTime;
    midiEventSingleton.type = event.type;
    midiEventSingleton.data.set(event.data);
    midiEventSingleton.receivedTime =
        (event.receivedTime ?? event.timeStamp) + offsetTime;
    return midiEventSingleton;
}
export function dispatchMIDIMessageEvent(node, event) {
    node.port.postMessage({
        event: 'MIDIMessageEvent',
        payload: copyMIDIMessageEvent(node.context, event),
    });
}
export class AudioPluginPreset {
    name;
    values;
    cloneOf;
    constructor(preset) {
        this.name = preset.name;
        // recover from accidental JSON.stringify(float32Array)
        if (!Array.isArray(preset.values)) {
            const values = [];
            for (const index in Object.keys(preset.values)) {
                values[index] = preset.values[index];
            }
            preset.values = values;
        }
        this.values = new Float32Array(preset.values.slice());
        this.cloneOf = preset.cloneOf;
    }
}
export class AudioPluginParam {
    static scale(param, value) {
        var { defaultValue, minValue, maxValue, symmetric } = param;
        const scale = maxValue - minValue;
        value = value ?? defaultValue;
        value = symmetric
            ? value < 0.5
                ? Math.pow(value * 2, param.slope) * 0.5
                : 1 - Math.pow(1 - (value - 0.5) * 2, param.slope) * 0.5
            : Math.pow(value, 1 / param.slope);
        return value * scale + minValue;
    }
    static normalize(param, value) {
        var { defaultValue, minValue, maxValue, symmetric } = param;
        const scale = maxValue - minValue;
        value = value ?? defaultValue;
        value = (value - minValue) / scale;
        value = symmetric
            ? value < 0.5
                ? Math.pow(value * 2, 1 / param.slope) * 0.5
                : 1 - Math.pow(1 - (value - 0.5) * 2, 1 / param.slope) * 0.5
            : Math.pow(value, param.slope);
        return value;
    }
    name = 'untitled param';
    value = 0;
    defaultValue = 0;
    minValue = 0;
    maxValue = 1;
    automationRate = 'k-rate';
    slope = 1; // <1=exp, 1=linear, >1=log
    select = [];
    displayUnit = '';
    symmetric = false;
    stringValue;
    constructor(param) {
        this.value = param.defaultValue;
        Object.assign(this, param);
    }
    scale(value) {
        return AudioPluginParam.scale(this, value);
    }
    normalize(value) {
        return AudioPluginParam.normalize(this, value);
    }
}
export class AudioStringParam {
    _stringValue = '';
    _setter;
    constructor(setter) {
        this._setter = setter;
    }
    get value() {
        return this._stringValue;
    }
    set value(stringValue) {
        this._stringValue = stringValue;
        this._setter(this._stringValue);
    }
}
export function load(path) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(path, {
            type: 'module',
            credentials: 'same-origin',
        });
        worker.onmessageerror = worker.onerror = reject;
        worker.onmessage = (event) => {
            worker.terminate();
            const plugin = event.data;
            plugin.presets.unshift(new AudioPluginPreset({
                name: 'Default',
                values: new Float32Array(plugin.parameters.map((p) => p.defaultValue)),
            }));
            plugin.parameters = plugin.parameters.map((p) => new AudioPluginParam(p));
            resolve(plugin);
        };
    });
}

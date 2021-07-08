declare class Uint8SharedArray extends Uint8Array {
    constructor(length: number);
}
export declare function copyMIDIMessageEvent(audio: BaseAudioContext, event: MIDIMessageEvent): {
    type: string;
    data: Uint8SharedArray;
    receivedTime: number;
};
export declare function dispatchMIDIMessageEvent(node: AudioWorkletNode, event: MIDIMessageEvent): void;
export declare type AudioPluginCategory = 'effect' | 'synth' | 'analysis' | 'mastering' | 'spacializer' | 'room-fx' | 'surround-fx' | 'restoration' | 'offline-process' | 'shell' | 'generator' | 'unknown';
export interface AudioPlugin {
    nonce: string;
    path: string;
    name: string;
    vendor: string;
    category: AudioPluginCategory;
    uniqueId: number;
    version: number;
    inputChannelCount: number[];
    outputChannelCount: number[];
    options: AudioWorkletNodeOptions;
    presets: AudioPluginPreset[];
    parameters: AudioPluginParam[];
}
export declare class AudioPluginPreset {
    name: string;
    values: Float32Array | number[];
    cloneOf?: string;
    constructor(preset: AudioPluginPreset);
}
export declare class AudioPluginParam {
    static scale(param: AudioParamDescriptor, value?: number): number;
    static normalize(param: AudioParamDescriptor, value?: number): number;
    name: string;
    value: number;
    defaultValue: number;
    minValue: number;
    maxValue: number;
    automationRate: 'a-rate' | 'k-rate';
    slope: number;
    select: string[];
    displayUnit: string;
    symmetric: boolean;
    stringValue?: string;
    constructor(param: AudioParamDescriptor);
    scale(value?: number): number;
    normalize(value?: number): number;
}
export declare type AudioParamLike = AudioParam | AudioStringParam;
export declare class AudioStringParam {
    _stringValue: string;
    _setter: (_stringValue: string) => void;
    constructor(setter: (_stringValue: string) => void);
    get value(): string;
    set value(stringValue: string);
}
export declare function load(path: string): Promise<AudioPlugin>;
export {};

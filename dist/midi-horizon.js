export const MIDI_MAX_BARS=128;
export function midiHorizon(bars,step){return Math.min(MIDI_MAX_BARS,Math.max(bars,Math.ceil((Math.max(0,step)+16)/16)));}
export function midiNoteLength(start,elapsed,steps){return Math.max(1/96,Math.min(steps-start,Math.max(1/96,elapsed)));}

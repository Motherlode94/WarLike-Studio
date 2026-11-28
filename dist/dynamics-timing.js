import {voiceShiftLatency} from './voice-shift-timing.js';
// Both dynamics processors use the same fixed, sample-rounded anticipation.
export const dynamicsFrames=rate=>Math.ceil(rate*.006);
export const dynamicsLatency=(rate,stages=1)=>stages*dynamicsFrames(rate)/rate;

export function effectLatency(id,rate=48000){
 const type=String(id||'').split('__')[0];
 if(['voxlevel','elianaguard'].includes(type))return dynamicsLatency(rate,2);
 if(['peak','vectorlimit','press','glue','circuitbus','vectorcomp','exostrip','hardibus','hardivocalcomp','hardideess','elianaembrace'].includes(type))return dynamicsLatency(rate);
 return type==='voxshift'?voiceShiftLatency(rate):type==='voxtune'?.04:0;
}

import {voiceShiftLatency} from './voice-shift-timing.js';
export function createVoiceShift(ctx,scope){
 if(!ctx.audioWorklet||typeof AudioWorkletNode==='undefined')throw Error('VOX SHIFT demande AudioWorklet et une connexion HTTPS.');
 const node=new AudioWorkletNode(ctx,'warlike-voice-shift',{numberOfInputs:1,numberOfOutputs:1,channelCount:2,channelCountMode:'clamped-max'});
 node.latency=voiceShiftLatency(ctx.sampleRate);let disposed=false;
 node.dispose=()=>{if(disposed)return;disposed=true;node.port.postMessage({type:'dispose'});node.port.close();node.disconnect();};
 scope?.nodes?.push(node);scope?.cleanups?.push(node.dispose);return node;
}

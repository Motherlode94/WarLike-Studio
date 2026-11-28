import {voiceShiftGrain,voiceShiftFrames} from './voice-shift-timing.js';
// Original monophonic vocal pitch effect. Two windowed time-domain grains
// read a delay buffer at variable speed. Its mild latency is intentional;
// this is an independent shifter, not a claim of formant preservation.
class WLVoiceShift extends AudioWorkletProcessor {
 static get parameterDescriptors(){return [
  {name:'semitones',defaultValue:0,minValue:-12,maxValue:12,automationRate:'k-rate'},
  {name:'mix',defaultValue:1,minValue:0,maxValue:1,automationRate:'k-rate'}
 ];}
 constructor(){super();this.grain=voiceShiftGrain(sampleRate);this.latency=voiceShiftFrames(sampleRate);this.alive=true;this.port.onmessage=event=>{if(event.data?.type==='dispose'){this.alive=false;this.port.close();}};this.size=Math.max(32768,2**Math.ceil(Math.log2(3*this.grain+2)));this.mask=this.size-1;this.rings=[new Float32Array(this.size),new Float32Array(this.size)];this.index=0;this.phase=0;this.base=this.grain*2;}
 sample(channel,delay){const p=(this.index-delay+this.size*2)%this.size;const i=Math.floor(p),f=p-i;return this.rings[channel][i]*(1-f)+this.rings[channel][(i+1)&this.mask]*f;}
 process(inputs,outputs,parameters){
  if(!this.alive)return false;
  const input=inputs[0]||[],output=outputs[0]||[];
  const ratio=2**(Math.max(-12,Math.min(12,parameters.semitones[0]||0))/12);
  const mix=Math.max(0,Math.min(1,parameters.mix[0]??1));
  const len=output[0]?.length||0;
  for(let i=0;i<len;i++){
   for(let ch=0;ch<2;ch++)this.rings[ch][this.index]=input[ch]?.[i]??input[0]?.[i]??0;
   this.phase=(this.phase+(1-ratio)/this.grain+1)%1;
   const other=(this.phase+.5)%1;
   const w=.5-.5*Math.cos(Math.PI*2*this.phase);
   for(let ch=0;ch<output.length;ch++){
    const dry=this.sample(Math.min(ch,1),this.latency);
    const shifted=Math.abs(ratio-1)<1e-9?dry:this.sample(Math.min(ch,1),this.base+this.phase*this.grain)*w+
      this.sample(Math.min(ch,1),this.base+other*this.grain)*(1-w);
    output[ch][i]=dry*(1-mix)+shifted*mix;
   }
   this.index=(this.index+1)&this.mask;
  }
  return true;
 }
}
registerProcessor('warlike-voice-shift',WLVoiceShift);

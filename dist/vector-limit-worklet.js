import {VectorLimiter} from './vector-limit-dsp.js';

class VectorLimitProcessor extends AudioWorkletProcessor {
 static get parameterDescriptors() {
  return [
   {name:'ceiling', defaultValue:-1, minValue:-12, maxValue:-.1, automationRate:'a-rate'},
   {name:'release', defaultValue:100, minValue:20, maxValue:500, automationRate:'k-rate'}
  ];
 }
 constructor(options) {
  super(); this.reportMeter=options?.processorOptions?.reportMeter!==false; this.limiter = new VectorLimiter(sampleRate); this.alive = true; this.frames = 0; this.minimumGain = 1;
  this.port.onmessage = event => { if (event.data?.type === 'dispose') { this.alive = false; this.port.close(); } };
 }
 process(inputs, outputs, parameters) {
  if (!this.alive) return false;
  const input = inputs[0], output = outputs[0], left = input[0], right = input[1] || left;
  const ceiling = parameters.ceiling, release = parameters.release[0], limiter = this.limiter;
  for (let i = 0; i < output[0].length; i++) {
   limiter.process(left?.[i] || 0, right?.[i] || 0, ceiling.length === 1 ? ceiling[0] : ceiling[i], release);
   output[0][i] = limiter.left; if (output[1]) output[1][i] = limiter.right;
   this.minimumGain = Math.min(this.minimumGain, limiter.gain);
  }
  this.frames += output[0].length;
  if (this.reportMeter && this.frames >= sampleRate / 10) {
   this.port.postMessage({reduction:20 * Math.log10(Math.max(1e-12, this.minimumGain))});
   this.frames = 0; this.minimumGain = 1;
  }
  return true;
 }
}
registerProcessor('warlike-vector-limit', VectorLimitProcessor);

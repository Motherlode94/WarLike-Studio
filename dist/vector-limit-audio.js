import {limiterLatency} from './vector-limit-dsp.js';

export function createVectorLimiter(ctx, scope = null) {
 if (!ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') throw Error('Le limiteur demande AudioWorklet et une connexion HTTPS.');
 const drive = ctx.createGain(), output = ctx.createGain();
 const processor = new AudioWorkletNode(ctx, 'warlike-vector-limit', {numberOfInputs:1, numberOfOutputs:1, outputChannelCount:[2], channelCount:2, channelCountMode:'explicit', processorOptions:{reportMeter:!(typeof OfflineAudioContext!=='undefined'&&ctx instanceof OfflineAudioContext)}});
 drive.connect(processor); processor.connect(output);
 let disposed=false;
 const stage = {input:drive, output, drive, processor, reduction:0, latency:limiterLatency(ctx.sampleRate), bindings:{drive:[[drive.gain, x => 10 ** (x / 20), true]], ceiling:[processor.parameters.get('ceiling')], release:[processor.parameters.get('release')]}, dispose() {
  if(disposed)return;disposed=true;
  processor.port.onmessage = null; processor.port.postMessage({type:'dispose'}); processor.port.close();
  drive.disconnect(); processor.disconnect(); output.disconnect();
 }};
 processor.port.onmessage = event => { if (Number.isFinite(event.data?.reduction)) stage.reduction = event.data.reduction; };
 scope?.nodes?.push(drive, processor, output); scope?.cleanups?.push(stage.dispose);
 return stage;
}

export function syncVectorLimiter(stage, state, now, initial) {
 const set = (param, value) => initial ? param.setValueAtTime(value, now) : param.setTargetAtTime(value, now, .02);
 set(stage.drive.gain, 10 ** (state.drive / 20));
 set(stage.processor.parameters.get('ceiling'), state.ceiling);
 set(stage.processor.parameters.get('release'), state.release);
}

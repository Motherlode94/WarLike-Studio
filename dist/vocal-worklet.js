import {VocalKernel} from './vocal-kernel.js?v=0.14.0';
class VocalPitch extends AudioWorkletProcessor{
 static get parameterDescriptors(){return [{name:'key',defaultValue:9,minValue:0,maxValue:11,automationRate:'k-rate'},{name:'scale',defaultValue:0,minValue:0,maxValue:2,automationRate:'k-rate'},{name:'speed',defaultValue:35,minValue:0,maxValue:250,automationRate:'k-rate'},{name:'amount',defaultValue:1,minValue:0,maxValue:1,automationRate:'k-rate'},{name:'mix',defaultValue:1,minValue:0,maxValue:1,automationRate:'k-rate'}];}
 constructor(){super();this.kernel=new VocalKernel(sampleRate);this.telemetry=false;this.nextReport=0;this.port.onmessage=e=>{if(e.data?.type==='vox-tune-monitor'){this.telemetry=e.data.enabled===true;this.nextReport=0;}};}
 process(inputs,outputs,params){const alive=this.kernel.process(inputs[0]||[],outputs[0],Object.fromEntries(Object.entries(params).map(([k,v])=>[k,v[0]])));if(this.telemetry&&this.kernel.frames>=this.nextReport){const k=this.kernel;this.nextReport=k.frames+Math.round(sampleRate/10);this.port.postMessage({type:'vox-tune-telemetry',frequency:k.detectedFrequency,midi:k.detectedMidi,target:k.targetMidi,cents:1200*Math.log2(k.ratio)});}return alive;}
}
registerProcessor('warlike-vocal-pitch',VocalPitch);

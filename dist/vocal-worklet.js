import {VocalKernel} from './vocal-kernel.js?v=0.14.0';
class VocalPitch extends AudioWorkletProcessor{
 static get parameterDescriptors(){return [{name:'key',defaultValue:9,minValue:0,maxValue:11,automationRate:'k-rate'},{name:'scale',defaultValue:0,minValue:0,maxValue:2,automationRate:'k-rate'},{name:'speed',defaultValue:35,minValue:0,maxValue:250,automationRate:'k-rate'},{name:'amount',defaultValue:1,minValue:0,maxValue:1,automationRate:'k-rate'},{name:'mix',defaultValue:1,minValue:0,maxValue:1,automationRate:'k-rate'}];}
 constructor(){super();this.kernel=new VocalKernel(sampleRate);}
 process(inputs,outputs,params){return this.kernel.process(inputs[0]||[],outputs[0],Object.fromEntries(Object.entries(params).map(([k,v])=>[k,v[0]])));}
}
registerProcessor('warlike-vocal-pitch',VocalPitch);

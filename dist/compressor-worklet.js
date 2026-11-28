import {StereoDeesser} from './deesser-dsp.js';
import {StereoCompressor} from './compressor-dsp.js';
class CompressorProcessor extends AudioWorkletProcessor {
 static get parameterDescriptors(){return [
  {name:'threshold',defaultValue:-20,minValue:-100,maxValue:0,automationRate:'a-rate'},
  {name:'ratio',defaultValue:3,minValue:1,maxValue:40,automationRate:'a-rate'},
  {name:'knee',defaultValue:6,minValue:0,maxValue:48,automationRate:'a-rate'},
  {name:'attack',defaultValue:.02,minValue:.0001,maxValue:1,automationRate:'a-rate'},
  {name:'release',defaultValue:.18,minValue:.005,maxValue:5,automationRate:'a-rate'}
 ];}
 constructor(options){
  super();this.compressor=new StereoCompressor(sampleRate);this.alive=true;
  this.reportMeter=options?.processorOptions?.reportMeter!==false;this.frames=0;this.minimum=0;
  this.port.onmessage=event=>{if(event.data?.type==='dispose'){this.alive=false;this.port.close();}};
 }
 process(inputs,outputs,parameters){
  if(!this.alive)return false;
  const input=inputs[0],output=outputs[0],left=input[0],right=input[1]||left,c=this.compressor;
  // Second input = Key Input (Pro Tools style external side-chain). Empty when nothing is connected.
  const key=inputs[1],keyL=key?.[0],keyR=key?.[1]||keyL,external=!!keyL?.length;
  const t=parameters.threshold,r=parameters.ratio,k=parameters.knee,a=parameters.attack,s=parameters.release,f=parameters.frequency;
  for(let i=0;i<output[0].length;i++){
   if(external)c.key=Math.max(Math.abs(keyL[i]||0),Math.abs(keyR?.[i]||0));
   c.process(left?.[i]||0,right?.[i]||0,t.length===1?t[0]:t[i],r.length===1?r[0]:r[i],k.length===1?k[0]:k[i],a.length===1?a[0]:a[i],s.length===1?s[0]:s[i],f?(f.length===1?f[0]:f[i]):6500);
   output[0][i]=c.left;if(output[1])output[1][i]=c.right;
   this.minimum=Math.min(this.minimum,c.reduction);
  }
  this.frames+=output[0].length;
  if(this.reportMeter&&this.frames>=sampleRate/10){this.port.postMessage({reduction:this.minimum});this.frames=0;this.minimum=0;}
  return true;
 }
}
registerProcessor('warlike-compressor',CompressorProcessor);

class DeesserProcessor extends CompressorProcessor {
 static get parameterDescriptors(){return [...super.parameterDescriptors,{name:'frequency',defaultValue:6500,minValue:20,maxValue:20000,automationRate:'a-rate'}];}
 constructor(options){super(options);this.compressor=new StereoDeesser(sampleRate);}
}
registerProcessor('warlike-deesser',DeesserProcessor);

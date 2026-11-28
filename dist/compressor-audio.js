import {dynamicsLatency} from './dynamics-timing.js';
function createDynamicsProcessor(ctx,scope,name){
 if(!ctx.audioWorklet||typeof AudioWorkletNode==='undefined')throw Error('Le compresseur demande AudioWorklet et une connexion HTTPS.');
 const node=new AudioWorkletNode(ctx,name,{numberOfInputs:1,numberOfOutputs:1,channelCount:2,channelCountMode:'clamped-max',processorOptions:{reportMeter:!(typeof OfflineAudioContext!=='undefined'&&ctx instanceof OfflineAudioContext)}});
 for(const [key,param] of node.parameters)Object.defineProperty(node,key,{value:param});
 let reduction=0,disposed=false;
 Object.defineProperty(node,'reduction',{get:()=>reduction});
 node.latency=dynamicsLatency(ctx.sampleRate);
 node.port.onmessage=event=>{if(Number.isFinite(event.data?.reduction))reduction=event.data.reduction;};
 node.dispose=()=>{if(disposed)return;disposed=true;node.port.onmessage=null;node.port.postMessage({type:'dispose'});node.port.close();node.disconnect();};
 scope?.nodes?.push(node);scope?.cleanups?.push(node.dispose);
 return node;
}

export const createCompressor=(ctx,scope=null)=>createDynamicsProcessor(ctx,scope,'warlike-compressor');
export const createDeesser=(ctx,scope=null)=>createDynamicsProcessor(ctx,scope,'warlike-deesser');

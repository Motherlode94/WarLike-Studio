const ready=new WeakMap();
export async function createPcmCapture(ctx,input,{channel='1'}={}){
  if(!ctx.audioWorklet||typeof AudioWorkletNode==='undefined')throw Error('L’enregistrement PCM nécessite un navigateur compatible AudioWorklet.');
  if(!ready.has(ctx))ready.set(ctx,ctx.audioWorklet.addModule(new URL('./record-worklet.js?v=0.12.0',import.meta.url)));await ready.get(ctx);
  const node=new AudioWorkletNode(ctx,'chayah-pcm-recorder',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{channel}}),chunks=[];let frames=0,done,failed,closed=false;const completion=new Promise((resolve,reject)=>{done=resolve;failed=reject;});
  node.port.onmessage=({data})=>{if(data.type==='chunk'){chunks.push(data.channels);frames+=data.channels[0].length;}if(data.type==='done')done();};node.onprocessorerror=()=>failed(Error('Le moteur de capture PCM s’est arrêté.'));
  input.connect(node);node.connect(ctx.destination);
  return {get frames(){return frames;},start(time){node.port.postMessage({type:'start',time});},async stop(){if(closed)throw Error('Prise déjà terminée.');closed=true;node.port.postMessage({type:'stop'});try{await Promise.race([completion,new Promise((_,reject)=>setTimeout(()=>reject(Error('La capture audio ne répond plus.')),3000))]);const n=channel==='stereo'?2:1,buffer=ctx.createBuffer(n,Math.max(1,frames),ctx.sampleRate);for(let c=0;c<n;c++){let offset=0;for(const chunk of chunks){buffer.getChannelData(c).set(chunk[c],offset);offset+=chunk[c].length;}}return buffer;}finally{input.disconnect(node);node.disconnect();node.port.close();}},dispose(){if(!closed){closed=true;input.disconnect(node);node.disconnect();node.port.close();}}
  };
}
export function recordingPlacement(startBar,duration,bpm,latencyMs=0){const secondsPerBar=240/bpm,corrected=startBar-latencyMs/1000/secondsPerBar,sourceOffset=Math.max(0,-corrected*secondsPerBar);return {start:Math.max(0,corrected),sourceOffset,length:Math.max(0,(duration-sourceOffset)/secondsPerBar)};}

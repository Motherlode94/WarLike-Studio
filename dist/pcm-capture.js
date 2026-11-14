const ready=new WeakMap();

export async function createPcmCapture(ctx,input,{channel='1',onError,onChunk,retainChunks=true}={}){
  if(!ctx.audioWorklet||typeof AudioWorkletNode==='undefined')
    throw Error('L’enregistrement PCM nécessite un navigateur compatible AudioWorklet.');
  if(!ready.has(ctx))ready.set(ctx,ctx.audioWorklet.addModule(new URL('./record-worklet.js?v=0.14.0',import.meta.url)));
  await ready.get(ctx);
  const node=new AudioWorkletNode(ctx,'chayah-pcm-recorder',{
    numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],processorOptions:{channel}
  });
  const chunks=[];let frames=0,closed=false,processorFailure=null;
  let complete;const completion=new Promise(resolve=>{complete=resolve;});
  node.port.onmessage=({data})=>{
    if(data.type==='chunk'&&Array.isArray(data.channels)&&data.channels.length){
      if(retainChunks)chunks.push(data.channels);
      frames+=data.channels[0].length;
      try{onChunk?.(data.channels);}catch(error){try{onError?.(error);}catch{}}
    }
    if(data.type==='done')complete();
  };
  node.onprocessorerror=()=>{
    if(closed)return;
    processorFailure=Error('Le moteur PCM s’est interrompu. Récupération de la prise partielle.');
    complete();
    try{onError?.(processorFailure);}catch(error){console.warn(error);}
  };
  input.connect(node);node.connect(ctx.destination);
  function cleanup(){
    chunks.length=0;
    try{input.disconnect(node);}catch{}
    try{node.disconnect();}catch{}
    try{node.port.close();}catch{}
  }
  function assemble(){
    if(processorFailure&&!frames)throw processorFailure;
    const channels=channel==='stereo'?2:1;
    const buffer=ctx.createBuffer(channels,Math.max(1,frames),ctx.sampleRate);
    const destinations=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));
    const offsets=Array(channels).fill(0);
    // Release source blocks immediately as they are copied into the final buffer.
    for(let i=0;i<chunks.length;i++){
      const chunk=chunks[i];
      for(let c=0;c<channels;c++){
        destinations[c].set(chunk[c],offsets[c]);
        offsets[c]+=chunk[c].length;
      }
      chunks[i]=null;
    }
    chunks.length=0;
    return buffer;
  }
  return {
    get frames(){return frames;},
    start(time){
      if(closed)throw Error('Capture déjà terminée.');
      node.port.postMessage({type:'start',time});
    },
    async stop(){
      if(closed)throw Error('Prise déjà terminée.');
      closed=true;
      if(!processorFailure)node.port.postMessage({type:'stop'});
      try{
        if(!processorFailure){
          let timeout;
          try{
            await Promise.race([completion,new Promise((_,reject)=>{
              timeout=setTimeout(()=>reject(Error('La capture audio ne répond plus.')),3000);
            })]);
          }catch(error){
            if(!frames)throw error;
            try{onError?.(error);}catch{}
          }finally{clearTimeout(timeout);}
        }
        return retainChunks?assemble():null;
      }finally{cleanup();}
    },
    dispose(){
      if(closed)return;
      closed=true;cleanup();
    }
  };
}

export function recordingPlacement(startBar,duration,bpm,latencyMs=0){const secondsPerBar=240/bpm,corrected=startBar-latencyMs/1000/secondsPerBar,sourceOffset=Math.max(0,-corrected*secondsPerBar);return {start:Math.max(0,corrected),sourceOffset,length:Math.max(0,(duration-sourceOffset)/secondsPerBar)};}

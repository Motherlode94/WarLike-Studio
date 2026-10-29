class ChayahPcmRecorder extends AudioWorkletProcessor{
  constructor(options){super();this.mode=options.processorOptions?.channel||'1';this.channels=this.mode==='stereo'?2:1;this.block=4096;this.buffers=Array.from({length:this.channels},()=>new Float32Array(this.block));this.used=0;this.active=false;this.startFrame=Infinity;this.frames=0;this.port.onmessage=({data})=>{if(data.type==='start'){this.startFrame=Math.round(data.time*sampleRate);this.active=true;}if(data.type==='stop'){this.active=false;this.flush();this.port.postMessage({type:'done',frames:this.frames});}};}
  flush(){if(!this.used)return;const channels=this.buffers.map(a=>a.slice(0,this.used));this.port.postMessage({type:'chunk',channels},channels.map(a=>a.buffer));this.used=0;}
  process(inputs,outputs){for(const output of outputs)for(const channel of output)channel.fill(0);const input=inputs[0]||[];if(!this.active||!input.length)return true;
    for(let i=0;i<input[0].length;i++){if(currentFrame+i<this.startFrame)continue;for(let c=0;c<this.channels;c++){const source=this.mode==='stereo'?c:this.mode==='2'?1:0;this.buffers[c][this.used]=input[source]?.[i]||0;}this.used++;this.frames++;if(this.used===this.block)this.flush();}return true;
  }
}
registerProcessor('chayah-pcm-recorder',ChayahPcmRecorder);

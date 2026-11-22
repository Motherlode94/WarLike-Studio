// Deterministic PCM buffers are immutable after creation. Context-local LRU
// bounds retained references, not buffers held by currently playing sources.
export function createInstrumentBufferCache({maxEntries=32,maxBytes=16*1024*1024}={}){
 const contexts=new WeakMap();
 function state(ctx){let s=contexts.get(ctx);if(!s){s={entries:new Map(),bytes:0,hits:0,misses:0,evictions:0};contexts.set(ctx,s);}return s;}
 return {
  get(ctx,key,generate){
   const s=state(ctx);
   if(s.entries.has(key)){const e=s.entries.get(key);s.entries.delete(key);s.entries.set(key,e);s.hits++;return e.buffer;}
   s.misses++;const data=generate();if(!(data instanceof Float32Array)||!data.length)throw Error('Invalid instrument PCM');
   const buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);
   const bytes=data.byteLength;
   if(bytes<=maxBytes&&maxEntries>0){while(s.entries.size&&(s.entries.size>=maxEntries||s.bytes+bytes>maxBytes)){const oldest=s.entries.keys().next().value;s.bytes-=s.entries.get(oldest).bytes;s.entries.delete(oldest);s.evictions++;}
    s.entries.set(key,{buffer,bytes});s.bytes+=bytes;}
   return buffer;
  },
  stats(ctx){const s=state(ctx);return {entries:s.entries.size,bytes:s.bytes,hits:s.hits,misses:s.misses,evictions:s.evictions};}
 };
}

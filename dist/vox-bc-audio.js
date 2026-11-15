// VOX LAB PRO — native Web Audio DSP; no placeholder signal paths.
// Every returned node is owned by the caller's scope and disposed with the rack.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:lo));
const db=(x)=>10**(x/20);
export function createVoxBC(ctx,scope,id){
 if(!['voxaireq','voxambience'].includes(id))return null;
 const node=(name,...args)=>scope.node(name,...args);
 const input=node('createGain'),output=node('createGain'),dry=node('createGain'),wet=node('createGain');
 input.connect(dry);dry.connect(output);wet.connect(output);
 const m={input,output,dry,wet,latencySamples:0};
 if(id==='voxaireq'){
  m.highpass=node('createBiquadFilter');m.highpass.type='highpass';m.highpass.Q.value=Math.SQRT1_2;
  m.presence=node('createBiquadFilter');m.presence.type='peaking';m.presence.Q.value=.75;
  m.air=node('createBiquadFilter');m.air.type='highshelf';
  m.outputGain=node('createGain');
  input.connect(m.highpass);m.highpass.connect(m.presence);m.presence.connect(m.air);
  m.air.connect(m.outputGain);m.outputGain.connect(wet);
 }else{
  m.delay=node('createDelay',.5);
  m.highpass=node('createBiquadFilter');m.highpass.type='highpass';m.highpass.Q.value=.7;
  m.lowpass=node('createBiquadFilter');m.lowpass.type='lowpass';m.lowpass.Q.value=.7;
  m.feedback=node('createGain');m.slapGain=node('createGain');
  input.connect(m.delay);m.delay.connect(m.highpass);m.highpass.connect(m.lowpass);
  m.lowpass.connect(m.slapGain);m.slapGain.connect(wet);
  m.lowpass.connect(m.feedback);m.feedback.connect(m.delay);
  m.convolver=node('createConvolver');m.convolver.normalize=false;
  // Short deterministic stereo room: generated once at construction, not in render callback.
  const samples=Math.max(1,Math.round(ctx.sampleRate*.115));
  const impulse=ctx.createBuffer(2,samples,ctx.sampleRate);
  for(let ch=0;ch<2;ch++){
   const a=impulse.getChannelData(ch);let seed=(0x9e3779b9+ch*65537)>>>0;
   for(let i=0;i<samples;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const t=i/samples;
    a[i]=((seed/4294967296)*2-1)*Math.pow(1-t,3)*.25;
   }
  }
  m.convolver.buffer=impulse;
  m.roomGain=node('createGain');input.connect(m.convolver);m.convolver.connect(m.roomGain);m.roomGain.connect(wet);
 }
 return m;
}
export function syncVoxBC(ctx,id,m,s,now,initial){
 if(!m)return;
 const set=(param,value)=>{
  if(initial)param.setValueAtTime(value,now);
  else param.setTargetAtTime(value,now,.02);
 };
 const on=s.enabled!==false,nyquist=ctx.sampleRate*.45;
 if(id==='voxaireq'){
  set(m.highpass.frequency,clamp(s.highpass,30,Math.min(350,nyquist)));
  set(m.presence.frequency,clamp(s.presenceFreq,100,nyquist));
  set(m.presence.gain,clamp(s.presence,-9,9));
  set(m.air.frequency,clamp(s.airFreq,100,nyquist));
  set(m.air.gain,clamp(s.air,-9,9));
  set(m.outputGain.gain,db(clamp(s.output,-12,12)));
  set(m.dry.gain,on?1-clamp(s.mix,0,1):1);
  set(m.wet.gain,on?clamp(s.mix,0,1):0);
 }else if(id==='voxambience'){
  set(m.delay.delayTime,clamp(s.slap,70,130)/1000);
  set(m.highpass.frequency,Math.min(350,nyquist));
  set(m.lowpass.frequency,clamp(s.tone,400,nyquist));
  set(m.feedback.gain,on?clamp(s.feedback,0,.45):0);
  set(m.slapGain.gain,clamp(s.slapLevel,0,1));
  set(m.roomGain.gain,clamp(s.room,0,1));
  // This is a parallel ambient send: unprocessed centre is always preserved.
  set(m.dry.gain,1);set(m.wet.gain,on?clamp(s.mix,0,.7):0);
 }
}

import {gateControl,deessControl,gain,relayTimes} from './packs.js?v=0.11.1';
const curve=fn=>Float32Array.from({length:4097},(_,i)=>fn(i/2048-1));
const rectifierCurve=curve(Math.abs);
function makeScope(ctx){const nodes=[],oscillators=[];return {nodes,oscillators,node(kind,...args){const n=ctx[kind](...args);nodes.push(n);return n;},dispose(){for(const n of oscillators)try{n.stop();}catch{}for(const n of nodes)try{n.disconnect();}catch{}}};}
function module(ctx,scope){return {input:scope.node('createGain'),output:scope.node('createGain')};}
function envelope(ctx,scope,input){const rectifier=scope.node('createWaveShaper'),smooth=scope.node('createBiquadFilter'),scale=scope.node('createGain'),control=scope.node('createWaveShaper');rectifier.curve=rectifierCurve;smooth.type='lowpass';smooth.Q.value=.5;smooth.frequency.value=25;input.connect(rectifier);rectifier.connect(smooth);smooth.connect(scale);scale.connect(control);return {smooth,scale,control};}
function blend(scope,input,wetSource,output){const dry=scope.node('createGain'),wet=scope.node('createGain');input.connect(dry);wetSource.connect(wet);dry.connect(output);wet.connect(output);return {dry,wet};}
export function createPackProcessors(ctx,cleanInput,creativeInput,{detached=false}={}){
  const scope=makeScope(ctx),modules={};let last=cleanInput;
  for(const id of ['hush','sibil']){const m=modules[id]=module(ctx,scope);if(!detached)last.connect(m.input);last=m.output;
    if(id==='hush'){m.envelope=envelope(ctx,scope,m.input);m.controlled=scope.node('createGain');m.controlled.gain.value=0;m.input.connect(m.controlled);m.envelope.control.connect(m.controlled.gain);m.controlled.connect(m.output);}
    else{m.band=scope.node('createBiquadFilter');m.band.type='bandpass';m.band.Q.value=.7;m.band.frequency.value=6500;m.input.connect(m.band);m.envelope=envelope(ctx,scope,m.band);m.correction=scope.node('createGain');m.correction.gain.value=0;m.band.connect(m.correction);m.envelope.control.connect(m.correction.gain);m.input.connect(m.output);m.correction.connect(m.output);}
    m.monitor=scope.node('createAnalyser');m.monitor.fftSize=32;m.envelope.control.connect(m.monitor);
  }
  const cleanOutput=last;last=creativeInput;
  for(const id of ['ember','orbit','sway','relay']){const m=modules[id]=module(ctx,scope);if(!detached)last.connect(m.input);last=m.output;
    if(id==='ember'){m.shaper=scope.node('createWaveShaper');m.shaper.oversample='2x';m.dc=scope.node('createBiquadFilter');m.dc.type='highpass';m.dc.frequency.value=20;m.dc.Q.value=.5;m.tone=scope.node('createBiquadFilter');m.tone.type='lowpass';m.tone.Q.value=.5;m.input.connect(m.shaper);m.shaper.connect(m.dc);m.dc.connect(m.tone);m.blend=blend(scope,m.input,m.tone,m.output);}
    if(id==='orbit'){m.left=scope.node('createDelay');m.right=scope.node('createDelay');m.panL=scope.node('createStereoPanner');m.panR=scope.node('createStereoPanner');m.sum=scope.node('createGain');m.sum.gain.value=.5;m.lfo=scope.node('createOscillator');m.depthL=scope.node('createGain');m.depthR=scope.node('createGain');m.input.connect(m.left);m.input.connect(m.right);m.left.connect(m.panL);m.right.connect(m.panR);m.panL.connect(m.sum);m.panR.connect(m.sum);m.lfo.connect(m.depthL);m.lfo.connect(m.depthR);m.depthL.connect(m.left.delayTime);m.depthR.connect(m.right.delayTime);m.blend=blend(scope,m.input,m.sum,m.output);scope.oscillators.push(m.lfo);m.lfo.start(0);}
    if(id==='sway'){m.amp=scope.node('createGain');m.pan=scope.node('createStereoPanner');m.lfo=scope.node('createOscillator');m.depth=scope.node('createGain');m.panDepth=scope.node('createGain');m.input.connect(m.amp);m.amp.connect(m.pan);m.lfo.connect(m.depth);m.depth.connect(m.amp.gain);m.lfo.connect(m.panDepth);m.panDepth.connect(m.pan.pan);m.blend=blend(scope,m.input,m.pan,m.output);scope.oscillators.push(m.lfo);m.lfo.start(0);}
    if(id==='relay'){m.left=scope.node('createDelay',6);m.right=scope.node('createDelay',6);m.panL=scope.node('createStereoPanner');m.panR=scope.node('createStereoPanner');m.panL.pan.value=-1;m.panR.pan.value=1;m.feedbackL=scope.node('createGain');m.feedbackR=scope.node('createGain');m.toneL=scope.node('createBiquadFilter');m.toneR=scope.node('createBiquadFilter');m.toneL.type=m.toneR.type='lowpass';m.toneL.Q.value=m.toneR.Q.value=.5;m.sum=scope.node('createGain');m.sum.gain.value=.7;m.input.connect(m.left);m.left.connect(m.panL);m.panL.connect(m.sum);m.left.connect(m.feedbackL);m.feedbackL.connect(m.toneR);m.toneR.connect(m.right);m.right.connect(m.panR);m.panR.connect(m.sum);m.right.connect(m.feedbackR);m.feedbackR.connect(m.toneL);m.toneL.connect(m.left);m.blend=blend(scope,m.input,m.sum,m.output);}
  }
  return {modules,cleanOutput,creativeOutput:last,dispose:()=>scope.dispose()};
}
export function syncPackProcessors(rack,effects,bpm,now=0,initial=false){
  const set=(p,v)=>initial?p.setValueAtTime(v,now):p.setTargetAtTime(v,now,.02);
  for(const [id,m] of Object.entries(rack.modules)){const state=effects[id],on=state.enabled,signature=JSON.stringify(state);if(signature===m.signature&&m.bpm===bpm)continue;m.signature=signature;m.bpm=bpm;
    if(id==='hush'||id==='sibil'){
      const threshold=gain(state.threshold);set(m.envelope.scale.gain,(id==='hush'?.5:1/32)/threshold);
      m.envelope.control.curve=curve(x=>id==='hush'?(on?gateControl(x,state.range):1):(on?deessControl(x,state.range,state.mix):0));
      if(id==='hush')set(m.envelope.smooth.frequency,1/(2*Math.PI*state.response/1000));else set(m.band.frequency,state.frequency);
    }
    if(m.blend){const mix=on?state.mix:0;set(m.blend.dry.gain,1-mix);set(m.blend.wet.gain,mix*(id==='ember'?gain(state.output):1));}
    if(id==='ember'){const k=1+state.drive/24*15,bias=state.character*.35,offset=Math.tanh(bias*k),norm=Math.max(Math.abs(Math.tanh((1+bias)*k)-offset),Math.abs(Math.tanh((-1+bias)*k)-offset));m.shaper.curve=curve(x=>(Math.tanh((x+bias)*k)-offset)/norm);set(m.tone.frequency,state.tone);}
    if(id==='orbit'){set(m.lfo.frequency,on?state.rate:0);set(m.left.delayTime,.016);set(m.right.delayTime,.021);set(m.depthL.gain,state.depth*.007);set(m.depthR.gain,-state.depth*.007);set(m.panL.pan,-state.width);set(m.panR.pan,state.width);}
    if(id==='sway'){set(m.lfo.frequency,on?state.rate:0);set(m.amp.gain,1-state.depth/2);set(m.depth.gain,state.depth/2);set(m.panDepth.gain,state.pan);}
    if(id==='relay'){const times=relayTimes(bpm,state.beats);set(m.left.delayTime,times[0]);set(m.right.delayTime,times[1]);set(m.feedbackL.gain,on?state.feedback:0);set(m.feedbackR.gain,on?state.feedback:0);set(m.toneL.frequency,state.tone);set(m.toneR.frequency,state.tone);}
  }
}

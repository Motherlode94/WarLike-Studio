import {resolvePatternClip,patternPlaybackProject} from './piano-model.js?v=0.11.1';
import {normaliseRouting,audibleIds,compensationDelays,fadeValue} from './studio-model.js?v=0.11.1';
import {bindings,automateParam} from './automation.js?v=0.11.1';
import {encodeWav} from './wav.js?v=0.11.1';
import {createPackProcessors,syncPackProcessors} from './pack-audio.js?v=0.11.1';
import {packTail} from './packs.js?v=0.11.1';
import {ensurePlugins,DRUM_VOICES,EFFECTS,pluginDefaults,effectType} from './plugins.js?v=0.11.1';
import {clampClipGain} from './recording.js?v=0.11.1';
import {createFactorySession,DRUM_GROOVES} from './content.js?v=0.11.1';
import {createMasterChain,syncMasterChain} from './mastering.js?v=0.11.1';
export const uid = () => Math.random().toString(36).slice(2, 11);
export const dbGain = db => Math.pow(10, db / 20);
export const midiHz = n => 440 * Math.pow(2, (n - 69) / 12);
export const noteName = n => ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function defaultProject(){return createFactorySession('nocturne');}
export function emptyProject(){
  const track={id:uid(),name:'AUDIO 1',type:'audio',color:'#ca909a',volume:0,pan:0,mute:false,solo:false,clips:[]};ensurePlugins(track);
  return {version:1,name:'Nouvelle session',bpm:120,bars:16,swing:0,masterVolume:0,recording:{gainDb:0,autoLevel:true},mastering:{inserts:[]},tracks:[track]};
}

export class AudioEngine {
  get masterVolume(){return this.getProject().masterVolume??-2;}
  set masterVolume(value){this.getProject().masterVolume=value;}
  constructor(getProject,getAssets) {
    this.getProject=getProject; this.getAssets=getAssets; this.ctx=null; this.playing=false;
    this.position=0; this.loop=true; this.metronome=false; if(!Number.isFinite(this.getProject().masterVolume))this.masterVolume=-2; this.channels=new Map(); this.voices=new Set();this.audioLevels=new Map(); this.scheduledStep=0;
  }
  async init() {
    if(!this.ctx) {
      this.ctx=new AudioContext({latencyHint:'interactive'});
      this.graph=this.buildGraph(this.ctx);
      this.master=this.graph.master; this.masterAnalyser=this.graph.analyser; this.channels=this.graph.channels;
    }
    if(this.ctx.state==='suspended') await this.ctx.resume();
    this.sync(); return this.ctx;
  }
  buildGraph(ctx,{captureId=null,preFader=false}={}) {
    normaliseRouting(this.getProject());
    const master=ctx.createGain(), analyser=ctx.createAnalyser(),mastering=createMasterChain(ctx,master);
    master.gain.value=dbGain(this.masterVolume); analyser.fftSize=256;
    syncMasterChain(mastering,this.getProject().mastering,ctx.currentTime,true);mastering.output.connect(analyser);if(!captureId)analyser.connect(ctx.destination);
    const channels=new Map();
    for(const tr of this.getProject().tracks) channels.set(tr.id,this.makeChannel(ctx,tr,master));
    const graph={master,analyser,channels,mastering,captureId,preFader};this.routeGraph(ctx,graph,true);return graph;
  }
  makeChannel(ctx,tr,master) {
    ensurePlugins(tr);
    const input=ctx.createGain(),filter=ctx.createBiquadFilter(),pan=ctx.createStereoPanner(),gain=ctx.createGain(),analyser=ctx.createAnalyser();
    const delay=ctx.createDelay(2),send=ctx.createGain(),feedback=ctx.createGain();
    const colorDry=ctx.createGain(),colorWet=ctx.createGain(),colorOut=ctx.createGain(),drive=ctx.createWaveShaper(),highpass=ctx.createBiquadFilter(),reverb=ctx.createConvolver(),space=ctx.createGain();
    const eqLow=ctx.createBiquadFilter(),eqMid=ctx.createBiquadFilter(),eqHigh=ctx.createBiquadFilter(),compressor=ctx.createDynamicsCompressor(),compressDry=ctx.createGain(),compressWet=ctx.createGain(),compressDelay=ctx.createDelay(.1),makeup=ctx.createGain();
    eqLow.type='lowshelf';eqLow.frequency.value=120;eqMid.type='peaking';eqMid.frequency.value=1500;eqMid.Q.value=.8;eqHigh.type='highshelf';eqHigh.frequency.value=8000;compressor.knee.value=6;
    drive.oversample='2x';highpass.type='highpass';highpass.Q.value=.5;
    reverb.buffer=this.impulse(ctx);
    filter.type='lowpass'; filter.frequency.value=tr.tone??18000; filter.Q.value=.5;
    const compInput=ctx.createGain(),echoInput=ctx.createGain(),echoOutput=ctx.createGain(),auraInput=ctx.createGain(),auraOutput=ctx.createGain();
    const pack=createPackProcessors(ctx,input,makeup,{detached:true});
    const colorInput=ctx.createGain();colorInput.connect(drive);drive.connect(colorWet);colorWet.connect(colorOut);colorInput.connect(colorDry);colorDry.connect(colorOut);
    highpass.connect(filter);eqLow.connect(eqMid);eqMid.connect(eqHigh);
    compInput.connect(compressor);compressor.connect(compressWet);compressWet.connect(makeup);compInput.connect(compressDelay);compressDelay.delayTime.value=.006;compressDelay.connect(compressDry);compressDry.connect(makeup);
    pan.connect(gain);gain.connect(analyser);
    gain.gain.value=this.audible(tr)?dbGain(tr.volume):0; pan.pan.value=tr.pan;
    echoInput.connect(echoOutput);echoInput.connect(send);send.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(echoOutput);
    auraInput.connect(auraOutput);auraInput.connect(space);space.connect(reverb);reverb.connect(auraOutput);
    delay.delayTime.value=60/this.getProject().bpm*.75; send.gain.value=tr.delay||0; feedback.gain.value=.3; analyser.fftSize=128;
    const ch={input,filter,pan,gain,analyser,send,delay,feedback,drive,highpass,space,eqLow,eqMid,eqHigh,compressor,makeup,colorDry,colorWet,colorOut,compressDry,compressWet,compressDelay,pack,instanceChannels:new Map(),sendNodes:new Map(),routeDelay:ctx.createDelay(1),stages:{...pack.modules,color:{input:colorInput,output:colorOut},sculpt:{input:highpass,output:filter},prism:{input:eqLow,output:eqHigh},glue:{input:compInput,output:makeup},echo:{input:echoInput,output:echoOutput},aura:{input:auraInput,output:auraOutput}}};this.syncEffects(ch,tr,ctx.currentTime,true);return ch;
  }
  impulse(ctx) {
    if(!this.impulses)this.impulses=new WeakMap();
    if(!this.impulses.has(ctx)){const size=Math.floor(ctx.sampleRate*1.8),b=ctx.createBuffer(2,size,ctx.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<size;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/size,3);}this.impulses.set(ctx,b);}
    return this.impulses.get(ctx);
  }
  syncEffects(ch,tr,now,initial=false) {
    ensurePlugins(tr);const e=tr.effects,set=(param,value)=>initial?param.setValueAtTime(value,now):param.setTargetAtTime(value,now,.02);
    set(ch.filter.frequency,e.sculpt.enabled?e.sculpt.cutoff:20000);
    set(ch.highpass.frequency,e.sculpt.enabled?e.sculpt.highpass:20);
    set(ch.send.gain,e.echo.enabled?e.echo.mix:0);
    set(ch.feedback.gain,e.echo.feedback);
    set(ch.space.gain,e.aura.enabled?e.aura.mix:0);
    for(const [node,key] of [[ch.eqLow,'low'],[ch.eqMid,'mid'],[ch.eqHigh,'high']])set(node.gain,e.prism.enabled?e.prism[key]:0);
    set(ch.eqLow.frequency,e.prism.lowFreq);set(ch.eqMid.frequency,e.prism.midFreq);set(ch.eqHigh.frequency,e.prism.highFreq);set(ch.eqMid.Q,e.prism.q);
    set(ch.colorWet.gain,e.color.enabled?e.color.mix:1);set(ch.colorDry.gain,e.color.enabled?1-e.color.mix:0);set(ch.colorOut.gain,dbGain(e.color.enabled?e.color.output:0));
    set(ch.compressWet.gain,e.glue.enabled?e.glue.mix:1);set(ch.compressDry.gain,e.glue.enabled?1-e.glue.mix:0);set(ch.compressor.knee,e.glue.knee);
    set(ch.compressor.threshold,e.glue.enabled?e.glue.threshold:0);set(ch.compressor.ratio,e.glue.enabled?e.glue.ratio:1);set(ch.compressor.attack,e.glue.attack/1000);set(ch.compressor.release,e.glue.release/1000);set(ch.makeup.gain,dbGain(e.glue.enabled?e.glue.makeup:0));
    syncPackProcessors(ch.pack,e,this.getProject().bpm,now,initial);
    for(const id of tr.inserts.filter(id=>id&&id.includes('__'))){const type=effectType(id);let child=ch.instanceChannels.get(id);const sub={...tr,id:tr.id+'_'+id,inserts:[type],effects:{...pluginDefaults(tr.type).effects,[type]:e[id]},sends:[],automation:{mode:'off',curves:{}}};
      if(!child){child=this.makeChannel(ch.input.context,sub,null);child.stages[type].output.disconnect();ch.instanceChannels.set(id,child);ch.stages[id]=child.stages[type];}else this.syncEffects(child,sub,now,initial);
    }
    const order=tr.inserts.filter(id=>id&&e[id].enabled),signature=order.join(',');
    if(ch.routeSignature!==signature){ch.input.disconnect();for(const stage of Object.values(ch.stages))stage.output.disconnect();let last=ch.input;for(const id of order){last.connect(ch.stages[id].input);last=ch.stages[id].output;}last.connect(ch.pan);ch.effectsOutput=last;ch.routeSignature=signature;}
    const drive=e.color.enabled?e.color.drive:0;
    if(ch.driveValue!==drive){ch.driveValue=drive;if(drive<.01)ch.drive.curve=null;else{const curve=new Float32Array(2048),k=1+drive*12,norm=Math.tanh(k);for(let i=0;i<curve.length;i++){const x=i*2/(curve.length-1)-1;curve[i]=Math.tanh(x*k)/norm;}ch.drive.curve=curve;}}
  }
  audible(tr) {return !tr.mute&&audibleIds(this.getProject().tracks).has(tr.id);}
  routeGraph(ctx,graph,initial=false){
    const p=this.getProject(),delays=compensationDelays(p.tracks),signature=JSON.stringify(p.tracks.map(t=>[t.id,t.output,(t.sends||[]).map(s=>[s.id,s.target,s.pre])]).sort((a,b)=>a[0].localeCompare(b[0])));
    for(const tr of p.tracks){const ch=graph.channels.get(tr.id);if(!ch)continue;
      if(graph.routeSignature!==signature){ch.analyser.disconnect();ch.routeDelay.disconnect();for(const n of ch.sendNodes.values()){n.source.disconnect(n.gain);n.gain.disconnect();n.delay.disconnect();}ch.sendNodes.clear();
        const captured=graph.captureId===tr.id,dest=captured?ctx.destination:graph.channels.get(tr.output)?.input||graph.master;if(captured&&graph.preFader)ch.effectsOutput.connect(ctx.destination);else{ch.analyser.connect(ch.routeDelay);ch.routeDelay.connect(dest);}
        for(const send of tr.sends||[]){const target=graph.channels.get(send.target);if(!target)continue;const gain=ctx.createGain(),delay=ctx.createDelay(1),source=send.pre?ch.pan:ch.gain;source.connect(gain);gain.connect(delay);delay.connect(target.input);ch.sendNodes.set(send.id,{gain,delay,source});}
      }
      ch.routeDelay.delayTime.setValueAtTime(p.delayCompensation===false?0:delays.get(tr.id)||0,ctx.currentTime);
      for(const send of tr.sends||[]){const n=ch.sendNodes.get(send.id);if(n){n.delay.delayTime.setValueAtTime(p.delayCompensation===false?0:delays.get(tr.id+':send:'+send.id)||0,ctx.currentTime);n.gain.gain.setValueAtTime(send.enabled&&(!send.pre||this.audible(tr))?dbGain(send.level):0,ctx.currentTime);}}
    }graph.routeSignature=signature;
  }
  clearAutomation(graph,now){for(const ch of graph.channels.values())for(const param of ch.automatedParams||[])param.cancelScheduledValues(now);}
  scheduleAutomation(ctx,graph,startBar,endBar,when){
    for(const tr of this.getProject().tracks){const ch=graph.channels.get(tr.id);if(!ch||!['read','write'].includes(tr.automation?.mode))continue;const defs=bindings(ch,tr,EFFECTS);ch.automatedParams=new Set();
      for(const [key,points] of Object.entries(tr.automation.curves||{})){const def=defs.get(key);if(!def||!points.length||key==='volume'&&!this.audible(tr))continue;for(const target of def.targets){ch.automatedParams.add(target.param);automateParam(target.param,points,{startBar,endBar,when,secondsPerBar:this.stepDuration*16,map:key.startsWith('send:')&&!this.audible(tr)?()=>0:target.map,exponential:target.exponential});}}
    }
  }
  sync() {
    if(!this.ctx)return;
    const now=this.ctx.currentTime;this.clearAutomation(this.graph,now);normaliseRouting(this.getProject());
    const active=new Set(this.getProject().tracks.map(track=>track.id));for(const [id,channel] of this.channels)if(!active.has(id)){channel.pack?.dispose();for(const child of channel.instanceChannels?.values()||[])child.pack.dispose();for(const node of Object.values(channel))if(node&&typeof node.disconnect==='function')node.disconnect();this.channels.delete(id);}
    for(const tr of this.getProject().tracks) {
      if(!this.channels.has(tr.id))this.channels.set(tr.id,this.makeChannel(this.ctx,tr,this.master));
      const ch=this.channels.get(tr.id);
      ch.gain.gain.setTargetAtTime(this.audible(tr)?dbGain(tr.volume):0,now,.015);
      ch.pan.pan.setTargetAtTime(tr.pan,now,.015);this.syncEffects(ch,tr,now);ch.delay.delayTime.setTargetAtTime(60/this.getProject().bpm*.75,now,.02);
    }
    this.routeGraph(this.ctx,this.graph);
    if(this.playing)this.scheduleAutomation(this.ctx,this.graph,this.getPosition()/16,this.getProject().bars,now);
    this.master.gain.setTargetAtTime(dbGain(this.masterVolume),now,.01);
    syncMasterChain(this.graph.mastering,this.getProject().mastering,now);
  }
  getPlaybackProject(){const p=this.getProject();if(this.patternMode)return patternPlaybackProject(p,this.patternMode);if(this.clipPreview){const {trackId,clip}=this.clipPreview;return {...p,bars:(clip.patternSteps||32)/16,tracks:p.tracks.map(t=>({...t,clips:t.id===trackId?[{...clip,start:0,length:(clip.patternSteps||32)/16}]:[]}))};}return p;}
  get stepDuration() {return 60/this.getProject().bpm/4;}
  getPosition() {
    if(!this.playing||!this.ctx)return this.position;
    const raw=(this.ctx.currentTime-this.startTime)/this.stepDuration;
    const total=this.getPlaybackProject().bars*16;
    return this.loop?((raw%total)+total)%total:Math.min(raw,total);
  }
  async play() {
    await this.init(); if(this.playing)return;
    this.startTime=this.ctx.currentTime+.06-this.position*this.stepDuration;
    this.scheduledStep=Math.ceil(this.position); this.playing=true;
    if(!this.patternMode&&!this.clipPreview)this.schedulePartialAudio(this.position);this.scheduleAutomation(this.ctx,this.graph,this.position/16,this.getProject().bars,this.ctx.currentTime+.06);
    this.scheduler(); this.timer=setInterval(()=>this.scheduler(),25);
  }
  pause() {if(this.playing)this.position=this.getPosition();this.playing=false;clearInterval(this.timer);this.killVoices();if(this.ctx)this.clearAutomation(this.graph,this.ctx.currentTime);}
  stop() {this.pause();this.position=0;}
  seek(step) {const was=this.playing;this.pause();this.position=clamp(step,0,this.getPlaybackProject().bars*16-1);if(was)this.play();}
  killVoices() {for(const src of this.voices){try{src.stop()}catch{}}this.voices.clear();this.audioLevels.clear();}
  setClipGain(id,gainDb){for(const node of this.audioLevels.get(id)||[])node.gain.setTargetAtTime(dbGain(clampClipGain(gainDb)),this.ctx.currentTime,.01);}
  remember(src) {this.voices.add(src);src.addEventListener('ended',()=>{this.voices.delete(src);this.previewVoices?.delete(src);});}
  schedulePartialAudio(position) {
    const stepSec=this.stepDuration;
    for(const tr of this.getProject().tracks)for(const clip of tr.clips) {
      if(clip.muted||tr.id===this.recordingTrackId)continue;
      const clipStep=clip.start*16;
      if(clip.audioId&&clipStep>=position&&clipStep<Math.ceil(position)){
        const asset=this.getAssets().get(clip.audioId);if(asset)this.audioVoice(this.ctx,this.channels.get(tr.id).input,asset.buffer,this.startTime+clipStep*stepSec,clip.sourceOffset||0,clip.length*16*stepSec,true,clip.gainDb,clip.id,{...clip,total:clip.length*16*stepSec,elapsed:Math.max(0,(position/16-clip.start)*16*stepSec)});
      }
      if(clip.audioId&&position>clip.start*16&&position<(clip.start+clip.length)*16) {
        const asset=this.getAssets().get(clip.audioId); if(!asset)continue;
        this.audioVoice(this.ctx,this.channels.get(tr.id).input,asset.buffer,this.startTime+position*stepSec,(clip.sourceOffset||0)+(position-clip.start*16)*stepSec,((clip.start+clip.length)*16-position)*stepSec,true,clip.gainDb,clip.id,{...clip,total:clip.length*16*stepSec,elapsed:Math.max(0,(position/16-clip.start)*16*stepSec)});
      }
    }
  }
  scheduler() {
    if(!this.playing)return;
    const p=this.getPlaybackProject(), total=p.bars*16,sd=this.stepDuration;
    while(this.startTime+this.scheduledStep*sd<this.ctx.currentTime+.14) {
      if(!this.loop&&this.scheduledStep>=total){this.pause();this.position=0;this.onEnded?.();return;}
      const local=this.scheduledStep%total, time=this.startTime+this.scheduledStep*sd;
      if(local===0&&this.scheduledStep>0)this.scheduleAutomation(this.ctx,this.graph,0,p.bars,time);
      this.scheduleStep(this.ctx,this.channels,local,time,true);
      if(this.metronome&&local%4===0)this.click(time,local%16===0);
      this.scheduledStep++;
    }
  }
  scheduleStep(ctx,channels,step,time,live=false,minimumTime=-Infinity) {
    const p=this.getPlaybackProject(),sd=60/p.bpm/4;
    for(const tr of p.tracks)for(const originalClip of tr.clips) {
      const clip=resolvePatternClip(p,tr,originalClip);
      if(clip.muted||tr.id===this.recordingTrackId)continue;
      const rel=step-clip.start*16;
      const input=channels.get(tr.id)?.input;if(!input)continue;
      if(clip.audioId){
        const start=clip.start*16;
        if(start>=step&&start<step+1&&time+(start-step)*sd>=minimumTime){const a=this.getAssets().get(clip.audioId);if(a)this.audioVoice(ctx,input,a.buffer,time+(start-step)*sd,clip.sourceOffset||0,clip.length*16*sd,live,clip.gainDb,clip.id,{...clip,total:clip.length*16*sd});}
        continue;
      }
      const phase=clip.patternOffset||0,period=clip.patternSteps||(tr.type==='drums'?16:32);
      if(tr.type==='drums'){
        const relative=rel+phase,event=Math.ceil(relative-1e-8),local=event-phase,eventTime=time+(event-relative)*sd;if(local<0||local>=clip.length*16||event>=relative+1-1e-8||eventTime<minimumTime-1e-8)continue;
        const swing=event%2?p.swing/100*sd*.6:0;for(const [voice,pattern] of Object.entries(clip.pattern||{})){const velocity=pattern[((event%period)+period)%period];if(velocity)this.drum(ctx,input,voice,eventTime+swing,live,tr.instrument,velocity);}
      }else{
        for(const n of clip.notes||[]){if(n.muted||n.velocity===0)continue;const cycle=Math.ceil((rel+phase-n.step-1e-8)/period),local=n.step+cycle*period-phase,absolute=clip.start*16+local,eventTime=time+(absolute-step)*sd;
          if(local<0||local>=clip.length*16||absolute<step-1e-8||absolute>=step+1-1e-8||eventTime<minimumTime-1e-8)continue;
          const swing=Math.floor(n.step)%2?p.swing/100*sd*.6:0;this.synth(ctx,input,tr.type,n.midi,eventTime+swing,Math.min(n.len,clip.length*16-local)*sd,live,tr.instrument,n.velocity??1);
        }
      }
    }
  }
  noise(ctx) {
    if(!this.noiseCache)this.noiseCache=new WeakMap();
    if(!this.noiseCache.has(ctx)){const b=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noiseCache.set(ctx,b);}
    return this.noiseCache.get(ctx);
  }
  drum(ctx,out,voice,t,live=false,params={},velocity=1) {
    if(velocity!==1){const level=ctx.createGain();level.gain.value=Math.max(0,Math.min(1,velocity));level.connect(out);out=level;}
    t=Math.max(t,ctx.currentTime);
    const g=ctx.createGain();g.connect(out);
    if(voice==='kick') {
      const o=ctx.createOscillator();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(43,t+.13);
      const decay=params.decay??.38;g.gain.setValueAtTime(params.punch??.85,t);g.gain.exponentialRampToValueAtTime(.001,t+decay);o.connect(g);o.start(t);o.stop(t+decay+.02);if(live)this.remember(o);
    } else if(voice==='tom'||voice==='rim'){
      const o=ctx.createOscillator();o.type=voice==='rim'?'triangle':'sine';o.frequency.setValueAtTime(voice==='rim'?610:155,t);o.frequency.exponentialRampToValueAtTime(voice==='rim'?450:67,t+.07);g.gain.setValueAtTime(voice==='rim'?.2:.4,t);g.gain.exponentialRampToValueAtTime(.001,t+(voice==='rim'?.055:.3));o.connect(g);o.start(t);o.stop(t+.33);if(live)this.remember(o);
    } else {
      const src=ctx.createBufferSource(),f=ctx.createBiquadFilter();src.buffer=this.noise(ctx);f.type=voice==='perc'?'bandpass':'highpass';f.frequency.value=voice==='clap'?1400:voice==='perc'?950:voice==='shaker'?4200:7500;f.Q.value=voice==='perc'?3:.7;src.connect(f);f.connect(g);
      const duration=voice==='clap'?.19:voice==='open'?.3:voice==='shaker'?.1:voice==='perc'?.14:.055;
      g.gain.setValueAtTime((voice==='clap'?.36:voice==='open'?.18:voice==='shaker'?.13:voice==='perc'?.3:.17)*(voice==='clap'?1:(params.hat??.75)/.75),t);g.gain.exponentialRampToValueAtTime(.001,t+duration);
      src.start(t);src.stop(t+duration+.01);if(live)this.remember(src);
      if(voice==='clap'){const o=ctx.createOscillator(),og=ctx.createGain();o.type='triangle';o.frequency.value=185;og.gain.setValueAtTime(.18,t);og.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(og);og.connect(out);o.start(t);o.stop(t+.11);if(live)this.remember(o);}
    }
  }
  synth(ctx,out,type,midi,t,duration,live=false,params={},velocity=1) {
    if(velocity!==1){const level=ctx.createGain();level.gain.value=Math.max(0,Math.min(1,velocity));level.connect(out);out=level;}
    t=Math.max(t,ctx.currentTime); const hz=midiHz(midi),env=ctx.createGain(),filter=ctx.createBiquadFilter();
    filter.type='lowpass';filter.frequency.value=type==='bass'?650:type==='lead'?(params.cutoff??3200):type==='pluck'?(params.brightness??5000):type==='pad'?2200:3200;env.connect(filter);filter.connect(out);
    const level=type==='bass'?(params.body??.6):type==='lead'?.11:type==='pad'?.075:type==='pluck'?(params.body??.18):.19,attack=type==='bass'?.008:type==='pluck'?.003:(params.attack??(type==='pad'?.45:.018)),release=params.release??(type==='bass'?.16:type==='pad'?1.6:type==='pluck'?.04:.5);
    if(type==='pluck')duration=Math.min(duration,params.decay??.3);
    duration=Math.max(duration,attack+.04);
    env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(level,t+attack);env.gain.exponentialRampToValueAtTime(level*.48,t+Math.max(attack+.02,duration*.65));env.gain.setValueAtTime(level*.48,t+Math.max(attack+.03,duration));env.gain.exponentialRampToValueAtTime(.0001,t+duration+release);
    const o=ctx.createOscillator();o.type=type==='bass'?'sine':['lead','pad'].includes(type)?'sawtooth':'triangle';o.frequency.setValueAtTime(hz,t);o.detune.value=type==='pad'?-(params.width??12):0;if(type==='bass'){o.frequency.setValueAtTime(hz*1.6,t);o.frequency.exponentialRampToValueAtTime(hz,t+.035);}o.connect(env);o.start(t);o.stop(t+duration+release+.02);if(live)this.remember(o);
    if(type!=='bass'||params.harmonics>0){const o2=ctx.createOscillator(),g=ctx.createGain();o2.type=['lead','pad'].includes(type)?'sawtooth':'sine';o2.frequency.value=hz*(['lead','pad'].includes(type)?1:2);o2.detune.value=type==='bass'?0:type==='pad'?(params.width??12):(params.detune??5);g.gain.value=type==='bass'?params.harmonics:['lead','pad'].includes(type)?.55:.22;o2.connect(g);g.connect(env);o2.start(t);o2.stop(t+duration+release+.02);if(live)this.remember(o2);}
  }
  audioVoice(ctx,out,buffer,t,offset,duration,live=false,gainDb=0,clipId=null,envelope={}) {
    if(offset>=buffer.duration||duration<=0)return;
    const src=ctx.createBufferSource(),g=ctx.createGain(),level=ctx.createGain();src.buffer=buffer;src.connect(g);g.connect(level);level.connect(out);
    level.gain.value=dbGain(clampClipGain(gainDb));duration=Math.min(duration,buffer.duration-offset);
    const elapsed=envelope.elapsed||0,total=envelope.total??duration,points=new Set([0,duration,Math.max(0,(envelope.fadeIn??.005)-elapsed),Math.max(0,total-(envelope.fadeOut??.005)-elapsed)]);
    if(envelope.fadeCurve==='equalPower')for(let i=1;i<64;i++){const a=(envelope.fadeIn??.005)*i/64-elapsed,b=total-(envelope.fadeOut??.005)*i/64-elapsed;if(a>0&&a<duration)points.add(a);if(b>0&&b<duration)points.add(b);}
    const times=[...points].filter(x=>x>=0&&x<=duration).sort((a,b)=>a-b);times.forEach((delta,i)=>g.gain[i?'linearRampToValueAtTime':'setValueAtTime'](fadeValue(envelope,elapsed+delta,total),t+delta));
    if(live&&clipId){if(!this.audioLevels.has(clipId))this.audioLevels.set(clipId,new Set());this.audioLevels.get(clipId).add(level);src.addEventListener('ended',()=>{const nodes=this.audioLevels.get(clipId);nodes?.delete(level);if(nodes?.size===0)this.audioLevels.delete(clipId);});}
    src.start(t,offset,duration);if(live)this.remember(src);
  }
  click(t,accent) {const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=accent?1200:850;g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.001,t+.035);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.04);this.remember(o);}
  async preview(type,note=57,trackId=null) {await this.init();const tr=this.getProject().tracks.find(t=>trackId?t.id===trackId:t.type===type);const out=tr?this.channels.get(tr.id).input:this.master;if(Object.hasOwn(DRUM_VOICES,type))this.drum(this.ctx,this.master,type,this.ctx.currentTime,true);else this.synth(this.ctx,out,type,note,this.ctx.currentTime,.22,true,tr?.instrument);}
  stopPreview(){for(const source of this.previewVoices||[]){try{source.stop();}catch{}}this.previewVoices=new Set();}
  capturePreview(callback){this.stopPreview();const before=new Set(this.voices);callback();this.previewVoices=new Set([...this.voices].filter(source=>!before.has(source)));}
  async previewPreset(type,params){await this.init();this.capturePreview(()=>{const t=this.ctx.currentTime+.03;if(type==='drums'){const pattern=DRUM_GROOVES[0].pattern,sd=60/120/4;for(let i=0;i<16;i++)for(const [voice,steps] of Object.entries(pattern))if(steps[i])this.drum(this.ctx,this.master,voice,t+i*sd,true,params);}else{const notes=type==='bass'?[33]:type==='lead'?[69]:type==='pluck'?[69,72,76]:[57,60,64];notes.forEach((midi,i)=>this.synth(this.ctx,this.master,type,midi,t+(type==='pluck'?i*.15:0),type==='pad'?1.4:.55,true,params));}});}
  async previewGroove(groove){await this.init();this.capturePreview(()=>{const t=this.ctx.currentTime+.03,sd=60/groove.bpm/4;for(let i=0;i<16;i++)for(const [voice,steps] of Object.entries(groove.pattern))if(steps[i])this.drum(this.ctx,this.master,voice,t+i*sd,true);});}
  async renderDrumWav(voice){if(!Object.hasOwn(DRUM_VOICES,voice))throw new Error('Percussion inconnue.');const ctx=new OfflineAudioContext(1,44100,44100);this.drum(ctx,ctx.destination,voice,.01);return bufferToWav(await ctx.startRendering());}
  async renderRange({sampleRate=44100,startBar=0,endBar=this.getProject().bars,tail=true,captureId=null,preFader=false,clean=false}={}){
    const p=structuredClone(this.getProject());if(clean){for(const t of p.tracks)for(const e of Object.values(t.effects||{}))e.enabled=false;p.mastering={bypass:true};}
    const renderer=new AudioEngine(()=>p,this.getAssets),sd=60/p.bpm/4,start=startBar*16,end=endBar*16,duration=(end-start)*sd+(tail?packTail(p):0)+.01;
    if(![44100,48000,96000].includes(sampleRate)||end<=start||duration*sampleRate*2*8>768*1024*1024)throw Error('Rendu trop volumineux : réduis la plage exportée ou la fréquence.');
    const ctx=new OfflineAudioContext(2,Math.ceil(duration*sampleRate),sampleRate),graph=renderer.buildGraph(ctx,{captureId,preFader});
    for(const tr of p.tracks)for(const clip of tr.clips)if(clip.audioId&&!clip.muted&&clip.start*16<start&&(clip.start+clip.length)*16>start){const a=this.getAssets().get(clip.audioId);if(a)renderer.audioVoice(ctx,graph.channels.get(tr.id).input,a.buffer,.01,(clip.sourceOffset||0)+(start-clip.start*16)*sd,Math.min((clip.start+clip.length)*16-start,end-start)*sd,false,clip.gainDb,clip.id,{...clip,total:clip.length*16*sd,elapsed:(start-clip.start*16)*sd});}
    for(let i=Math.floor(start);i<end;i++)renderer.scheduleStep(ctx,graph.channels,i,.01+(i-start)*sd,false,.01);
    renderer.scheduleAutomation(ctx,graph,startBar,endBar,.01);
    try{return await ctx.startRendering();}finally{for(const ch of graph.channels.values()){ch.pack.dispose();for(const child of ch.instanceChannels.values())child.pack.dispose();}}
  }
  async exportWav(options={}){return encodeWav(await this.renderRange(options),options);}

}

export function bufferToWav(buffer,options={}){return encodeWav(buffer,options);}

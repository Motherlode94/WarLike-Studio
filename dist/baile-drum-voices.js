// Original synthesized membrane/percussion kit for the baile demo. No Roland
// ROM samples: low tom, floor tom, open conga and dry slap are separate voices.
export const isRecordedDrumKit=kit=>kit>=1&&kit<=3;
export function playBaileDrum(ctx,out,voice,t,params,velocity,scope,noise,remember){
 const v=Math.max(0,Math.min(1,velocity));if(!v)return;
 t=Math.max(t,ctx.currentTime);const node=scope.node;
 const src=(s,end)=>{scope.watch(s);remember?.(s);s.start(t);s.stop(t+end);};
 const membrane=(hz,level,decay,ratio=1)=>{
  const o=node('createOscillator'),g=node('createGain');o.type='sine';
  o.frequency.setValueAtTime(hz*ratio,t);o.frequency.exponentialRampToValueAtTime(hz,t+.022);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level*v,t+.0015);g.gain.exponentialRampToValueAtTime(.00001,t+decay);
  o.connect(g);g.connect(out);src(o,decay+.015);
 };
 const skin=(level,frequency,duration)=>{
  const s=node('createBufferSource'),f=node('createBiquadFilter'),g=node('createGain');s.buffer=noise();
  f.type='bandpass';f.frequency.value=frequency;f.Q.value=.8;
  g.gain.setValueAtTime(level*v,t);g.gain.exponentialRampToValueAtTime(.00001,t+duration);
  s.connect(f);f.connect(g);g.connect(out);src(s,duration+.01);
 };
 if(voice==='kick'){membrane(48,.8*(params.punch??.85),.19,2.6);skin(.13,900,.012);}
 else if(voice==='tom'){membrane(115,.48,.23,1.2);membrane(182,.13,.1);skin(.08,1200,.014);}
 else if(voice==='rim'){membrane(82,.42,.27,1.15);membrane(133,.1,.1);skin(.07,700,.018);}
 else if(voice==='perc'||voice==='open'){membrane(185,.37,.22,1.07);membrane(309,.14,.1);skin(.14,1900,.025);}
 else if(voice==='clap'){membrane(330,.18,.055,1.13);skin(.65,2350,.065);skin(.12,5200,.018);}
 else{skin((voice==='hat'?.12:.1)*(params.hat??.5)/.5,voice==='hat'?7200:5200,voice==='hat'?.035:.07);}
}

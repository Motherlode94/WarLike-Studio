// Human feel, following established instrument / DAW references:
// - Logic MIDI Transform "Humanize": random offsets on note position, velocity and length.
// - Logic ES2 "Analog": randomly alters the pitch of each note (here pitch and level).
// - Round-robin / per-hit variance on drums, deliberately NOT cyclic (a predictable cycle
//   still sounds like a machine gun).
// All randomness is seeded by musical position, so an export always renders identically.

export function hash01(...parts){
 let h=2166136261>>>0;
 for(const part of parts){const s=String(part);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}h^=0x9e;h=Math.imul(h,16777619);}
 h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;
 return (h>>>0)/4294967296;
}
const bipolar=(...parts)=>hash01(...parts)*2-1;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

// Per-note analog variance. amount 0..1: at 1, up to ±15 cents and ±1.5 dB.
export function noteVariance(amount,seed,position){
 const a=clamp(Number(amount)||0,0,1);if(!a)return {cents:0,gain:1};
 const key=Math.round(position*96);
 // Whole cents keep sample caches (e.g. STRING) bounded.
 return {cents:Math.round(bipolar(seed,key,'pitch')*15*a),gain:10**(bipolar(seed,key,'level')*1.5*a/20)};
}

// Per-hit drum variance. amount 0..1: at 1, up to ±2 dB, ±30 cents and ±8 % decay.
export function hitVariance(amount,seed,voice,position){
 const a=clamp(Number(amount)||0,0,1);if(!a)return {gain:1,pitch:1,decay:1};
 const key=Math.round(position*96);
 return {gain:10**(bipolar(seed,voice,key,'g')*2*a/20),pitch:2**(bipolar(seed,voice,key,'p')*30*a/1200),decay:1+bipolar(seed,voice,key,'d')*.08*a};
}

// Logic-style Humanize: amounts in MIDI ticks at 960 PPQ (one 16th step = 240 ticks)
// and velocity units out of 127. Logic's preset moves positions by up to 10 ticks.
export const HUMANIZE_PRESETS=Object.freeze({
 subtle:{label:'Léger',position:10,velocity:8,length:10},
 natural:{label:'Naturel',position:20,velocity:14,length:20},
 loose:{label:'Relâché',position:36,velocity:22,length:36}
});
export function humanizeNotes(notes,{position=10,velocity=10,length=10}={},seed='h',steps=Infinity){
 return (notes||[]).map((n,i)=>{
  const k=[seed,n.id||i,n.step,n.midi];
  const step=clamp(n.step+bipolar(...k,'pos')*position/240,0,Math.max(0,steps-1/96));
  const len=clamp(n.len+bipolar(...k,'len')*length/240,1/96,Math.max(1/96,steps-step));
  const vel=clamp((n.velocity??1)+bipolar(...k,'vel')*velocity/127,.05,1);
  return {...n,step:Math.round(step*96)/96,len:Math.round(len*96)/96,velocity:Math.round(vel*1000)/1000};
 });
}
// Drum patterns live on a 16th grid: humanize their velocities only.
export function humanizePattern(pattern,{velocity=10}={},seed='p'){
 return Object.fromEntries(Object.entries(pattern||{}).map(([voice,steps])=>[voice,(steps||[]).map((v,i)=>v?Math.round(clamp(v+bipolar(seed,voice,i)*velocity/127,.05,1)*1000)/1000:v)]));
}

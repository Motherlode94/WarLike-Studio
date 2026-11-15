// NZAMBE MIDI SHREDDER — original, deterministic MIDI note processor.
// Notes: {pitch: 0..127, start: beats, duration: beats, velocity: 1..127}.
// Pure data transform; never modifies source notes.
export const NZAMBE_PRESETS = Object.freeze({
  trap: { slices: 4, density: .7, gate: .65, octave: 0, swing: .12 },
  afro: { slices: 3, density: .85, gate: .8, octave: 0, swing: .18 },
  rnb: { slices: 2, density: .9, gate: .92, octave: 0, swing: .06 },
  cinematic: { slices: 8, density: .8, gate: .9, octave: 1, swing: 0 }
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function rng(seed){let s=(Number(seed)>>>0)||1;return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
export function shredMidi(notes, options={}){
  if(!Array.isArray(notes))throw new TypeError('notes must be an array');
  const cfg={...NZAMBE_PRESETS.trap,...options};
  const slices=clamp(Math.round(Number(cfg.slices)||1),1,32);
  const density=clamp(Number(cfg.density),0,1),gate=clamp(Number(cfg.gate),.05,1);
  const swing=clamp(Number(cfg.swing)||0,0,.45),octave=clamp(Math.round(Number(cfg.octave)||0),-3,3);
  const random=rng(cfg.seed??42),output=[];
  for(const note of notes){
    const {pitch,start,duration,velocity}=note??{};
    if(![pitch,start,duration,velocity].every(Number.isFinite)||pitch<0||pitch>127||start<0||duration<=0||velocity<1||velocity>127)throw new RangeError('Invalid MIDI note');
    const step=duration/slices;
    for(let i=0;i<slices;i++){
      if(random()>density)continue;
      const shifted=clamp(Math.round(pitch)+octave*12,0,127);
      const offset=(i%2?swing*step:0);
      const at=start+i*step+offset;
      const length=Math.max(.001,Math.min(step*gate,duration-(at-start)));
      if(length<=0)continue;
      output.push({pitch:shifted,start:at,duration:length,velocity:clamp(Math.round(velocity*(.85+.3*random())),1,127)});
    }
  }
  return output.sort((a,b)=>a.start-b.start||a.pitch-b.pitch);
}

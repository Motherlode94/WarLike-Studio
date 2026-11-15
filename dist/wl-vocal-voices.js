// WarLike original demonstrator: synthesised vowel voices, NOT a recording of a
// human singer. A dedicated voice engine makes melodies audible until human takes
// can be added to the separately retained LEAD VOX / BACKS / ADLIBS audio tracks.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const presets={
 hum:[[350,900,2300],[440,1050,2250]],
 ah:[[820,1220,2700],[720,1300,2500]],
 oh:[[450,840,2460],[500,980,2500]],
 eh:[[580,1700,2500],[530,1810,2600]],
 oo:[[300,880,2200],[345,920,2100]]
};
export const WL_VOCAL_CONTROLS=[
 {key:'vowel',name:'Voyelle (0 Hum / 1 Ah / 2 Oh / 3 Eh / 4 Ou)',min:0,max:4,step:1,default:1,unit:'mode'},
 {key:'breath',name:'Air',min:0,max:1,step:.01,default:.18,unit:'%'},
 {key:'vibrato',name:'Vibrato',min:0,max:1,step:.01,default:.28,unit:'%'},
 {key:'attack',name:'Attaque',min:.01,max:.7,step:.01,default:.085,unit:'s'},
 {key:'release',name:'Relâchement',min:.05,max:1.5,step:.01,default:.3,unit:'s'},
 {key:'tone',name:'Brillance',min:0,max:1,step:.01,default:.5,unit:'%'},
 {key:'output',name:'Sortie',min:-24,max:3,step:.5,default:-15,unit:'dB'}
];
export const WL_VOCAL_INSTRUMENT={name:'WL VOCAL FORMANT',subtitle:'ORIGINAL SYNTHETIC VOICE / VOWELS',color:'#d5a8bd',pack:'wlvox',description:'Voix vocalique de démonstration générée en Web Audio : harmoniques, trois formants, vibrato et enveloppe. Pas un chanteur humain ni un enregistrement.',controls:WL_VOCAL_CONTROLS};
export function playWLVocal(ctx,out,midi,t,duration,p={},velocity=1,scope,remember){
 const node=(name)=>scope.node(name);
 const v=clamp(velocity,0,1);
 if(v<=0)return false;
 t=Math.max(ctx.currentTime,t);duration=clamp(duration,.055,20);
 const freq=440*2**((clamp(midi,32,92)-69)/12);
 const vowel=['hum','ah','oh','eh','oo'][Math.round(clamp(p.vowel??1,0,4))];
 const forms=presets[vowel][midi<60?0:1], attack=clamp(p.attack??.085,.01,.7);
 const release=clamp(p.release??.3,.05,1.5);
 const end=t+duration+release+.04;
 const carrier=node('createOscillator'),mod=node('createOscillator'),depth=node('createGain');
 carrier.type='sawtooth';carrier.frequency.setValueAtTime(freq,t);
 mod.frequency.setValueAtTime(5.2,t);depth.gain.value=clamp(p.vibrato??.28,0,1)*freq*.006;
 mod.connect(depth);depth.connect(carrier.frequency);
 const tone=node('createBiquadFilter');tone.type='lowpass';
 tone.frequency.value=Math.min(ctx.sampleRate*.45,2500+clamp(p.tone??.5,0,1)*7000);
 carrier.connect(tone);
 const sum=node('createGain');sum.gain.value=1;
 for(let i=0;i<3;i++){
  const band=node('createBiquadFilter'),mix=node('createGain');
  band.type='bandpass';band.frequency.setValueAtTime(Math.min(ctx.sampleRate*.45,forms[i]),t);
  band.Q.value=i===0?2.6:4.7;
  mix.gain.value=[.62,.42,.22][i];
  tone.connect(band);band.connect(mix);mix.connect(sum);
 }
 const gain=node('createGain');gain.gain.setValueAtTime(.0001,t);
 gain.gain.linearRampToValueAtTime(Math.max(.0001,.34*v*(10**((p.output??-15)/20))),t+Math.min(duration*.4,attack));
 gain.gain.setValueAtTime(Math.max(.0001,.3*v*(10**((p.output??-15)/20))),t+duration);
 gain.gain.exponentialRampToValueAtTime(.0001,t+duration+release);
 sum.connect(gain);gain.connect(out);
 scope.watch(carrier);remember?.(carrier);
 carrier.start(t);carrier.stop(end);
 scope.watch(mod);remember?.(mod);mod.start(t);mod.stop(end);
 return true;
}

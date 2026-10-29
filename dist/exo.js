// Original EXO patches and synthesis controls. No vendor samples or presets.
const c=(key,name,min,max,step,value,unit='%')=>({key,name,min,max,step,default:value,unit});
export const EXO_WAVES=['Sine','Triangle','Saw','Square','Hollow','Pulse','Organ','FM Bell'];
export const EXO_INSTRUMENT={name:'EXO',subtitle:'DUAL LAYER / PRESET SYNTH',color:'#8acdc8',pack:'exo',description:'Deux couches de synthèse, unisson stéréo, FM, enveloppe, modulation et arpégiateur. 32 sons originaux classés pour composer rapidement.',controls:[
 c('blend','A / B',0,1,.01,.45),c('cutoff','Brightness',100,18000,10,5200,'Hz'),c('resonance','Resonance',.2,8,.1,.8,'Q'),c('detune','Unison',0,30,.1,8,'ct'),c('width','Width',0,1,.01,.7),c('fm','Texture',0,1,.01,.25),c('motion','Motion',0,1,.01,.15),c('space','Space',0,1,.01,.15),
 c('waveA','Wave A',0,7,1,2,'wave'),c('waveB','Wave B',0,7,1,0,'wave'),c('transposeA','Transpose A',-24,24,1,0,'st'),c('transposeB','Transpose B',-24,24,1,12,'st'),
 c('attack','Attack',.003,3,.001,.012,'s'),c('decay','Decay',.03,3,.01,.5,'s'),c('sustain','Sustain',0,1,.01,.55),c('release','Release',.03,4,.01,.6,'s'),c('motionRate','Motion rate',.05,8,.05,.4,'Hz'),c('output','Output',-24,0,.5,-9,'dB'),
 c('arpMode','Arp mode',0,4,1,0,'mode'),c('arpRate','Arp step',.5,4,.5,1,'step'),c('arpOctaves','Arp octaves',1,3,1,1,'oct'),c('arpGate','Arp gate',.1,.95,.01,.65)
]};
export const exoSettings=input=>Object.fromEntries(EXO_INSTRUMENT.controls.map(c=>{let v=Number.isFinite(input?.[c.key])?input[c.key]:c.default;v=Math.max(c.min,Math.min(c.max,v));if(c.step===1)v=Math.round(v);return[c.key,v];}));
const p=(name,category,mood,values)=>({name,category,mood,values});
export const EXO_PRESETS=[
 p('Soft Horizon','Keys','Warm',{waveA:1,waveB:0,transposeB:12,blend:.24,cutoff:3400,decay:.8,sustain:.25,release:.7,space:.2}),
 p('Glass District','Keys','Bright',{waveA:7,waveB:0,blend:.28,fm:.35,cutoff:10000,decay:1.4,sustain:.08,release:.8,detune:2}),
 p('Velour EP','Keys','Soul',{waveA:0,waveB:7,blend:.3,fm:.16,cutoff:4200,decay:1.8,sustain:.12,release:.5,space:.12}),
 p('Night Organ','Keys','Vintage',{waveA:6,waveB:1,transposeB:0,blend:.25,cutoff:3200,decay:.25,sustain:.8,release:.15,motion:.12,motionRate:3}),
 p('Ocean Memory','Pads','Dreamy',{waveA:2,waveB:1,transposeB:0,blend:.5,attack:1.1,decay:1.2,sustain:.8,release:2.4,cutoff:2000,detune:18,motion:.6,space:.7,output:-12}),
 p('Polar Lights','Pads','Bright',{waveA:4,waveB:2,transposeB:12,blend:.35,attack:.7,sustain:.75,release:2.8,cutoff:7500,detune:22,space:.65,motion:.4,output:-12}),
 p('Amber Choir','Pads','Warm',{waveA:1,waveB:6,transposeB:0,blend:.4,attack:.9,sustain:.7,release:2.2,cutoff:1700,resonance:2.2,space:.6,motion:.45,output:-11}),
 p('Distant Signal','Pads','Dark',{waveA:5,waveB:7,transposeB:-12,blend:.25,attack:1.8,release:3.4,cutoff:1500,fm:.5,detune:24,motion:.7,motionRate:.1,space:.8,output:-14}),
 p('Neon Wire','Leads','Rage',{waveA:2,waveB:5,transposeB:0,blend:.45,cutoff:6800,resonance:2,detune:24,release:.16,space:.2,output:-12}),
 p('Silver Whistle','Leads','Clean',{waveA:0,waveB:1,transposeB:12,blend:.18,cutoff:5600,attack:.03,sustain:.85,release:.3,detune:3,motion:.1}),
 p('Acid Avenue','Leads','Acid',{waveA:2,waveB:3,transposeB:0,blend:.2,cutoff:1300,resonance:6,motion:.7,motionRate:2,release:.12,space:.08,output:-14}),
 p('Retro Runner','Leads','Vintage',{waveA:3,waveB:2,transposeB:0,blend:.4,cutoff:4200,detune:12,decay:.3,sustain:.65,release:.25,motion:.3,space:.25,output:-11}),
 p('Pearl Drop','Plucks','Bright',{waveA:7,waveB:1,blend:.3,cutoff:9500,fm:.2,decay:.24,sustain:0,release:.14,space:.4,detune:6}),
 p('Copper String','Plucks','Organic',{waveA:4,waveB:1,transposeB:0,blend:.3,cutoff:4800,decay:.4,sustain:.04,release:.18,space:.3,detune:4}),
 p('Afro Prism','Plucks','Afro',{waveA:0,waveB:7,blend:.4,fm:.48,cutoff:8000,decay:.18,sustain:0,release:.1,space:.25,detune:1}),
 p('Pixel Harp','Plucks','Digital',{waveA:5,waveB:7,blend:.45,transposeB:12,fm:.6,cutoff:7000,decay:.32,sustain:0,release:.2,space:.35,output:-12}),
 p('Round Planet','Bass','Sub',{waveA:0,waveB:1,transposeA:-24,transposeB:-12,blend:.15,cutoff:900,detune:0,width:0,motion:0,space:0,release:.16,sustain:.85,output:-5}),
 p('Rubber Step','Bass','Bounce',{waveA:2,waveB:0,transposeA:-24,transposeB:-24,blend:.4,cutoff:750,resonance:2.5,decay:.18,sustain:.25,release:.1,detune:2,width:.1,space:0,motion:.2,output:-8}),
 p('Dark Voltage','Bass','Rage',{waveA:5,waveB:2,transposeA:-24,transposeB:-12,blend:.3,cutoff:1600,resonance:1.2,detune:10,release:.12,width:.25,space:0,output:-12}),
 p('Tape Low','Bass','Vintage',{waveA:1,waveB:6,transposeA:-24,transposeB:-12,blend:.18,cutoff:1300,attack:.01,release:.22,width:.1,motion:.1,space:0,output:-7}),
 p('Crystal Rain','Bells','Dreamy',{waveA:7,waveB:0,transposeB:24,blend:.25,fm:.75,cutoff:13000,decay:2,sustain:0,release:1.2,space:.6,detune:2}),
 p('Moon Chime','Bells','Soft',{waveA:0,waveB:7,transposeB:12,blend:.4,fm:.24,cutoff:8000,decay:2.4,sustain:.02,release:1.6,space:.5,detune:0}),
 p('Frozen Metal','Bells','Digital',{waveA:7,waveB:7,transposeB:7,blend:.35,fm:.9,cutoff:16000,decay:1.3,sustain:0,release:1.4,space:.6,detune:5,output:-12}),
 p('Toy Lantern','Bells','Playful',{waveA:1,waveB:7,transposeB:12,blend:.25,fm:.12,cutoff:7000,decay:.7,sustain:0,release:.35,space:.25,detune:1}),
 p('Midnight Steps','Arps','Trap',{waveA:4,waveB:7,blend:.3,cutoff:6000,decay:.2,sustain:.1,release:.18,arpMode:1,arpRate:1,arpOctaves:2,space:.35}),
 p('Skyline Sequence','Arps','Dance',{waveA:2,waveB:5,blend:.4,cutoff:4800,resonance:1.5,detune:16,decay:.2,sustain:.2,release:.15,arpMode:3,arpRate:.5,arpOctaves:2,space:.3,output:-13}),
 p('Descending Stars','Arps','Dreamy',{waveA:7,waveB:0,blend:.25,fm:.25,cutoff:10000,decay:.5,sustain:0,release:.4,arpMode:2,arpRate:2,arpOctaves:3,space:.5}),
 p('Chord Engine','Arps','Pulse',{waveA:2,waveB:1,transposeB:0,blend:.5,cutoff:2800,detune:12,decay:.16,sustain:.1,release:.08,arpMode:4,arpRate:1,arpGate:.4,space:.18,output:-14}),
 p('Deep Cinema','Textures','Cinematic',{waveA:4,waveB:2,transposeA:-12,transposeB:0,blend:.3,attack:2,decay:2,sustain:.8,release:4,cutoff:1100,motion:.8,motionRate:.1,space:.9,detune:28,output:-14}),
 p('Solar Dust','Textures','Ambient',{waveA:7,waveB:5,transposeB:19,blend:.15,fm:.65,attack:1.6,sustain:.65,release:3,cutoff:4700,motion:.7,motionRate:.15,space:.8,output:-15}),
 p('Rising Alloy','Textures','Tense',{waveA:5,waveB:7,transposeB:7,blend:.4,attack:.8,decay:1.5,sustain:.7,release:2,cutoff:3300,resonance:3,fm:.8,motion:.8,motionRate:.7,space:.65,output:-15}),
 p('Quiet Satellite','Textures','Soft',{waveA:0,waveB:1,transposeB:19,blend:.25,attack:1.5,decay:2,sustain:.5,release:3.2,cutoff:2400,detune:14,motion:.45,motionRate:.2,space:.75,output:-11})
];
// Transform held notes into a chord-aware, deterministic musical pattern.
export function exoArpeggiate(notes,steps,params){const p=exoSettings(params);if(!p.arpMode)return notes;const events=[],rate=p.arpRate,mode=p.arpMode;let index=0,lastChord='';
 for(let step=0;step<steps-1e-8;step+=rate){const held=notes.filter(n=>!n.muted&&n.velocity!==0&&n.step<=step+1e-8&&n.step+n.len>step+1e-8).sort((a,b)=>a.midi-b.midi);if(!held.length){index=0;lastChord='';continue;}const chord=held.map(n=>n.midi).join(',');if(chord!==lastChord)index=0;lastChord=chord;const expanded=[];for(let oct=0;oct<p.arpOctaves;oct++)for(const n of held)if(n.midi+oct*12<=108)expanded.push({...n,midi:n.midi+oct*12});const unique=[...new Map(expanded.map(n=>[n.midi,n])).values()].sort((a,b)=>a.midi-b.midi);let selected;if(mode===4)selected=unique;else{let at=mode===2?unique.length-1-index%unique.length:mode===3?((index%Math.max(1,unique.length*2-2))<unique.length?(index%Math.max(1,unique.length*2-2)):unique.length*2-2-(index%Math.max(1,unique.length*2-2))):index%unique.length;selected=[unique[at]];}for(const n of selected)if(n)events.push({midi:n.midi,step,len:Math.max(.01,Math.min(rate*p.arpGate,steps-step,n.step+n.len-step)),velocity:n.velocity??1});index++;}return events;
}

export function exoChannelMap(track,sourceChannels=1){let channels=sourceChannels;const map={};for(const id of track.inserts||[]){if(!id||!track.effects?.[id]?.enabled)continue;map[id]=channels;if(['glue','aura','orbit','relay','exospace'].includes(id.split('__')[0]))channels=2;}return map;}

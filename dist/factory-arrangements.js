// Three original arrangements. Each score owns its harmony, rhythm and orchestration.
const uid=()=>Math.random().toString(36).slice(2,11);
export const FACTORY_STYLES={
 nocturne:{key:6,scale:'minor',keyName:'Fa♯ mineur',harmony:'F♯m(add9) · Dmaj7 · Amaj7 · E(add9)',palette:'808, cloches EXO, piano feutré et nappe sombre',
  tracks:[['drums','TRAP · HALF-TIME',0,-7,{}],['bass','808 · FONDATION',1,-12,{release:.14}],['exo','EXO · NIGHT BELLS',21,-7,{space:.1,output:-5,release:.65,motion:0}],['piano','GRAND · ACCORDS SOMBRES',1,-15,{release:.55}],['pad','HALO · OMBRES',0,-24,{attack:.7,release:1.2}],['pluck','STRING · RÉPONSE',0,-22,{decay:.16,brightness:3400}]],
  chords:[[54,57,61,68],[50,54,57,61],[57,61,64,68],[52,56,59,66]],roots:[30,26,33,28]},
 soleil:{key:2,scale:'major',keyName:'Ré majeur',harmony:'D · A/C♯ · Bm7 · Gmaj7',palette:'Strumstick, marimba, kalimba, flûte et basse synthétique courte',
  tracks:[['drums','AFRO · PERCUSSIONS',3,-8,{decay:.16,hat:.56}],['exo','EXO · BASSE SYNCOPÉE',16,-5,{transposeA:0,transposeB:0,waveA:0,waveB:1,blend:.12,attack:.008,decay:.24,sustain:.48,release:.07,cutoff:1100,output:0}],['strum','STRUM · CONTRETEMPS',0,-14,{release:.12,brightness:9000}],['marimba','MARIMBA · MOTIF',0,-13,{release:.18}],['kalimba','KALIMBA · RÉPONSE',2,-18,{release:.24}],['flute','FLÛTE · REFRAIN',0,-18,{release:.13}]],
  chords:[[62,66,69],[61,64,69],[59,62,66,69],[59,62,66,67]],roots:[38,33,35,31]},
 brume:{key:0,scale:'minor',keyName:'Do mineur',harmony:'Fm9 · B♭13 · E♭maj9 · Cm9',palette:'Clavier FM enregistré, piano, vibraphone et basse ronde',
  tracks:[['drums','R&B · POCKET',1,-9,{decay:.18,hat:.38}],['exo','EXO · SOUL BASS',16,-7,{transposeA:0,transposeB:0,blend:.08,attack:.014,decay:.5,sustain:.65,release:.13,output:0}],['epiano','FM KEYS · NEO SOUL',1,-13,{brightness:6200,release:.55}],['piano','GRAND · FILIGRANE',1,-19,{release:.65}],['pad','HALO · AIR',1,-28,{attack:.9,release:1.5}],['vibes','VIBES · RÉPONSE',0,-21,{release:.8}]],
  chords:[[53,56,60,63,67],[53,56,58,62,67],[51,55,58,62,65],[48,55,58,62,63]],roots:[29,34,27,24]}
};
const n=(step,midi,len=1,velocity=.75)=>({id:uid(),step,midi,len,velocity});
function drumScore(style,section){
 const rows=Object.fromEntries(['kick','clap','hat','open','rim','tom','shaker','perc'].map(v=>[v,Array(64).fill(0)]));
 const hit=(voice,step,velocity=1)=>{if(step>=0&&step<64)rows[voice][step]=velocity;};
 for(let bar=0;bar<4;bar++){
  const b=bar*16,intro=section===0,hook=section===3;
  if(style==='nocturne'){
   for(const s of (intro?[0]:bar%2?[0,5,10,14]:[0,6,11]))hit('kick',b+s,s===0?.95:.76);
   if(!intro||bar>=2)hit('clap',b+8,.86);
   for(const s of (intro?[2,10]:[0,2,4,6,8,10,12,14]))hit('hat',b+s,s%4===0?.44:.28);
   if(!intro){for(const s of (bar%2?[13,15]:[7]))hit('hat',b+s,.23);hit('open',b+6,.3);}
   if(hook&&bar===3)for(const s of [12,13,14,15])hit('hat',b+s,.3+(s-12)*.08);
   if(!intro&&bar%2)hit('rim',b+15,.27);
  }else if(style==='soleil'){
   for(const s of (intro?[0,10]:bar%2?[0,3,10]:[0,6,10]))hit('kick',b+s,s===0?.84:.64);
   for(const s of [3,7,11,14])hit('rim',b+s,s===7?.56:.38);
   for(let s=0;s<16;s++)hit('shaker',b+s,s%2?.3:.16);
   if(!intro){for(const s of [4,12])hit('clap',b+s,.42);for(const s of [2,6,10,14])hit('hat',b+s,.3);}
   for(const s of [2,5,9,15])hit('perc',b+s,s===9?.5:.32);
   if(hook||bar===3)for(const s of [7,13,15])hit('tom',b+s,.36+(s%3)*.08);
   if(hook)hit('open',b+14,.26);
  }else{
   for(const s of (intro?[0]:bar%2?[0,7,10]:[0,6,11]))hit('kick',b+s,s===0?.7:.47);
   if(!intro||bar>=2)for(const s of [4,12])hit('clap',b+s,.48);
   for(const s of (intro?[2,10]:[0,2,4,6,8,10,12,14]))hit('hat',b+s,s%4===0?.26:.14);
   if(!intro){hit('rim',b+11,.18);if(bar%2)hit('open',b+15,.16);}
   if(hook&&bar===3){hit('tom',b+14,.26);hit('perc',b+15,.2);}
  }
 }
 return rows;
}
function melodicScore(style,role,section){
 const spec=FACTORY_STYLES[style],notes=[],intro=section===0,hook=section===3;
 const add=(step,pitch,len,vel)=>notes.push(n(Math.max(0,step),pitch,Math.min(len,64-step),vel));
 const chord=(step,pitches,len,vel,spread=0)=>pitches.forEach((pitch,i)=>add(step+i*spread,pitch,len-i*spread,vel-i*.022));
 for(let bar=0;bar<4;bar++){
  const b=bar*16,ch=spec.chords[bar],root=spec.roots[bar];
  if(style==='nocturne'){
   if(role===1){if(intro&&bar<2)continue;for(const [s,offset,len,v] of (bar%2?[[0,0,4,.9],[5,0,3,.7],[10,12,1,.7],[12,0,3,.86],[15,7,.6,.63]]:[[0,0,5,.94],[6,0,3,.73],[11,7,2,.8],[14,12,1.5,.73]]))add(b+s,root+offset,len,v);}
   if(role===2){const motif=bar%2?[ch[3]+12,ch[1]+12,ch[0]+12,ch[2]+12]:[ch[2]+24,ch[2]+12,ch[1]+12,ch[0]+12];for(let i=0;i<(intro?2:4);i++)add(b+[0,3,7,12][i],motif[i],hook?2:1.6,.57+i%2*.12);if(hook)add(b+14,root+60,1,.5);}
   if(role===3)chord(b+.08,ch,hook?12:7,intro?.45:.58,.025);
   if(role===4)chord(b,ch.map(p=>p-12),15,.42);
   if(role===5&&!intro&&bar%2)for(const [i,s] of [9,12,15].entries())add(b+s,[ch[2]+12,ch[1]+12,ch[0]+12][i],.8,.45);
  }else if(style==='soleil'){
   if(role===1){for(const [s,offset,len,v] of [[0,0,1.7,.84],[3,0,1,.6],[6,7,1.5,.7],[10,0,2,.83],[14,12,1,.64]])add(b+s,root+offset,len,v);}
   if(role===2)for(const [i,s] of [2,5,8,11,14].entries())chord(b+s,ch.slice(0,3),.85,.57+i%2*.1,.06);
   if(role===3){const pitches=[ch[0]+12,ch[2]+12,ch[1]+12,ch[2]+12,ch[0]+12];for(const [i,s] of [0,3,6,10,14].entries())add(b+s,pitches[(i+bar%2)%5],1,.65-i%2*.12);}
   if(role===4&&!intro)for(const [i,s] of [1,7,12,15].entries())add(b+s,[ch[2]+12,ch[1]+12,ch[0]+12,ch[1]+12][i],.8,.48+i%2*.12);
   if(role===5&&(hook||section===2)){for(const [i,s] of [1,4,7,10].entries())add(b+s,[ch[2]+12,ch[1]+12,ch[0]+12,ch[2]+12][(i+bar)%4],i===3?3:1.6,.63-i*.035);}
  }else{
   if(role===1){for(const [s,pitch,len,v] of [[0,root,4.1,.78],[6.18,root+7,1.8,.57],[10.15,root+12,2.5,.68],[14,root+7,1.3,.51]])add(b+s,pitch,len,v);}
   if(role===2){chord(b+.16,ch,intro?11:5.5,.59,.09);if(!intro)chord(b+9.15,[...ch.slice(1),ch[0]+12],4.8,.47,.075);}
   if(role===3&&(!intro||bar===3)){for(const [i,s] of [5.15,7.1,13.15].entries())add(b+s,[ch[4]+12,ch[3]+12,ch[2]+12][i],1.8,.4+i*.04);}
   if(role===4)chord(b,ch.slice(1,4),15,.33);
   if(role===5&&(hook||section===2))for(const [i,s] of [2.12,6.15,11.12].entries())add(b+s,[ch[4]+12,ch[2]+12,ch[3]+12][i],2,.43-i*.03);
  }
 }
 return notes;
}
export function createFactoryArrangement(template,makeTrack){
 const style=template.id,spec=FACTORY_STYLES[style];if(!spec)throw Error('Arrangement inconnu.');
 const sections=['INTRO','COUPLET A','COUPLET B','REFRAIN'].map((name,i)=>({name,start:i*4,length:4}));
 const tracks=spec.tracks.map(([type,name,preset,volume,params],role)=>{
  const track=makeTrack(type,preset);Object.assign(track,{name,volume,pan:role===4?-.2:role===5?.22:0,instrument:{...track.instrument,...params}});
  // Prepared effects belong to the demonstration only; no blanket five-effect chain.
  const fx=role>=2?(type==='pad'?{aura:{mix:.14}}:role===5?{echo:{mix:.08,feedback:.24}}:{}):{};
  track.inserts=Array(12).fill(null);Object.entries(fx).forEach(([id,settings],i)=>{track.inserts[i]=id;Object.assign(track.effects[id],settings,{enabled:true});});
  for(const [section,part] of sections.entries()){
   if(role===5&&section<2)continue;
   const clip={id:uid(),name:part.name+' / '+name,start:part.start,length:part.length,patternSteps:64};
   if(type==='drums')clip.pattern=drumScore(style,section);else clip.notes=melodicScore(style,role,section);
   if(type==='drums'||clip.notes.length)track.clips.push(clip);
  }
  return track;
 });
 for(const [name,volume,color] of [['LEAD VOX',-3,'#ca909a'],['BACKS',-7,'#8fa7c4'],['ADLIBS',-9,'#b1a584']]){const t=makeTrack('keys');Object.assign(t,{name,type:'audio',color,volume,instrument:{},clips:[]});tracks.push(t);}
 return {version:1,demo:true,demoRevision:2,name:template.name,bpm:template.bpm,bars:16,swing:template.swing,masterVolume:({nocturne:-5,soleil:0,brume:1.5})[style],recording:{gainDb:0,autoLevel:true},pianoKey:spec.key,pianoScale:spec.scale,keyName:spec.keyName,sections,tracks};
}

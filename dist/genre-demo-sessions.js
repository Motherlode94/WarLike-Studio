// Three EXTRA original instrument-only public demo sessions.
// Existing Trap, Afro and R&B demos and demo arrangements are not modified.
import {createContentTrack} from './content.js';
import {placeInsert,ensurePlugins,DRUM_VOICES} from './plugins.js';
import {applyGenreSoundProfile,validateGenreSoundProfile} from './genre-sound-profiles.js';
import {mixDemoVocalTrack,makeDemoMastering} from './genre-vocal-mix-master.js';
const uid=()=>Math.random().toString(36).slice(2,12);
const note=(step,midi,len=2,velocity=.66)=>({id:uid(),step,midi,len,velocity});
const S={
 rock:{
  name:'WARLIKE · Rock électrique',bpm:126,swing:0,keyName:'Mi mineur',pianoKey:4,pianoScale:'minor',masterVolume:-11,
  chords:[[52,55,59,64],[48,52,55,60],[55,59,62,67],[50,54,57,62]],roots:[40,36,43,38],
  palette:[
   ['drums','ROCK · LIVE KIT',-9,[]],
   ['wlcrunch','CRUNCH · RHYTHM',-16,['circuiteq','circuitcolor']],
   ['wlclean','CLEAN · CHORDS',-19,['voxaireq']],
   ['wlsteel','STEEL · ARPEGGIOS',-18,['voxambience']],
   ['wlvirtual','VANGUARD · BASS',-21,['vectorcomp']],
   ['wljazz','JAZZ · LEAD BREAK',-21,['alterecho']],
   ['wlrompler','HUMM · CHOIR PAD',-25,['voxaireq','exospace']]
  ]
 },
 pop:{
  name:'WARLIKE · Pop organique',bpm:112,swing:3,keyName:'Do majeur',pianoKey:0,pianoScale:'major',masterVolume:-11,
  chords:[[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]],roots:[36,33,29,31],
  palette:[
   ['drums','POP · LIVE GROOVE',-14,[]],
   ['piano','GRAND · WARM PIANO',-17,['circuiteq']],
   ['wlclean','CLEAN · MELODIC HOOK',-18,['voxaireq']],
   ['wlmuted','MUTED · RHYTHM CHOPS',-21,['circuiteq']],
   ['wlrompler','ATLAS · SOFT PAD',-27,['exospace']],
   ['wlsteel','STEEL · ACOUSTIC CHORDS',-20,['voxambience']]
  ]
 },
 rumba:{
  name:'WARLIKE · Rumba congolaise chaleureuse',bpm:102,swing:9,keyName:'Sol majeur',pianoKey:7,pianoScale:'major',masterVolume:-12,
  chords:[[55,59,62,67],[50,54,57,62],[52,55,59,64],[48,52,55,60]],roots:[31,26,28,24],
  palette:[
   ['drums','RUMBA · PERCUSSIONS SOUPLES',-16,[]],
   ['wlnylon','NYLON · ACCORDS CHAUDS',-16,['circuiteq']],
   ['wlclean','CLEAN · SEBENE MELODIQUE',-17,['circuiteq']],
   ['wlmuted','MUTED · CONTRETEMPS',-21,['circuiteq']],
   ['wlsteel','STEEL · REPONSE GUITARE',-19,['voxambience']],
   ['wljazz','JAZZ HOLLOW · BASSE RONDE',-19,['vectorcomp']]
  ]
 }
};
export const NEW_GENRE_DEMOS=Object.freeze(Object.fromEntries(Object.entries(S).map(([id,x])=>[id,{name:x.name,bpm:x.bpm,style:id,label:id==='rock'?'Rock':id==='pop'?'Pop':'Rumba'}])));
const drumPatterns={
 rock:{kick:[0,4,8,10,12],clap:[4,12],hat:[0,2,4,6,8,10,12,14],open:[15],tom:[7,14]},
 pop:{kick:[0,6,8,12],clap:[4,12],hat:[0,2,4,6,8,10,12,14],shaker:[3,7,11,15],open:[14]},
 rumba:{kick:[0,8],clap:[12],hat:[2,6,10,14],shaker:[1,4,7,9,12,15],rim:[3,7,11,15],perc:[2,5,9,13]}
};
function drumPart(style,section){
 const rows=Object.fromEntries(Object.keys(DRUM_VOICES).map(v=>[v,Array(64).fill(0)]));
 for(let bar=0;bar<4;bar++){
  for(const [voice,steps] of Object.entries(drumPatterns[style]))for(const step of steps){
   if(section===0&&['open','tom'].includes(voice))continue;
   if(style==='rock'&&section===0&&bar<2&&step%4!==0&&voice==='kick')continue;
   const organic=style==='pop'||style==='rumba';
   const level=organic?(voice==='kick'?.52:voice==='clap'?.38:voice==='hat'?.26:voice==='shaker'?.32:.3):.69;
   const accent=(step===0||step===8?1.08:step%4===2?.82:1)*(bar%2===0?1:.91);
   rows[voice][bar*16+step]=(section===3?1.12:section===0?.72:1)*level*accent;
  }
  if(section===3&&bar===3)for(const x of [12,13,14,15])rows.tom[bar*16+x]=.35+(x-12)*.13;
 }
 return rows;
}
function part(style,role,section){
 const x=S[style],out=[],intro=section===0,hook=section===3;
 const add=(step,pitch,len=2,v=.65)=>out.push(note(step,pitch,len,v));
 for(let bar=0;bar<4;bar++){
  const b=bar*16,c=x.chords[bar],r=x.roots[bar];
  if(style==='rock'){
   if(role===1)for(const step of [0,4,8,12])for(const pitch of [r,r+7,r+12])add(b+step,pitch,3.2,hook?.65:.52);
   if(role===2)for(const [i,step] of [0,8].entries())c.forEach((pitch,j)=>add(b+step+j*.03,pitch,7,.38+i*.1));
   if(role===3)for(const [i,step] of [0,3,6,10,14].entries())add(b+step,c[(i+bar)%4]+12,1.5,.46);
   if(role===4)for(const [i,step] of [0,7,10,14].entries())add(b+step,r-12+(i===1?7:i===3?12:0),i===0?4:1.9,.61);
   if(role===5&&!intro)for(const [i,step] of (section===1?[0,8,12]:[0,4,6,9,12,15]).entries())add(b+step,c[(i+2)%4]+12,Math.min(1.8,16-step),section===1?.42:.57);
   if(role===6){const melody=[c[1]+12,c[2]+12,c[3]+12,c[2]+12],positions=[0,4,8,12],lengths=[3.4,3.4,3.75,3.75];for(let i=0;i<4;i++)add(b+positions[i],melody[i],lengths[i],intro?.29:hook?.5:.37);if(hook)for(const pitch of [c[0],c[2]])add(b,pitch,15,.14);}
  }else if(style==='pop'){
   if(role===1)for(const step of [0,8])c.forEach((pitch,j)=>add(b+step+j*.04,pitch,step===0?7.6:6.6,hook?.52:.42));
   if(role===2)for(const [i,step] of [0,4,7,10,12,14].entries())add(b+step,c[[2,1,3,2,1,0][i]]+(hook?12:0),Math.min(2,16-step),hook?.62:.47);
   if(role===3)for(const [i,step] of [2,6,10,14].entries())add(b+step,c[i%4],1.25,.38);
   if(role===4)c.slice(0,3).forEach((pitch,j)=>add(b+j*.08,pitch,15.2,intro?.16:.26));
   if(role===5)for(const step of [0,8])c.slice(0,3).forEach((pitch,i)=>add(b+step+i*.05,pitch-12,7,hook?.37:.3));
  }else{
   if(role===1)for(const [i,step] of [0,4,8,12].entries())for(const [j,pitch] of c.slice(0,3).entries())add(b+step+j*.06,pitch,3.3,.34+(i===0?.08:0));
   if(role===2)for(const [i,step] of [0,3,6,9,11,14].entries())add(b+step,c[[2,3,1,2,3,1][i]]+12,Math.min(1.8,16-step),hook?.62:.49);
   if(role===3)for(const [i,step] of [2,6,10,14].entries())add(b+step,c[i%4]+12,1.1,.37);
   if(role===4&&!intro)for(const [i,step] of [3,7,11,14].entries())add(b+step,c[(i+1)%4]+12,Math.min(1.7,16-step),.38);
   if(role===5)for(const [i,step] of [0,6,8,12].entries())add(b+step,r-12+(i===1?7:i===3?5:0),Math.min(3.1,16-step),.62);
  }
 }
 return out;
}
export function createGenreDemoSession(style){
 const x=S[style];if(!x)throw Error('Démo musicale inconnue.');
 if(style==='pop'||style==='rumba')validateGenreSoundProfile(style);
 const sections=['INTRO','COUPLET','PONT','REFRAIN'].map((name,i)=>({name,start:i*4,length:4}));
 const tracks=x.palette.map(([type,name,volume,effects],role)=>{
  const t=createContentTrack(type,0);
  t.name=name;t.volume=volume;t.pan=role===3?-.17:role===4?.17:0;
  if(type==='drums')Object.assign(t.instrument,{kit:style==='rock'?1:style==='pop'?2:3,punch:style==='rock'?.72:.55,decay:style==='rock'?.35:.26,hat:style==='rock'?.72:.48});
  if(style==='rock'&&role===6){Object.assign(t.instrument,{layer:.62,wave:0,texture:1,cutoff:2300,attack:.22,release:1.8,space:.55,output:-14});t.pan=0;}
  if(style==='pop'){
   const v=role===2?{brightness:5900,body:.7,attack:.008,release:.24,drive:0,output:-9}:
    role===3?{brightness:4100,body:.7,decay:.55,release:.1,drive:0,output:-11}:
    role===4?{wave:1,texture:0,layer:.22,cutoff:2600,attack:.5,release:2.5,space:.25,output:-15}:
    role===5?{brightness:5600,body:.68,attack:.015,decay:2.1,output:-10}:null;
   if(v)Object.assign(t.instrument,v);
  }
  if(style==='rumba'){
   const v=role===1?{brightness:4300,body:.83,attack:.015,decay:1.8,drive:0,output:-8}:
    role===2?{brightness:4900,body:.67,attack:.008,decay:.85,drive:0,output:-9}:
    role===3?{brightness:3700,body:.75,decay:.43,attack:.009,drive:0,output:-10}:
    role===4?{brightness:4700,body:.76,decay:1.5,output:-9}:
    role===5?{brightness:2200,body:.82,attack:.015,decay:1.2,drive:0,output:-8}:null;
   if(v)Object.assign(t.instrument,v);
  }
  for(const effectId of effects){
   const index=t.inserts.indexOf(null);
   if(index<0)throw Error('Trop d’inserts sur la piste de démo.');
   placeInsert(t,index,effectId);
   // User-editable real DSP; genre sound profile applies below.
  }
  applyGenreSoundProfile(t,style);
  for(let sec=0;sec<4;sec++){
   if(role===5&&sec===0)continue;
   const clip={id:uid(),name:sections[sec].name+' · '+name,start:sec*4,length:4,patternSteps:64};
   if(type==='drums')clip.pattern=drumPart(style,sec);else clip.notes=part(style,role,sec);
   if(type==='drums'||clip.notes.length)t.clips.push(clip);
  }
  return t;
 });
 // Audible ORIGINAL formant-synth vocal demo tracks. Audio input tracks remain
 // independent below, ready for user-recorded human takes.
 const vocalProfiles=[
  {name:'DEMO VOICE · LEAD (voyelles)',role:'lead',volume:-12,vowel:style==='rock'?2:style==='pop'?1:3,pan:0,effects:['voxclean','voxlevel','voxambience']},
  {name:'DEMO VOICE · BACKS (harmonies)',role:'backs',volume:-18,vowel:style==='rumba'?4:2,pan:-.23,effects:['voxclean','voxdoubler','voxambience']},
  {name:'DEMO VOICE · ADLIBS (réponses)',role:'adlibs',volume:-21,vowel:2,pan:.24,effects:['voxclean','alterecho']}
 ];
 for(const voice of vocalProfiles){
  const t=createContentTrack('wlvox',0);t.name=voice.name;t.volume=voice.volume;t.pan=voice.pan;
  Object.assign(t.instrument,{vowel:voice.vowel,attack:voice.role==='backs'?.16:.075,release:voice.role==='backs'?.6:.26,vibrato:voice.role==='lead'?.36:.18,tone:style==='rumba'?.34:.55,output:-8});
  for(const effectId of voice.effects){const slot=t.inserts.indexOf(null);if(slot<0)throw Error('Aucun insert disponible pour la voix de démo.');placeInsert(t,slot,effectId);}
  mixDemoVocalTrack(t,style,voice.role);
  for(let sec=0;sec<4;sec++){
   if(voice.role==='adlibs'&&sec===0)continue;
   const notes=[],first=sec*4;
   for(let bar=0;bar<4;bar++){
    const c=x.chords[bar],root=c[0],offset=bar*16;
    const offsets=voice.role==='lead'?[0,4,8,12]:voice.role==='backs'?[0,8]:[3,11];
    for(const [i,pos] of offsets.entries()){
     const notePitch=voice.role==='lead'?c[[2,1,3,2][i]]+(style==='rumba'?0:12):
       voice.role==='backs'?c[[1,2][i]]+12:c[[3,2][i]]+12;
     const len=voice.role==='lead'?[3.35,3.35,3.7,3.55][i]:voice.role==='backs'?7.2:2.7;
     notes.push(note(offset+pos,Math.min(86,notePitch),len,voice.role==='lead'?(sec===3?.65:.52):voice.role==='backs'?.36:.34));
    }
   }
   t.clips.push({id:uid(),name:sections[sec].name+' · '+voice.name,start:first,length:4,patternSteps:64,notes,description:'Voyelles synthétiques WarLike, non enregistrées par un chanteur.'});
  }
  tracks.push(t);
 }
 for(const [name,vol,color] of [['LEAD VOX (vide)',-5,'#d59da1'],['BACKS (vide)',-10,'#8dbbd2'],['ADLIBS (vide)',-13,'#b7a4d3']]){
  const t=createContentTrack('keys');Object.assign(t,{name,type:'audio',color,volume:vol,instrument:{},clips:[]});ensurePlugins(t);tracks.push(t);
 }
 return {
  version:1,demo:true,demoRevision:style==='rock'?2:3,demoGenre:style,
  name:x.name,bpm:x.bpm,bars:16,swing:x.swing,masterVolume:x.masterVolume,
  mastering:makeDemoMastering(style),
  recording:{gainDb:0,autoLevel:true},pianoKey:x.pianoKey,pianoScale:x.pianoScale,keyName:x.keyName,
  sections,tracks
 };
}

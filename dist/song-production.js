// R08.4 performance arrangements: deterministic humanisation; no random runtime timing,
// no private vocal imitation and no destructive edits to user recordings.
import {presetsFor,applyFactoryPreset} from './bundle.js';
import {ensurePlugins} from './plugins.js';

export const FRENCH_SONG_IDS=Object.freeze(['rnb-2005','popstar-2008','etoiles-interdites','derriere-les-murs','un-dernier-soleil','au-bord-du-ciel','promesses-de-pluie']);

// Indices refer to actual WarLike factory instrument presets, not just display labels.
// Track 0 = drums, 1 = bass, 2 = harmonic foundation, 3 = counter melody,
// 4 = guitar/strings/pad texture, 5 = answering melody.
const PRESET_MAP={
 'rnb-2005':[1,1,2,2,1,1],
 'popstar-2008':[4,1,1,2,1,2],
 'etoiles-interdites':[1,1,2,2,1,1],
 'derriere-les-murs':[1,2,2,2,1,1],
 'un-dernier-soleil':[4,1,1,2,1,2],
 'au-bord-du-ciel':[1,1,1,1,1,2],
 'promesses-de-pluie':[1,1,2,2,1,1]
};
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const sample=(seed)=>{let x=seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967295};
const salt=(id)=>[...id].reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),2166136261);
const FX_PER_ROLE=[
 [{id:'glue',params:{threshold:-22,ratio:1.6,attack:22,release:180,mix:.42}}],
 [{id:'sculpt',params:{highpass:27,cutoff:11000}},{id:'glue',params:{threshold:-22,ratio:1.6,attack:26,release:170,mix:.38}}],
 [{id:'sculpt',params:{highpass:75,cutoff:13000}},{id:'aura',params:{mix:.12}}],
 [{id:'sculpt',params:{highpass:155,cutoff:10800}},{id:'echo',params:{mix:.10,feedback:.22}},{id:'aura',params:{mix:.11}}],
 [{id:'sculpt',params:{highpass:175,cutoff:12000}},{id:'aura',params:{mix:.16}}],
 [{id:'sculpt',params:{highpass:230,cutoff:11900}},{id:'echo',params:{mix:.10,feedback:.19}},{id:'aura',params:{mix:.13}}]
];
// Preserve the actual factory preset, then adjust only musical dynamics and room settings.
export function produceSongTrack(track,songId,role){
 if(!FRENCH_SONG_IDS.includes(songId)||role<0||role>5)return track;
 ensurePlugins(track);
 const list=presetsFor(track,'instrument');
 const requested=PRESET_MAP[songId]?.[role]??0;
 const index=Math.min(requested,Math.max(0,list.length-1));
 if(list.length){track.productionPreset=applyFactoryPreset(track,'instrument',index);track.productionPresetIndex=index;}
 const params=FX_PER_ROLE[role];
 for(const {id,params:values} of params){
  // Each slot contains a native WarLike instance. No duplicated legacy echo and
  // no FX applied at all when the requested processor isn't registered.
  if(!track.effects[id]||track.inserts.includes(id))continue;
  const slot=track.inserts.indexOf(null);
  if(slot<0)break;
  track.inserts[slot]=id;
  Object.assign(track.effects[id],values,{enabled:true});
 }
 // No overpowering stereo widening; clear center for the eventual human vocal.
 track.pan=[0,0,-.10,.13,-.16,.17][role];
 track.volume-=role===0?1:role===1?2:1;
 return track;
}
export function articulateSongClip(clip,songId,role,kind,sectionIndex,cycle){
 if(!FRENCH_SONG_IDS.includes(songId)||!clip)return clip;
 const seed=salt(songId)+sectionIndex*1327+cycle*97+role*10007;
 const steps=clip.patternSteps||clip.length*16;
 if(Array.isArray(clip.notes)){
  clip.notes=clip.notes.map((note,i)=>{
   const r=sample(seed+i*10289+Math.floor(note.step*331));
   const accent=note.step%16<.25?.075:note.step%4<.4?.025:0;
   const phrasing=kind==='hook'?.07:kind==='bridge'?-.07:kind==='intro'?-.08:0;
   // Guitar and piano strokes breathe; bass remains tighter to the kick.
   const jitter=role===1?.065:role===2?.12:role===4?.11:.18;
   const time=clamp(note.step+(r-.5)*jitter+(role>=3?.035:0),0,Math.max(0,steps-.04));
   const end=Math.min(steps,time+Math.max(.13,note.len*(.85+.21*r)));
   const dynamic=clamp(note.velocity*(.80+.34*r)+accent+phrasing,.16,.90);
   const phraseTurn=sectionIndex===6&&role===3&&i%11===2&&kind==='hook';
   return {...note,step:Number(time.toFixed(4)),len:Number(Math.max(.03,end-time).toFixed(4)),velocity:Number(dynamic.toFixed(4)),
    midi:phraseTurn&&note.midi+12<112?note.midi+12:note.midi};
  });
  // Take away a small fraction of the busy countermelody during verses, to leave a pocket for vocals.
  if((kind==='verse'||kind==='intro')&&role>=3)
   clip.notes=clip.notes.filter((n,i)=>i%7!==5);
 }else if(clip.pattern){
  for(const [voice,pattern] of Object.entries(clip.pattern)){
   if(!Array.isArray(pattern))continue;
   clip.pattern[voice]=pattern.map((hit,i)=>{
    if(!hit)return hit;
    const r=sample(seed+i*173+voice.length*919);
    const accent=i%16===0?1.06:i%4===0?.95:.77;
    const life=clamp((.79+.29*r)*accent,0,1);
    // The simple drum sequencer treats 0 as rest and any positive value as a hit.
    return Number((hit*life).toFixed(4));
   });
  }
 }
 return clip;
}

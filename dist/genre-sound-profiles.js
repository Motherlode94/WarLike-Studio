// Genre-aware DSP profiles. Every preset must target real instrument/effect controls.
// Adding a genre should improve sound design AND score—not just rename the demo.
import {INSTRUMENTS,EFFECTS} from './plugins.js';
const profile=(instruments,effects)=>({instruments,effects});
export const GENRE_SOUND_PROFILES={
 pop:profile({
  piano:{brightness:7200,tone:-1.2,attack:.008,release:1.4,dynamics:.68,width:.8},wlclean:{brightness:5600,body:.72,pickPosition:.42,damping:.34,drive:0,attack:.009},
  wlmuted:{brightness:3800,body:.73,pickPosition:.48,damping:.63,drive:0,decay:.48},
  wlrompler:{wave:1,texture:0,layer:.2,cutoff:2500,attack:.48,release:2.5,space:.24},
  wlsteel:{brightness:5400,body:.7,pickPosition:.4,damping:.32,attack:.013}
 },{
  circuiteq:{low:-.5,body:-1,presence:.7,air:1,output:0},
  voxaireq:{highpass:85,presence:1,air:1.3,mix:.85},
  exospace:{mix:.15},
  voxambience:{slap:98,feedback:.06,room:.25,slapLevel:.22,mix:.14}
 }),
 rumba:profile({
  wlnylon:{brightness:4200,body:.83,pickPosition:.5,damping:.43,drive:0,attack:.017},
  wlclean:{brightness:4700,body:.71,pickPosition:.43,damping:.29,drive:0,attack:.007},
  wlmuted:{brightness:3400,body:.76,pickPosition:.53,damping:.69,drive:0,decay:.43},
  wlsteel:{brightness:4500,body:.8,pickPosition:.45,damping:.38,attack:.014},
  wljazz:{brightness:2250,body:.83,pickPosition:.51,damping:.53,drive:0,decay:1.35}
 },{
  circuiteq:{low:1,body:1.2,presence:-.4,air:-1,output:0},
  voxambience:{slap:89,feedback:.03,room:.2,slapLevel:.14,mix:.1},
  vectorcomp:{threshold:-18,ratio:2,attack:28,release:190,mix:.7}
 })
};
export function validateGenreSoundProfile(genre){
 const p=GENRE_SOUND_PROFILES[genre];if(!p)throw new Error('Profil sonore inconnu : '+genre);
 for(const [category,registry]of [['instruments',INSTRUMENTS],['effects',EFFECTS]]){
  for(const [id,values]of Object.entries(p[category])){
   const def=registry[id];if(!def)throw new Error('DSP absent : '+id);
   for(const [key,value]of Object.entries(values)){
    const control=def.controls.find(c=>c.key===key);
    if(!control||!Number.isFinite(value)||value<control.min||value>control.max)throw new Error('Réglage de genre hors plage : '+id+'.'+key);
   }
  }
 }
 return true;
}
export function applyGenreSoundProfile(track,genre){
 const p=GENRE_SOUND_PROFILES[genre];if(!p)return track;
 const instruments=p.instruments[track.type];
 if(instruments)Object.assign(track.instrument,instruments);
 for(const id of track.inserts.filter(Boolean)){
  const values=p.effects[id];if(values&&track.effects[id])Object.assign(track.effects[id],values);
 }
 return track;
}

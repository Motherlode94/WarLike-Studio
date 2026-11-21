import {effectType,ensurePlugins} from './plugins.js';
import {applyNativeChain,nativeChainCapacity} from './native-vocal-chains.js';

// Conservative starting points, not measured mastering or adaptive EQ.
export function instrumentMixRole(track){
 const name=String(track.name||'');
 if(track.type==='drums')return /hi.hat|rolls|triplets/i.test(name)?'hats':'drums';
 if(track.type==='bass'||/\b(?:808|bass|basse|sub)\b/i.test(name))return 'bass';
 if(/pad|texture|drone/i.test(name)||track.type==='pad')return 'texture';
 return 'melody';
}
const profiles={
 drums:[{id:'vectorcomp',params:{threshold:-18,ratio:2,attack:25,release:100,mix:.45}}],
 hats:[{id:'sculpt',params:{highpass:180,cutoff:16000}}],
 bass:[{id:'sculpt',params:{highpass:25,cutoff:14000}},{id:'vectorcomp',params:{threshold:-20,ratio:2,attack:20,release:120,mix:.5}}],
 texture:[{id:'sculpt',params:{highpass:150,cutoff:10000}}],
 melody:[{id:'sculpt',params:{highpass:75,cutoff:18000}},{id:'vectorcomp',params:{threshold:-18,ratio:1.6,attack:30,release:180,mix:.35}}]
};
export function mixPublicDemoInstruments(project){
 if(!project?.publicDemo||project.demoInstrumentMixRevision===1)return project;
 for(const track of project.tracks||[]){
  if(!track.clips?.length||['audio','wlvox','bus','aux','master'].includes(track.type))continue;
  ensurePlugins(track);
  const existing=new Set(track.inserts.filter(Boolean).map(effectType));
  const chain=profiles[instrumentMixRole(track)].filter(item=>!existing.has(item.id)&&!(item.id==='sculpt'&&['vectoreq','circuiteq'].some(id=>existing.has(id)))&&!(item.id==='vectorcomp'&&['glue','circuitbus'].some(id=>existing.has(id))));
  if(chain.length&&nativeChainCapacity(track,chain).valid)applyNativeChain(track,chain);
 }
 project.demoInstrumentMixRevision=1;
 return project;
}

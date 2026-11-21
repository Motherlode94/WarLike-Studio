import {ensurePlugins} from './plugins.js';
import {applyNativeChain} from './native-vocal-chains.js';
import {instrumentMixRole} from './demo-instrument-mix.js';

const groups={
 drums:{name:'DRUM BUS',color:'#d9a06f',chain:[{id:'vectorcomp',params:{threshold:-18,ratio:1.5,attack:30,release:150,mix:.3}}]},
 bass:{name:'BASS BUS',color:'#b3acdf',chain:[]},
 music:{name:'MUSIC BUS',color:'#94b7aa',chain:[]},
 vocals:{name:'VOCAL BUS',color:'#ca909a',chain:[{id:'vectorcomp',params:{threshold:-18,ratio:1.5,attack:25,release:180,mix:.25}}]}
};
export function demoGroupRole(track){
 if(track.type==='audio'||track.type==='wlvox')return 'vocals';
 const role=instrumentMixRole(track);
 return role==='drums'||role==='hats'?'drums':role==='bass'?'bass':'music';
}
// Only factory copies: preserve existing custom routing and sends.
// Unity-gain buses avoid introducing an arbitrary second gain offset.
export function routePublicDemoGroups(project){
 if(!project?.publicDemo||project.demoGroupRevision===1)return project;
 const tracks=project.tracks||[];
 const ids=new Set(tracks.map(t=>t.id));
 const additions=[];
 for(const [role,def] of Object.entries(groups)){
  const members=tracks.filter(t=>t.clips?.length&&!['bus','aux','master'].includes(t.type)&&(!t.output||t.output==='master')&&demoGroupRole(t)===role);
  if(!members.length)continue;
  let id='demobus'+role;
  for(let n=2;ids.has(id);n++)id='demobus'+role+n;
  ids.add(id);
  const bus={id,name:def.name,type:'bus',color:def.color,volume:0,pan:0,mute:false,solo:false,clips:[],output:'master',sends:[]};
  ensurePlugins(bus);
  if(def.chain.length)applyNativeChain(bus,def.chain);
  additions.push({bus,members});
 }
 for(const {bus,members} of additions){
  tracks.push(bus);
  for(const member of members)member.output=bus.id;
 }
 project.demoGroupRevision=1;
 return project;
}

import {ensurePlugins} from './plugins.js';
import {applyNativeChain} from './native-vocal-chains.js';
const roles=[['lead','LEAD VOCAL BUS',/^LEAD\b/i],['backing','BACKING VOCAL BUS',/^(DOUBLES|HARMONIES)\b/i],['adlibs','ADLIBS BUS',/^(ADLIBS|RÉPONSES)\b/i]];
const settings={'vox-trap':[2,10,95],'vox-afro':[1.5,20,150],'vox-rnb':[1.5,30,220]};
export function routeVocalSubgroups(project){
 if(!project?.publicDemo||!project.vocalDemo||project.demoVocalBusRevision===1)return project;
 const tracks=project.tracks||[],master=tracks.find(t=>t.type==='bus'&&t.name==='VOCAL BUS'&&t.output==='master');
 if(!master)return project;
 const ids=new Set(tracks.map(t=>t.id));
 const [ratio,attack,release]=settings[project.vocalDemoKind]||settings['vox-afro'];
 for(const [role,name,pattern] of roles){
  const members=tracks.filter(t=>t.type==='audio'&&t.output===master.id&&pattern.test(t.name||''));
  if(!members.length)continue;
  let id='demovox'+role;for(let n=2;ids.has(id);n++)id='demovox'+role+n;
  ids.add(id);
  const bus={id,name,type:'bus',color:'#ca909a',volume:0,pan:0,mute:false,solo:false,clips:[],output:master.id,sends:[]};
  ensurePlugins(bus);
  applyNativeChain(bus,[{id:'vectorcomp',params:{threshold:-20,ratio,attack,release,mix:.2}}]);
  tracks.push(bus);
  for(const t of members)t.output=id;
 }
 project.demoVocalBusRevision=1;
 return project;
}

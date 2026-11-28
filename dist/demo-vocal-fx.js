import {ensurePlugins,effectType} from './plugins.js';
import {applyNativeChain} from './native-vocal-chains.js';
const profiles={
 'vox-trap':{decay:.8,beats:.5,feedback:.28,levels:[[-22,-20,-24],[-19,-24,-27],[-18,-15,-30]]},
 'vox-afro':{decay:1.4,beats:.75,feedback:.22,levels:[[-17,-24,-28],[-15,-26,-30],[-18,-20,-32]]},
 'vox-rnb':{decay:2.4,beats:1,feedback:.24,levels:[[-15,-25,-28],[-13,-26,-30],[-12,-22,-32]]}
};
export function routeVocalFX(p){
 if(!p?.publicDemo||!p.vocalDemo||p.demoVocalBusRevision!==1||p.demoVocalFXRevision===1)return p;
 const profile=profiles[p.vocalDemoKind],tracks=p.tracks,master=tracks.find(t=>t.type==='bus'&&t.name==='VOCAL BUS'&&t.output==='master');
 if(!profile||!master||tracks.length>61)return p;
 const groups=['LEAD VOCAL BUS','BACKING VOCAL BUS','ADLIBS BUS'].map(name=>tracks.find(t=>t.type==='bus'&&t.name===name&&t.output===master.id));
 if(groups.some(t=>!t||(t.sends||[]).length>5))return p;
 const ids=new Set(tracks.map(t=>t.id)),returns=[];
 const defs=[
 ['verb','VOX REVERB',{id:'exospace',params:{decay:profile.decay,predelay:20,mix:1}}],
 ['delay','VOX DELAY',{id:'alterecho',params:{beats:profile.beats,feedback:profile.feedback,mix:1}}],
 ['parallel','VOX PARALLEL COMP',{id:'vectorcomp',params:{threshold:-28,ratio:8,attack:8,release:120,mix:1,output:12}}]
 ];
 for(const [role,name,fx] of defs){
  let id='demofx'+role;for(let n=2;ids.has(id);n++)id='demofx'+role+n;ids.add(id);
  const bus={id,name,type:'bus',color:'#9b8bc6',volume:0,pan:0,mute:false,solo:false,clips:[],output:master.id,sends:[]};
  ensurePlugins(bus);applyNativeChain(bus,[fx]);returns.push(bus);
 }
 tracks.push(...returns);
 groups.forEach((g,i)=>{
  g.sends??=[];
  returns.forEach((bus,j)=>{let id='send'+bus.id;for(let n=2;g.sends.some(s=>s.id===id);n++)id='send'+bus.id+n;g.sends.push({id,target:bus.id,level:profile.levels[i][j],pre:false,enabled:true});});
 });
 // Factory vocal spatial inserts are replaced by shared returns, not doubled.
 for(const t of tracks.filter(t=>t.type==='audio'&&groups.some(g=>g.id===t.output))){
  t.inserts=t.inserts.map(id=>{if(id&&['alterecho','exospace'].includes(effectType(id))){if(t.effects[id])t.effects[id].enabled=false;return null;}return id;});
 }
 p.demoVocalFXRevision=1;return p;
}

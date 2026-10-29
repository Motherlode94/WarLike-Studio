const uid=()=>Math.random().toString(36).slice(2,11),copy=v=>structuredClone(v),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function normaliseFolders(project){const ids=new Set(project.tracks.map(t=>t.id)),seen=new Set();project.folders=(Array.isArray(project.folders)?project.folders:[]).slice(0,32).filter(f=>f&&typeof f.id==='string').map(f=>({id:f.id,name:String(f.name||'Dossier').slice(0,60),collapsed:f.collapsed===true,busId:project.tracks.some(t=>t.id===f.busId&&t.type==='bus')?f.busId:null,members:(Array.isArray(f.members)?f.members:[]).filter(id=>{if(!ids.has(id)||seen.has(id)||id===f.busId)return false;seen.add(id);return true;})}));return project.folders;}
export function groupTracks(project,folder){normaliseFolders(project);const members=new Set(folder.members),first=project.tracks.findIndex(t=>members.has(t.id));if(first<0)throw Error('Choisis au moins une piste.');for(const f of project.folders)f.members=f.members.filter(id=>!members.has(id));const selected=project.tracks.filter(t=>members.has(t.id)),rest=project.tracks.filter(t=>!members.has(t.id));rest.splice(first,0,...selected);project.tracks=rest;project.folders.push(copy(folder));normaliseFolders(project);return project.folders.at(-1);}
export function musicalVariant(clip,kind,amount=.5,seed=1){
 const c=copy(clip),steps=c.patternSteps||32;let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32;};
 if(c.notes){c.notes=c.notes.map(n=>({...n,id:uid()}));if(kind==='human')for(const n of c.notes){n.step=clamp(n.step+(random()-.5)*amount*.4,0,steps-n.len);n.velocity=clamp((n.velocity??.8)+(random()-.5)*amount*.3,.05,1);}
  if(kind==='space')c.notes=c.notes.filter((n,i)=>i%2===0||n.len>=4);
  if(kind==='octave')c.notes=c.notes.map(n=>({...n,midi:clamp(n.midi+12,0,127)}));
  if(kind==='answer')c.notes=c.notes.filter(n=>n.step<steps/2).map(n=>({...n,step:n.step+steps/2}));
 }else if(c.pattern){if(kind==='space')for(const [voice,row] of Object.entries(c.pattern))if(!['kick','clap'].includes(voice))c.pattern[voice]=row.map((v,i)=>i%4===0?v:0);
  if(kind==='human')for(const row of Object.values(c.pattern))for(let i=0;i<row.length;i++)if(row[i])row[i]=clamp(row[i]*(1+(random()-.5)*amount*.5),.05,1);
  if(kind==='answer'){for(const [voice,row] of Object.entries(c.pattern))c.pattern[voice]=row.map((v,i)=>i>=row.length/2?row[i-row.length/2]:0);}
  if(kind==='octave'){const row=c.pattern.hat;if(row)for(let i=0;i<row.length;i++)if(i%2===1&&!row[i])row[i]=.28;}
 }
 return c;
}
export function channelSnapshot(track){return copy({type:track.type,sampler:track.sampler||null,instrument:track.instrument,effects:track.effects,inserts:track.inserts,volume:track.volume,pan:track.pan});}
export function restoreChannelSnapshot(track,snapshot){Object.assign(track,copy(snapshot));}

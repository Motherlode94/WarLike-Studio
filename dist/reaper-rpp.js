/**
 * Read-only, deliberately conservative REAPER RPP importer.
 * Supports fixed-tempo 4/4 audio items. Unknown or unsupported data is reported.
 * Never evaluates FX chunks, absolute local paths, or embedded script content.
 */
const id=()=>Math.random().toString(36).slice(2,11);
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const words=value=>[...String(value||'').matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`([^`]*)`|([^\s]+)/g)]
 .map(m=>m[1]!==undefined?m[1].replace(/\\"/g,'"'):m[2]!==undefined?m[2]:m[3]!==undefined?m[3]:m[4]);
const props=(node,key)=>node.children.find(x=>x.key===key&&!x.block)?.args||[];
const sections=(node,key)=>node.children.filter(x=>x.key===key&&x.block);
const allSections=(node,key)=>node.children.flatMap(x=>x.block?[(x.key===key?x:null),...allSections(x,key)].filter(Boolean):[]);
const n=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const db=value=>clamp(20*Math.log10(Math.max(0.000001,value)), -48,12);
export const reaperBasename=path=>String(path||'').replace(/\\/g,'/').split('/').pop().toLowerCase();
export function parseReaperRpp(source,{name='REAPER import'}={}){
 if(typeof source!=='string'||source.length>8_000_000)throw new Error('Fichier RPP absent ou trop volumineux (8 Mo maximum).');
 const root={key:'ROOT',args:[],block:true,children:[]},stack=[root];
 let lines=0;
 for(const raw of source.split(/\r?\n/)){
  if(++lines>400000)throw new Error('Projet REAPER trop volumineux.');
  const line=raw.trim();
  if(!line||line.startsWith('//'))continue;
  if(line==='>'){if(stack.length===1)throw new Error('Bloc RPP mal fermé.');stack.pop();continue;}
  if(line[0]==='<'){
   const value=words(line.slice(1)),node={key:value.shift()||'',args:value,block:true,children:[]};
   stack.at(-1).children.push(node);stack.push(node);
   if(stack.length>80)throw new Error('Structure RPP trop profonde.');
  }else{
   const value=words(line),key=value.shift()||'';
   stack.at(-1).children.push({key,args:value,block:false,children:[]});
  }
 }
 if(stack.length!==1)throw new Error('Projet REAPER incomplet ou mal fermé.');
 const rpp=sections(root,'REAPER_PROJECT')[0];
 if(!rpp)throw new Error('Ce fichier ne contient pas de REAPER_PROJECT.');
 const warnings=[],tempo=props(rpp,'TEMPO'),bpm=n(tempo[0],120),beats=n(tempo[1],4),denominator=n(tempo[2],4);
 if(bpm<40||bpm>240)throw new Error('Tempo en dehors des limites actuelles de WarLike (40–240 BPM).');
 if((beats!==4||denominator!==4)||allSections(rpp,'TEMPOENVEX').length)warnings.push('Mesures et changements de tempo : import basé sur les secondes à tempo constant 4/4, alignement à vérifier.');
 const colors=['#ca909a','#8fa7c4','#b1a584','#ab9bc0','#a7bc93'];
 const assets=new Map(),fxReport=[],tracks=[];
 const secondsPerBar=240/bpm;
 let bars=16,clipCount=0;
 for(const section of sections(rpp,'TRACK').slice(0,64)){
   const rawName=props(section,'NAME')[0]||'Piste REAPER '+(tracks.length+1);
   const fader=props(section,'VOLPAN'),mute=props(section,'MUTESOLO');
   const tr={id:id(),name:rawName.slice(0,60),type:'audio',color:colors[tracks.length%colors.length],
     volume:db(n(fader[0],1)),pan:clamp(n(fader[1],0),-1,1),mute:n(mute[0])!==0,solo:n(mute[1])!==0,clips:[]};
   const names=[];
   for(const fx of allSections(section,'FXCHAIN'))for(const e of fx.children){
     if(e.block&&['VST','AU','CLAP','JS','DX','LV2'].includes(e.key)){
       names.push(e.args[0]||e.key);
     }
   }
   if(names.length)fxReport.push({trackId:tr.id,track:tr.name,plugins:names});
   for(const item of sections(section,'ITEM')){
     const position=n(props(item,'POSITION')[0],0),length=n(props(item,'LENGTH')[0],0);
     const title=props(item,'NAME')[0];
     const take=sections(item,'TAKE')[0]||item;
     const sources=allSections(take,'SOURCE');
     const audio=sources.find(source=>!['MIDI','MIDIPOOL'].includes(source.args[0])&&props(source,'FILE').length);
     const sourcePath=audio&&props(audio,'FILE')[0];
     if(!sourcePath){if(sources.some(s=>['MIDI','MIDIPOOL'].includes(s.args[0])))warnings.push('Item MIDI non importé sur '+tr.name+'.');else warnings.push('Item sans source audio pris en charge sur '+tr.name+'.');continue;}
     if(!Number.isFinite(position)||!Number.isFinite(length)||length<=0||position<0){warnings.push('Item à position ou durée invalide sur '+tr.name+'.');continue;}
     if(clipCount>=32768)throw new Error('Trop de clips dans le projet REAPER.');
     const start=position/secondsPerBar,duration=length/secondsPerBar;
     if(start+duration>2048){warnings.push('Item au-delà de 2048 mesures ignoré : '+(title||sourcePath));continue;}
     const path=sourcePath.replace(/\\/g,'/');
     if(!assets.has(path))assets.set(path,id());
     const playrate=n(props(take,'PLAYRATE')[0],1);
     if(Math.abs(playrate-1)>1e-5)warnings.push('Vitesse de lecture '+playrate+' non reproduite : '+reaperBasename(path));
     const offset=n(props(take,'SOFFS')[0],0),fadeIn=n(props(item,'FADEIN')[1],0),fadeOut=n(props(item,'FADEOUT')[1],0);
     const gain=n(props(item,'VOLPAN')[0],1);
     tr.clips.push({id:id(),name:String(title||reaperBasename(path)||'Audio').slice(0,100),start,length:duration,audioId:assets.get(path),
       sourceOffset:Math.max(0,offset),gainDb:db(gain),fadeIn:Math.max(0,fadeIn),fadeOut:Math.max(0,fadeOut)});
     bars=Math.max(bars,Math.ceil(start+duration));clipCount++;
   }
   tracks.push(tr);
 }
 if(sections(rpp,'TRACK').length>64)warnings.push('Seules les 64 premières pistes sont importées.');
 if(!tracks.length)throw new Error('Aucune piste REAPER exploitable trouvée.');
 if(!clipCount)warnings.push('Aucun clip audio importé ; les MIDI, instruments et données propriétaires restent dans REAPER.');
 if(fxReport.length)warnings.push('Les paramètres VST/AU/CLAP/JSFX ne sont pas convertis ; des équivalents fonctionnels natifs peuvent être appliqués séparément.');
 if(allSections(rpp,'RECMONITEMS').length)warnings.push('Certaines options de monitoring REAPER ne sont pas reproduites.');
 return {project:{version:1,name:String(name).replace(/\.rpp(?:-bak)?$/i,'').slice(0,60),bpm,bars:Math.min(2048,bars),swing:0,masterVolume:0,
   recording:{gainDb:0,autoLevel:true},mastering:{inserts:[]},tracks},assets:[...assets].map(([path,audioId])=>({path,audioId})),warnings:[...new Set(warnings)],fxReport,clipCount};
}
export function matchReaperMedia(refs,files){
 const byPath=new Map(),byName=new Map();
 for(const file of files){
  const path=String(file.webkitRelativePath||file.name||'').replace(/\\/g,'/').toLowerCase().replace(/^\.\//,'');
  byPath.set(path,file);
  const base=reaperBasename(path),list=byName.get(base)||[];list.push(file);byName.set(base,list);
 }
 const matched=[],missing=[],ambiguous=[];
 for(const ref of refs){
  const path=ref.path.replace(/\\/g,'/').toLowerCase().replace(/^\.\//,'');
  let file=byPath.get(path);
  if(!file){const choices=byName.get(reaperBasename(path))||[];if(choices.length===1)file=choices[0];else if(choices.length>1)ambiguous.push(ref.path);}
  if(file)matched.push({...ref,file});else if(!ambiguous.includes(ref.path))missing.push(ref.path);
 }
 return {matched,missing,ambiguous};
}

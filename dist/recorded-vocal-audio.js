// Bundled human recordings, not oscillator guides or speech synthesis.
// Fetch/validate all media before changing even the new demo's clip lists.
const uid=()=>globalThis.crypto?.randomUUID?.().replaceAll('-','')||Math.random().toString(36).slice(2,12);
export const RECORDED_VOCAL_KINDS=Object.freeze(['vox-trap','vox-afro','vox-rnb']);
export async function createRecordedVocalDemoMedia(project,{fetcher=globalThis.fetch}={}){
 if(!project?.vocalDemo||!RECORDED_VOCAL_KINDS.includes(project.vocalDemoKind))throw Error('Démo à voix enregistrées inconnue.');
 const tracks=project.tracks.filter(t=>t.type==='audio');
 if(tracks.length!==3||tracks.some(t=>t.clips.length))throw Error('Les voix de démo se chargent uniquement dans une nouvelle session vide.');
 const get=async url=>{const response=await fetcher(url);if(!response.ok)throw Error('Fichier vocal indisponible. Réessaie après le chargement de la page.');return response;};
 const all=await (await get(new URL('./samples/vocals/manifest.json',import.meta.url))).json(),definition=all[project.vocalDemoKind];
 if(!definition?.humanRecording||definition.targetBpm!==project.bpm||definition.license!=='CC BY 3.0'||definition.parts?.length!==3)throw Error('Manifest vocal incompatible avec cette session.');
 const sections=['verse-a','verse-b','chorus'];
 const media=await Promise.all(sections.map(async section=>{
  const part=definition.parts.find(p=>p.section===section);
  if(!part||!/^(trap|afro|rnb)-(verse-a|verse-b|chorus)\.mp3$/.test(part.file)||part.bars!==4||Math.abs(part.seconds-960/project.bpm)>.001)throw Error('Durée de prise vocale invalide.');
  const data=await (await get(new URL('./samples/vocals/'+part.file,import.meta.url))).arrayBuffer();
  if(data.byteLength!==part.bytes||data.byteLength<4096)throw Error('Fichier vocal incomplet.');
  return {id:uid(),name:definition.artist+' · '+definition.title+' · '+section+'.mp3',data};
 }));
 const clip=(audio,index,start,length,label,sourceOffset=0,gainDb=0)=>({id:uid(),name:'VOIX ENREGISTRÉE · '+label,start,length,audioId:audio.id,sourceOffset,gainDb,vocalSource:project.vocalDemoKind});
 const starts=[4,8,12],labels=['COUPLET A','COUPLET B','REFRAIN'];
 const clips=[media.map((audio,i)=>clip(audio,i,starts[i],4,labels[i])),[],[]];
 // These are transparently labelled processed copies, not claimed new takes.
 clips[1]=[clip(media[2],2,12.025,3.975,'DOUBLURE DÉRIVÉE · REFRAIN',0,-5)];
 const secondsPerBar=240/project.bpm;
 clips[2]=[clip(media[0],0,7,1,'RÉPONSE DÉRIVÉE · COUPLET A',secondsPerBar*3,-3),clip(media[1],1,11,1,'RÉPONSE DÉRIVÉE · COUPLET B',secondsPerBar*3,-3),clip(media[2],2,15,1,'RÉPONSE DÉRIVÉE · REFRAIN',secondsPerBar*3,-3)];
 tracks.forEach((track,i)=>{track.clips=clips[i];track.recordArm=false;});
 tracks[1].name='DOUBLURE TRAITÉE · '+({'vox-trap':'TRAP','vox-afro':'AFRO','vox-rnb':'R&B'}[project.vocalDemoKind]); tracks[2].name='RÉPONSES DÉRIVÉES · VOIX';
 project.demoRevision=6;
 project.vocalDemoInfo={...project.vocalDemoInfo,hasRecordedVoice:true,hasSyntheticGuides:false,language:'en',
  instructions:'Voix humaines enregistrées en anglais : couplets A/B et refrain. Les doublures et réponses sont des copies traitées du lead. Les clips, volumes et FX WarLike restent modifiables.',
  credits:[{title:definition.title,artist:definition.artist,year:definition.year,url:definition.url,license:definition.license,licenseUrl:definition.licenseUrl,adaptation:definition.adaptation}],
  mediaType:'licensed-human-recording',pluginMix:true};
 return media;
}

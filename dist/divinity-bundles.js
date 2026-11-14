// CHAYAH DIVINITÉS — bundles de production originaux.
// Noms culturels respectueux : aucune prétention à une équivalence spirituelle ou à une affiliation officielle.
// Les effets sont des modules Web Audio existants dans WarLike Studio ; pas de DSP fictif.
export const DIVINITY_BUNDLES={
  ogun:{name:'OGUN',tradition:'Yoruba (Afrique de l’Ouest)',label:'OGUN / DRUM FORGE',color:'#b78868',description:'Impact des drums et bus percussif. Ogun est associé au fer et au travail du métal dans la tradition yoruba.',modules:['circuiteq','circuitbus','circuitcolor'],kind:'track'},
  shango:{name:'SHANGO',tradition:'Yoruba (Afrique de l’Ouest)',label:'SHANGO / RAP POWER',color:'#d57f68',description:'Voix rap dense et contrôlée. Shango est associé au tonnerre dans la tradition yoruba.',modules:['voxclean','voxlevel','ember','alterecho'],kind:'track'},
  oshun:{name:'OSHUN',tradition:'Yoruba (Afrique de l’Ouest)',label:'OSHUN / SILK VOCALS',color:'#d8b771',description:'Voix R&B douce, présence et profondeur. Oshun est associée aux eaux douces dans la tradition yoruba.',modules:['voxclean','vectorcomp','exoair','exospace'],kind:'track'},
  yemoja:{name:'YEMOJA',tradition:'Yoruba (Afrique de l’Ouest)',label:'YEMOJA / OCEAN SPACE',color:'#79b7c9',description:'Espaces stéréo amples, modulations et ambiances.',modules:['alterdouble','orbit','exoair','exospace'],kind:'track'},
  obatala:{name:'OBATALA',tradition:'Yoruba (Afrique de l’Ouest)',label:'OBATALA / PURE MIX',color:'#b6c9ca',description:'Nettoyage, égalisation chirurgicale et maîtrise de la dynamique.',modules:['voxclean','vectoreq','vectorcomp'],kind:'track'},
  nyame:{name:'NYAME',tradition:'Akan (Ghana)',label:'NYAME / SKY MASTER',color:'#9eacd0',description:'Mastering équilibré et naturel. Nyame est une divinité céleste dans la tradition akan.',modules:['vectoreq','circuitbus','vectorlimit'],kind:'master'},
  asaseyaa:{name:'ASASE YAA',tradition:'Akan (Ghana)',label:'ASASE YAA / EARTH BASS',color:'#a8b783',description:'Fondations graves, basses et 808. Asase Yaa est associée à la terre dans la tradition akan.',modules:['exofocus','circuiteq','vectorcomp'],kind:'track'},
  mawu:{name:'MAWU',tradition:'Fon (Bénin)',label:'MAWU / SOFT MASTER',color:'#b2a3d1',description:'Mastering à faible compression pour préserver respiration et douceur.',modules:['vectoreq','vectorcomp','vectorlimit'],kind:'master'},
  lisa:{name:'LISA',tradition:'Fon (Bénin)',label:'LISA / BRIGHT MASTER',color:'#d7b07a',description:'Finition lumineuse et tenue du bus musical ; Mawu-Lisa est un couple divin dans des traditions fon.',modules:['circuiteq','circuitbus','vectorlimit'],kind:'master'},
  anansi:{name:'ANANSI',tradition:'Akan (Ghana)',label:'ANANSI / CREATIVE FX',color:'#9ba9bc',description:'Effets de mouvement, doublage et delays créatifs. Anansi est une figure de récits et de sagesse.',modules:['alterfilter','alterdouble','alterecho','phase'],kind:'track'},
  aset:{name:'ASET',tradition:'Égypte antique',label:'ASET / VOCAL HALO',color:'#c4a5bd',description:'Présence vocale, contrôle des sifflantes et espace subtil. Aset est le nom égyptien d’Isis.',modules:['sibil','voxlevel','exoair','exospace'],kind:'track'},
  djehuty:{name:'DJEHUTY',tradition:'Égypte antique',label:'DJEHUTY / PRECISION',color:'#9ac3b0',description:'Égalisation précise et contrôle des crêtes. Djehuty est le nom égyptien de Thot.',modules:['vectoreq','vectorcomp','vectorlimit'],kind:'master'}
};

// Des recettes complètes et réversibles. Valeurs bornées par les définitions de plugins lors de l'application.
export const DIVINITY_RECIPES={
  ogun:{circuiteq:{low:1.5,body:-1,presence:1},circuitbus:{threshold:-22,ratio:3,attack:30,release:110,mix:.8},circuitcolor:{drive:5,mix:.25}},
  shango:{voxclean:{highpass:80,range:7,air:1},voxlevel:{peakThreshold:-14,levelThreshold:-25,ratio:3},ember:{drive:5,mix:.18},alterecho:{beats:.5,duck:.8,mix:.12}},
  oshun:{voxclean:{highpass:75,range:5,air:1},vectorcomp:{threshold:-22,ratio:2,attack:25,release:240},exoair:{},exospace:{}},
  yemoja:{alterdouble:{mix:.22,width:.8},orbit:{mix:.2,depth:.2},exoair:{},exospace:{}},
  obatala:{voxclean:{highpass:85,range:5},vectoreq:{g1:-1.5,g3:1},vectorcomp:{threshold:-16,ratio:1.5}},
  nyame:{vectoreq:{g5:.5},circuitbus:{threshold:-16,ratio:1.5,attack:40,mix:1},vectorlimit:{ceiling:-1.2,drive:.5}},
  asaseyaa:{exofocus:{},circuiteq:{low:1.5,body:-1},vectorcomp:{threshold:-18,ratio:2.5,attack:35}},
  mawu:{vectoreq:{g5:.5},vectorcomp:{threshold:-14,ratio:1.3,attack:45,release:330},vectorlimit:{drive:0,ceiling:-1.5}},
  lisa:{circuiteq:{air:1},circuitbus:{threshold:-18,ratio:1.5,attack:35},vectorlimit:{drive:.75,ceiling:-1}},
  anansi:{alterfilter:{depth:500,mix:.25},alterdouble:{mix:.22},alterecho:{feedback:.3,mix:.18},phase:{rate:.2,mix:.2}},
  aset:{sibil:{frequency:6500,range:6},voxlevel:{ratio:2,levelThreshold:-20},exoair:{},exospace:{}},
  djehuty:{vectoreq:{g1:-.5},vectorcomp:{threshold:-16,ratio:1.5},vectorlimit:{drive:0,ceiling:-1.5}}
};
export function divinityBundlePreview(id,definitions){
  const bundle=DIVINITY_BUNDLES[id];if(!bundle)throw new Error('Bundle inconnu.');
  if(!definitions||typeof definitions!=='object')throw new Error('Catalogue des effets manquant.');
  return {...bundle,id,chain:bundle.modules.map(type=>{
    const definition=definitions[type];if(!definition)throw new Error('Effet indisponible : '+type);
    const requested=DIVINITY_RECIPES[id][type]||{};
    return {type,name:definition.name,settings:{enabled:true,...Object.fromEntries(definition.controls.map(c=>{
      const value=Number.isFinite(requested[c.key])?requested[c.key]:c.default;
      return [c.key,Math.max(c.min,Math.min(c.max,value))];
    }))}};
  })};
}
export function applyDivinityBundle(project,track,id,definitions,{confirm=false}={}){
  if(!confirm)throw new Error('Application non confirmée.');
  const spec=divinityBundlePreview(id,definitions);
  if(spec.kind!=='track')throw new Error('Ce bundle est destiné au mastering. Prévisualiser puis appliquer via le rack Master.');
  if(!track||!Array.isArray(track.inserts)||!track.effects||typeof track.effects!=='object')throw new Error('Piste non initialisée.');
  const first=track.inserts.findIndex(x=>x===null);
  // Contiguous capacity required: never overwrite existing inserts or silently discard processing.
  if(first<0||track.inserts.slice(first,first+spec.chain.length).length!==spec.chain.length||track.inserts.slice(first,first+spec.chain.length).some(Boolean))throw new Error('Pas assez d’inserts consécutifs libres.');
  // Build replacement copies first for atomic, non-destructive application.
  const inserts=[...track.inserts],effects={...track.effects};
  for(let i=0;i<spec.chain.length;i++){
    const item=spec.chain[i],unique=item.type+'__'+Math.random().toString(36).slice(2,10);
    inserts[first+i]=unique;effects[unique]=item.settings;
  }
  track.inserts=inserts;track.effects=effects;return spec;
}

import {ORIGINS_BANK} from './origins.js';
// Presentation only. Keys explicitly group the original instrument controls.
const e=(family,material,layout,motif,banks,focus)=>({family,material,layout,motif,banks:banks.map(([name,keys])=>({name,keys:keys.split(' ')})),focus:focus.split(' ')});
const guitar=(material,layout,motif,first,second,focus)=>e('GUITARES',material,layout,motif,[[first,'pickPosition brightness body'],[second,'damping decay drive'],['JEU / STÉRÉO','attack release width output']],focus);
const acoustic=(family,material,layout,motif,first,second,focus)=>e(family,material,layout,motif,[[first,'brightness tone'],[second,'attack release dynamics'],['ESPACE / ACCORDAGE','width transpose output']],focus);
const specs={
 origins:e('VENTS DU MONDE','walnut','wind','wind',[['MODÈLE / SOUFFLE','voice tone breath'],['EXPRESSION','vibrato expression'],['ARTICULATION','attack release']],'voice breath'),
 wlvox:e('VOIX SYNTHÉTIQUES','velvet','voice','voice',[['VOYELLE / COULEUR','vowel tone'],['EXPRESSIVITÉ','breath vibrato'],['ENVELOPPE / SORTIE','attack release output']],'vowel breath'),
 wlsteel:guitar('walnut','string','guitar','CORDES ACIER / CAISSE','RÉSONANCE / GRAIN','brightness decay'),
 wlnylon:guitar('ivory','harp','guitar','DOIGTS / CAISSE','ÉTOUFFEMENT / CORDE','pickPosition body'),
 wlfolk12:guitar('brass','ensemble','guitar','DOUBLES CORDES','TENUE / COULEUR','width decay'),
 wljazz:guitar('walnut','keys','guitar','MICRO / HOLLOW BODY','AMORTISSEMENT / AMPLI','body brightness'),
 wlclean:guitar('mint','strip','guitar','ATTAQUE / MICRO','CORDE / AMPLI','brightness pickPosition'),
 wlcrunch:guitar('copper','amp','guitar','MÉDIATOR / CAISSE','SATURATION / TENUE','drive decay'),
 wlmuted:guitar('graphite','drum','guitar','PINÇAGE / COULEUR','PALM MUTE / AMPLI','damping decay'),
 wlrompler:e('SYNTHÈSE MULTICOUCHE','blue','layers','layers',[['COUCHE A / B','wave texture layer'],['FILTRE / ESPACE','cutoff space'],['ENVELOPPE / SORTIE','attack release output']],'layer cutoff'),
 wlvirtual:e('ANALOGIQUE VIRTUEL','graphite','analog','analog',[['OSCILLATEURS / UNISSON','detune pulse width'],['FILTRE RÉSONANT','cutoff resonance'],['ENVELOPPE / SORTIE','attack release output']],'cutoff detune'),
 wlspectral:e('SYNTHÈSE HYBRIDE','blue','spectral','fm',[['MATIÈRE SPECTRALE','fm harmonics'],['MOUVEMENT / FILTRE','motion cutoff width'],['ENVELOPPE / SORTIE','attack release output']],'fm motion'),
 piano:acoustic('CLAVIERS ENREGISTRÉS','ivory','piano','piano','MARTEAUX / TABLE','TOUCHER / TENUE','brightness dynamics'),
 upright:acoustic('CLAVIERS ENREGISTRÉS','walnut','keys','piano','CAISSE DU PIANO DROIT','TOUCHER INTIME','tone release'),
 epiano:acoustic('CLAVIERS ENREGISTRÉS','mint','keys','piano','TINES / COULEUR','ATTAQUE FM / TOUCHER','tone dynamics'),
 harp:acoustic('CORDES PINCÉES','ivory','harp','harp','ÉCLAT DES CORDES','PINCEMENT / RÉSONANCE','brightness release'),
 marimba:acoustic('LAMES DE BOIS','walnut','mallet','mallet','LAMES / BOIS','MAILLOCHE / EXTINCTION','tone attack'),
 vibes:acoustic('LAMES MÉTALLIQUES','blue','mallet','mallet','MÉTAL / BRILLANCE','MAILLOCHE / TENUE','brightness release'),
 kalimba:acoustic('LAMES PINCÉES','brass','pluck','mallet','LAMES / CAISSE','POUCES / DYNAMIQUE','tone dynamics'),
 strum:acoustic('CORDES PINCÉES','walnut','string','guitar','CORDES / CAISSE','PINCEMENT / TENUE','brightness release'),
 violin:acoustic('CORDES À L’ARCHET','velvet','bow','bow','CORPS DU VIOLON','ARCHET / EXPRESSION','attack dynamics'),
 cello:acoustic('ENSEMBLE À L’ARCHET','walnut','ensemble','bow','CAISSE / GRAVE','ARCHETS / PHRASE','tone attack'),
 flute:acoustic('VENTS ENREGISTRÉS','mint','wind','wind','AIR / BRILLANCE','SOUFFLE / PHRASE','attack brightness'),
 trumpet:acoustic('CUIVRES ENREGISTRÉS','brass','brass','brass','PAVILLON / COULEUR','ATTAQUE / PHRASE','tone dynamics'),
 sampler:e('AUDIO DÉCOUPÉ','copper','sampler','pads',[['ACCORDAGE / NIVEAU','transpose output'],['CONTOUR DU SAMPLE','attack release']],'transpose attack'),
 exo:e('SYNTHÈSE À DEUX COUCHES','blue','layers','layers',[['COUCHES / DENSITÉ','blend detune width'],['FILTRE','cutoff resonance'],['MATIÈRE / ESPACE','fm motion space'],['OSCILLATEURS','waveA waveB transposeA transposeB'],['ENVELOPPE','attack decay sustain release output'],['MODULATION','motionRate'],['ARPÉGIATEUR','arpMode arpRate arpOctaves arpGate']],'blend cutoff'),
 drums:e('BOÎTE À RYTHMES','copper','drum','pads',[['KIT / IMPACT','kit punch humanize'],['EXTINCTION / CHARLEY','decay hat']],'kit decay'),
 bass:e('SYNTHÉTISEUR 808','graphite','bass','analog',[['FONDAMENTALE','body analog'],['COULEUR / EXTINCTION','harmonics release']],'body harmonics'),
 keys:e('CLAVIER À TINES FM','mint','keys','piano',[['TOUCHER / TENUE','attack release'],['ACCORDAGE','detune analog']],'attack detune'),
 lead:e('SYNTHÈSE LEAD','brass','analog','analog',[['FILTRE','cutoff analog'],['OSCILLATEURS / SORTIE DE NOTE','detune release']],'cutoff detune'),
 pad:e('ENSEMBLE STÉRÉO','blue','ensemble','layers',[['OUVERTURE / EXTINCTION','attack release'],['UNISSON','width analog']],'attack width'),
 pluck:e('CORDE PHYSIQUE','velvet','pluck','harp',[['RÉSONATEUR','decay body'],['EXCITATION','brightness analog']],'decay brightness'),
 wltitan:e('BASSE ÉLECTRIQUE','walnut','string','guitar',[],'pickup damping'),
 wlabyss:e('SUB / CHUTE DE HAUTEUR','graphite','bass','analog',[],'drop time'),
 wlimperial:e('ENSEMBLE SYNTHÉTIQUE','brass','ensemble','bow',[],'strings brass'),
 wltonewheel:e('ORGUE ADDITIF','walnut','organ','organ',[],'fundamental percussion'),
 wlmbira:e('LAMES MODÉLISÉES','brass','mallet','mallet',[],'metal decay'),
 wlngoma:e('MEMBRANE MODÉLISÉE','copper','drum','pads',[],'skin strike'),
 wlkora:e('CORDES MODÉLISÉES','ivory','harp','harp',[],'pluck resonance'),
 wlchoir:e('CHŒUR SYNTHÉTIQUE','velvet','voice','voice',[],'vowel spread'),
 wldrift:e('TEXTURE GRANULAIRE','blue','spectral','layers',[],'grain density'),
 wlmatrix:e('MATRICE FM','graphite','fm','fm',[],'ratioA indexA')
};
const HARDI_FACES={
 hardiharpa:['CORDES PINCÉES','ivory','harp','harp'],
 hardimbira:['LAMELLOPHONES','brass','mallet','mallet'],
 hardicelesta:['CÉLESTA','blue','keys','piano'],
 hardimallet:['PERCUSSIONS MÉLODIQUES','walnut','mallet','mallet'],
 hardiflute:['VENTS','mint','wind','wind'],
 hardireed:['ANCHES','walnut','wind','wind'],
 hardibrass:['CUIVRES','brass','brass','brass'],
 hardistrings:['CORDES','velvet','ensemble','bow'],
 hardichoira:['CHŒURS SYNTHÉTIQUES','velvet','voice','voice'],
 hardisoul:['ORGUES','walnut','organ','organ'],
 hardipulse:['SYNTHÉTISEURS','graphite','analog','analog'],
 hardiambient:['TEXTURES CINÉMATIQUES','blue','layers','layers']
};
for(const [id,[family,material,layout,motif]] of Object.entries(HARDI_FACES)){
 specs[id]=e(family,material,layout,motif,[['TIMBRE / CORPS','tone body'],['ENVELOPPE / MOUVEMENT','attack release motion'],['NIVEAU','output']],'tone motion');
}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const INSTRUMENT_FACES=freeze(specs);
export const instrumentFace=id=>Object.hasOwn(INSTRUMENT_FACES,id)?INSTRUMENT_FACES[id]:null;
// Plan the whole operation before moving any DOM controls. Existing custom
// expansion diagrams retain their original control banks.
export function planInstrumentBanks(id,containers){
 const spec=instrumentFace(id);if(!spec||!spec.banks.length)return null;
 const expected=spec.banks.flatMap(b=>b.keys),provided=containers.flat();
 if(new Set(expected).size!==expected.length||provided.length!==new Set(provided).size||expected.length!==provided.length||expected.some(k=>!provided.includes(k)))return null;
 return containers.map(keys=>spec.banks.map(b=>({...b,keys:b.keys.filter(k=>keys.includes(k))})).filter(b=>b.keys.length));
}

export function instrumentReadout(id,control,value,formatValue){
 if(id==='origins'&&control.key==='voice')return ORIGINS_BANK[Math.round(value)]?.name||String(value);
 if(id==='wlvox'&&control.key==='vowel')return ['Hum','Ah','Oh','Eh','Ou'][Math.round(value)]||String(value);
 if(id==='drums'&&control.key==='kit')return ['Synthèse','Rock','Pop','Rumba','Baile'][Math.round(value)]||String(value);
 return formatValue(control,value);
}

/** Stable individual faceplate per native instrument; purely presentation data. */
export function instrumentHardwareIdentity(id){
 const spec=instrumentFace(id);
 if(!spec)throw Error('Instrument inconnu pour sa façade.');
 const hash=[...id].reduce((acc,ch)=>((acc*33)^ch.charCodeAt(0))>>>0,5381);
 const engraving=id.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
 const serial=String(hash%10000).padStart(4,'0');
 // Retain the instrument-specific material and layout, varying the engraving
 // and chassis details without pretending to show DSP or audio measurements.
 const chassis=['studio','stage','module','vintage'][hash%4];
 return Object.freeze({engraving,serial,chassis,material:spec.material,
  variant:id+'-'+serial,notches:2+(hash%5)});
}

/**
 * Hand-authored performance decks use the actual existing instrument controls,
 * not decorative replacements. This first set targets acoustic instruments
 * and synths; unlisted instruments keep their certified layout.
 */
const PERFORMANCE_DECKS=Object.freeze({
 piano:{type:'hammer',title:'PIANO · EXPRESSIVITÉ',hint:'Marteaux et dynamique',keys:['brightness','dynamics']},
 upright:{type:'hammer',title:'PIANO DROIT · TOUCHER',hint:'Réponse de la caisse',keys:['tone','release']},
 epiano:{type:'keys',title:'E-PIANO · TINES',hint:'Couleur et toucher',keys:['tone','dynamics']},
 harp:{type:'plucked',title:'HARPE · RÉSONANCE',hint:'Éclat et durée des cordes',keys:['brightness','release']},
 violin:{type:'bowed',title:'VIOLON · ARCHET',hint:'Attaque et expression',keys:['attack','dynamics']},
 cello:{type:'bowed',title:'VIOLONCELLE · PHRASE',hint:'Corps et attaque',keys:['tone','attack']},
 flute:{type:'breath',title:'FLÛTE · SOUFFLE',hint:'Air et articulation',keys:['attack','brightness']},
 trumpet:{type:'breath',title:'TROMPETTE · PAVILLON',hint:'Timbre et dynamique',keys:['tone','dynamics']},
 wlvirtual:{type:'osc',title:'ANALOG · OSCILLATEURS',hint:'Accord et filtre résonant',keys:['detune','cutoff']},
 wlrompler:{type:'layers',title:'ROMPLER · COUCHES',hint:'Équilibre des couches et filtre',keys:['layer','cutoff']},
 wlspectral:{type:'spectral',title:'SPECTRAL · MODULATION',hint:'Modulation de fréquence et mouvement',keys:['fm','motion']}
});
export function instrumentPerformanceDeck(id,definition){
 const authored=Object.hasOwn(PERFORMANCE_DECKS,id)?PERFORMANCE_DECKS[id]:null;
 if(!authored||!definition?.controls)return null;
 const keys=new Set(definition.controls.map(control=>control.key));
 if(authored.keys.some(key=>!keys.has(key)))return null;
 return Object.freeze({...authored,keys:Object.freeze([...authored.keys])});
}

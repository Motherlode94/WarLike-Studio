// CHAYAH AI Mix & Master: explainable, local DSP assistant.
// "AI" here denotes intelligent recommendations, not a trained neural network.
// Never uploads audio or silently modifies a project.
import {masteringSettings} from './mastering.js?v=0.15.12';

const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const round=(x,n=2)=>Number(x.toFixed(n));
export const AI_MASTER_STYLES=Object.freeze({
  transparent:{label:'Transparent',cut:25,low:0,mid:0,high:0,ratio:1.4,ceiling:-1.5,drive:0},
  rap:{label:'Rap / Trap',cut:28,low:.5,mid:.5,high:.75,ratio:2.2,ceiling:-1,drive:1},
  afro:{label:'Afro / Amapiano',cut:28,low:.25,mid:.25,high:.75,ratio:1.7,ceiling:-1.2,drive:.75},
  afrobeats:{label:'Afrobeats',cut:26,low:.25,mid:.25,high:1,ratio:1.7,ceiling:-1.2,drive:1},
  amapiano:{label:'Amapiano / Log Drum',cut:20,low:0,mid:-.25,high:.5,ratio:1.4,ceiling:-1.3,drive:.5},
  afrohouse:{label:'Afro House',cut:24,low:.25,mid:0,high:.75,ratio:1.8,ceiling:-1.2,drive:.75},
  rnb:{label:'R&B / Soul',cut:24,low:.25,mid:-.25,high:.5,ratio:1.5,ceiling:-1.5,drive:.5},
  rock:{label:'Rock',cut:28,low:0,mid:.5,high:.5,ratio:2,ceiling:-1.2,drive:1},
  altrock:{label:'Alternative Rock',cut:28,low:0,mid:.5,high:.5,ratio:2,ceiling:-1.2,drive:1},
  indierock:{label:'Indie Rock',cut:25,low:.5,mid:-.25,high:0,ratio:1.5,ceiling:-1.5,drive:.5},
  heavyalt:{label:'Heavy Alternative',cut:30,low:-.25,mid:.5,high:.5,ratio:2.2,ceiling:-1,drive:1.5},
  cinematic:{label:'Cinematic',cut:22,low:0,mid:0,high:.5,ratio:1.3,ceiling:-2,drive:0}
});
export const AI_MIX_TEMPLATES=Object.freeze({
  vocal:{name:'Vocal Clean',inserts:['hush','sibil','prism','glue'],note:'Gate, de-esser, EQ et compression douce ; vérifier les sibilantes à l’oreille.'},
  rapVocal:{name:'Rap Front',inserts:['hush','sibil','prism','glue','ember'],note:'Voix en avant, saturation subtile ; ajuster selon le micro.'},
  bass:{name:'Bass Foundation',inserts:['sculpt','prism','glue'],note:'Contrôler le bas du spectre ; vérifier les interactions avec le kick.'},
  drums:{name:'Drum Glue',inserts:['prism','glue','ember'],note:'Préserver les transitoires et éviter la compression excessive.'},
  musicBus:{name:'Music Bus',inserts:['prism','glue'],note:'Traitement léger ; garder de la marge sur le bus.'},
  afroPercussion:{name:'Afro Percussion',inserts:['sculpt','prism','glue','ember'],note:'Percussions aérées, transitoires conservées et chaleur légère : vérifier le groove en contexte.'},
  amapianoLogDrum:{name:'Amapiano Log Drum',inserts:['sculpt','prism','glue'],note:'Préserver le fondamental du log drum ; vérifier phase, bas-médiums et chevauchement avec le kick.'},
  afrobeatsVocal:{name:'Afrobeats Lead Vocal',inserts:['hush','sibil','vectoreq','voxlevel','aura'],note:'Voix présente et douce : couper les sifflantes sans écraser les attaques.'},
  alternativeGuitars:{name:'Alt Rock Guitars',inserts:['sculpt','vectoreq','ember','glue'],note:'Atténuer le bas-médium excessif, préserver la morsure et contrôler les résonances.'},
  rockDrums:{name:'Rock Drums',inserts:['prism','circuitbus','ember'],note:'Maintenir l’impact de la caisse claire et du kick ; éviter la compression excessive.'},
  indieVocal:{name:'Indie Vocal',inserts:['voxclean','circuitcolor','glue','slap'],note:'Voix intime, saturation légère et slap discret ; comparer à niveau égal.'}
});
export function analyzeAudioBuffer(buffer,{maxSeconds=45}={}){
  if(!buffer||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<=0||!Number.isInteger(buffer.numberOfChannels)||buffer.numberOfChannels<1||!Number.isInteger(buffer.length)||buffer.length<1||typeof buffer.getChannelData!=='function')throw new Error('AudioBuffer invalide.');
  const channels=Math.min(2,buffer.numberOfChannels),data=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));
  const frames=Math.min(buffer.length,Math.max(1,Math.floor(maxSeconds*buffer.sampleRate))),stride=Math.max(1,Math.floor(frames/250000));
  let sumSq=0,sum=0,peak=0,clipped=0,count=0,cross=0,lSq=0,rSq=0;
  for(let i=0;i<frames;i+=stride){
    let mono=0;
    for(let ch=0;ch<channels;ch++){
      const x=data[ch][i];
      if(!Number.isFinite(x))throw new Error('Échantillon audio invalide.');
      peak=Math.max(peak,Math.abs(x));clipped+=Math.abs(x)>=.999?1:0;
      mono+=x;sum+=x;sumSq+=x*x;count++;
    }
    if(channels===2){const l=data[0][i],r=data[1][i];cross+=l*r;lSq+=l*l;rSq+=r*r;}
  }
  const rms=Math.sqrt(sumSq/count),db=x=>x>0?20*Math.log10(x):-120;
  const correlation=channels===2&&lSq*rSq>0?clamp(cross/Math.sqrt(lSq*rSq),-1,1):null;
  return Object.freeze({sampleRate:buffer.sampleRate,channels,analyzedSeconds:round(frames/buffer.sampleRate),samplePeakDbfs:round(db(peak)),rmsDbfs:round(db(rms)),crestDb:round(db(peak)-db(rms)),dcOffset:round(sum/count,5),clippedFraction:round(clipped/count,5),stereoCorrelation:correlation===null?null:round(correlation,3),measurement:'sample-peak/RMS; not integrated LUFS or true-peak'});
}
export function recommendMastering(metrics,{style='transparent'}={}){
  const p=AI_MASTER_STYLES[style];
  if(!p)throw new Error('Style de mastering inconnu.');
  if(!metrics||![metrics.samplePeakDbfs,metrics.rmsDbfs,metrics.crestDb].every(Number.isFinite))throw new Error('Analyse audio invalide.');
  if(metrics.rmsDbfs<=-70||metrics.samplePeakDbfs<=-70)throw new Error('Le mix est silencieux ou trop faible pour proposer un mastering. Vérifie les pistes, les clips et les sorties audio.');
  const warnings=[];
  if(metrics.samplePeakDbfs>=-.1||metrics.clippedFraction>0)warnings.push('Crêtes proches de 0 dBFS ou écrêtage : réduire le gain du mix avant mastering.');
  if(Math.abs(metrics.dcOffset)>0.02)warnings.push('Offset DC détecté : examiner la source.');
  if(metrics.stereoCorrelation!==null&&metrics.stereoCorrelation<-.1)warnings.push('Corrélation stéréo négative : vérifier la compatibilité mono.');
  if(metrics.crestDb<7)warnings.push('Dynamique déjà limitée : compression et gain supplémentaires réduits.');
  if(metrics.rmsDbfs>-10)warnings.push('Niveau RMS élevé : préserver la dynamique et éviter une nouvelle forte limitation.');
  const alreadyDense=metrics.crestDb<7||metrics.rmsDbfs>-10;
  const threshold=clamp(metrics.rmsDbfs+5,-28,-10);
  const drive=alreadyDense?0:clamp(p.drive+Math.max(0,-metrics.samplePeakDbfs-5)*.12,0,3);
  // Uses existing Studio native modules. No claims of LUFS, true peak or mastering compliance.
  const inserts=['balance','press','peak',...Array(9).fill(null)];
  const mastering=masteringSettings({inserts,bypass:false,
    balance:{enabled:true,cut:p.cut,low:p.low,mid:p.mid,high:p.high},
    press:{enabled:true,threshold:round(threshold,.0),ratio:alreadyDense?1.2:p.ratio,attack:alreadyDense?40:30,release:style==='rnb'||style==='cinematic'?350:200,makeup:0},
    peak:{enabled:true,drive:round(drive),ceiling:p.ceiling,release:160}
  });
  return {style,label:p.label,metrics:{...metrics},mastering,warnings,explanation:'Proposition calculée localement selon RMS, crête échantillon, facteur de crête et profil musical. Écouter et comparer à niveau égal avant validation.',requiresApproval:true};
}
export function applyAIMasterRecommendation(project,recommendation,{confirm=false}={}){
  if(!confirm)throw new Error('Application non confirmée.');
  if(!project||!recommendation?.requiresApproval||!recommendation.mastering)throw new Error('Proposition invalide.');
  const valid=masteringSettings(recommendation.mastering);
  if(!valid.inserts.includes('balance')||!valid.inserts.includes('press')||!valid.inserts.includes('peak'))throw new Error('Chaîne proposée incomplète.');
  project.mastering=valid;
  return project.mastering;
}

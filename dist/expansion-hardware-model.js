import {EXPANSION_INSTRUMENTS} from './wl-expansion.js';
import {expansionSettings} from './wl-expansion-voices.js';
export const EXPANSION_BANKS=Object.freeze({
 wltitan:[['CORDE / MICRO',['pickup','brightness','damping']]],
 wlabyss:[['PITCH / SATURATION',['drop','time','drive']]],
 wlimperial:[['ENSEMBLE',['strings','brass','width']]],
 wltonewheel:[['TIRETTES',['sub','fundamental','octave','third','high']],['ATTAQUE ORGUE',['percussion']]],
 wlmbira:[['MODES / MÉTAL',['metal','decay','buzz']]],
 wlngoma:[['MEMBRANE / FRAPPE',['skin','decay','strike']]],
 wlkora:[['CORDE / RÉSONANCE',['pluck','resonance','decay']]],
 wlchoir:[['FORMANTS / ENSEMBLE',['vowel','spread','width']]],
 wldrift:[['GRAINS',['grain','density','scatter']]],
 wlmatrix:[['MOD A',['ratioA','indexA']],['MOD B',['ratioB','indexB']],['MODULATION',['decay']]]
});
export function expansionBanks(id){return EXPANSION_BANKS[id]?[...EXPANSION_BANKS[id],['ENVELOPPE / SORTIE',['attack','release','output']]]:[];}
export function expansionEnvelope(s,duration=1){return {attack:Math.min(duration*.8,s.attack),hold:duration,end:duration+s.release+.025,peak:.55*10**(s.output/20)};}
export function expansionVisual(id,values){
 const p=expansionSettings(id,values);if(!p)return null;let kind,bars=[],points=[],detail=[];
 switch(id){
 case 'wltitan':kind='string';points=[p.pickup];detail=['Micro '+Math.round(p.pickup*100)+' %','Filtre '+p.brightness+' Hz','Durée du modèle '+Math.max(.2,2.8*(1-p.damping)).toFixed(2)+' s'];break;
 case 'wlabyss':kind='pitch';points=[p.drop,p.time];detail=['Chute '+p.drop+' demi-tons','Durée '+Math.round(p.time*1000)+' ms','Drive '+Math.round(p.drive*100)+' %'];break;
 case 'wlimperial':kind='layers';bars=[['CORDES',p.strings],['CUIVRES',p.brass],['STÉRÉO',p.width]];detail=['Cordes : 3 oscillateurs','Cuivres : 2 oscillateurs','Largeur '+Math.round(p.width*100)+' %'];break;
 case 'wltonewheel':kind='drawbars';bars=[['16 ft',p.sub],['8 ft',p.fundamental],['4 ft',p.octave],['2 2/3 ft',p.third],['2 ft',p.high],['PERC',p.percussion]];detail=['5 partiels additifs','Percussion 3× · 180 ms'];break;
 case 'wlmbira':kind='modes';bars=[['1×',.7],['2.76×',.25*p.metal],['5.41×',.25*p.metal/2],['8.93×',.25*p.metal/3],['BUZZ',.13*p.buzz]];detail=['Modes inharmoniques','Décroissance '+p.decay.toFixed(2)+' s'];break;
 case 'wlngoma':kind='modes';bars=[['1×',.65],['1.59×',.27*p.skin],['2.14×',.27*p.skin/2],['2.92×',.27*p.skin/3],['FRAPPE',.17*p.strike]];detail=['Fondamentale ½ × note MIDI','Décroissance '+p.decay.toFixed(2)+' s','Chute de hauteur 35 ms'];break;
 case 'wlkora':kind='string';points=[p.pluck];detail=['Position '+Math.round(p.pluck*100)+' %','Résonances 2× / 3× : '+Math.round(p.resonance*100)+' %','Durée '+p.decay.toFixed(2)+' s'];break;
 case 'wlchoir':kind='formants';points=[800-350*p.vowel,1450-650*p.vowel,p.width];detail=['F1 '+Math.round(points[0])+' Hz · F2 '+Math.round(points[1])+' Hz','3 voix · ±'+p.spread+' cents'];break;
 case 'wldrift':kind='grains';points=Array.from({length:Math.round(p.density)},(_,g)=>{const seed=(Math.sin((g+1)*91.731)*43758.5453)%1,noise=seed-Math.floor(seed),count=Math.round(p.density);return [(g+noise*p.scatter)/count,p.grain,noise];});detail=[points.length+' grains / boucle 1 s','Grain '+Math.round(p.grain*1000)+' ms','Dispersion '+Math.round(p.scatter*100)+' %'];break;
 case 'wlmatrix':kind='fm';bars=[['INDEX A',p.indexA/5],['INDEX B',p.indexB/5]];detail=['A : '+p.ratioA+' × porteuse','B : '+p.ratioB+' × porteuse','Décroissance '+p.decay.toFixed(2)+' s'];break;
 }
 return {kind,bars,points,detail,envelope:expansionEnvelope(p)};
}

import {INSTRUMENTS,pluginDefaults} from './plugins.js?v=0.14.0';
import {FACTORY_PRESETS} from './bundle.js?v=0.14.0';
export function installInstrumentAudition(d){
 const button=document.createElement('button');button.type='button';button.id='compareInstruments';button.className='outline-btn';button.textContent='Écoute A/B des instruments';
 (document.querySelector('.bank-filters')||document.querySelector('.studio-more-panel'))?.append(button);
 button.onclick=()=>{
  const choices=Object.entries(INSTRUMENTS).filter(([id])=>!['sampler','drums'].includes(id));
  const slot=(id,type)=>`<fieldset><legend>Instrument ${id}</legend><select id="audition${id}" aria-label="Instrument ${id}">${choices.map(([key,def])=>`<option value="${key}" ${key===type?'selected':''}>${def.name} · ${def.subtitle}</option>`).join('')}</select><select id="auditionPreset${id}" aria-label="Preset ${id}"></select><button id="auditionPlay${id}" class="primary-btn">▶ Écouter ${id}</button></fieldset>`;
  d.modal('Écoute A/B des instruments',`<div class="instrument-audition"><p>Même phrase MIDI, même vélocité et même sortie pour comparer les timbres. La session reste intacte.</p><div class="instrument-audition-slots">${slot('A','keys')}${slot('B','pluck')}</div><label>Registre<select id="auditionOctave"><option value="-1">Grave · −1 octave</option><option value="0" selected>Médium · Do 4</option><option value="1">Aigu · +1 octave</option></select></label><button id="auditionStop" class="outline-btn">■ Arrêter</button><output id="auditionStatus" role="status">Prêt à comparer</output></div>`,'BIBLIOTHÈQUE / TIMBRES');
  const engine=d.getEngine(),wasPlaying=engine.playing;engine.pause();d.updateTransport();let request=0;
  const stop=()=>{request++;engine.stopPreview();};
  for(const slot of ['A','B']){
   const select=document.getElementById('audition'+slot),presets=document.getElementById('auditionPreset'+slot),play=document.getElementById('auditionPlay'+slot);
   const refresh=()=>{presets.replaceChildren(new Option('Réglage naturel / initial','-1'),...(FACTORY_PRESETS[select.value]||[]).map((p,i)=>new Option(p.name,String(i))));};refresh();select.onchange=()=>{stop();refresh();};presets.onchange=stop;
   play.onclick=async()=>{
    stop();const token=request,type=select.value,definition=INSTRUMENTS[type],preset=FACTORY_PRESETS[type]?.[Number(presets.value)],params={...pluginDefaults(type).instrument,...preset?.values};const status=document.getElementById('auditionStatus');status.textContent='Chargement de '+definition.name+'…';
    try{await engine.prepareInstrument(type);await engine.init();if(token!==request)return;const t=engine.ctx.currentTime+.03,transpose=Number(document.getElementById('auditionOctave').value)*12;
     engine.capturePreview(()=>{for(const [i,midi] of [60,64,67,72,67,64].entries())engine.synth(engine.ctx,engine.master,type,midi+transpose,t+i*.3,.24,true,params,.75);});status.textContent=slot+' · '+definition.name+' · '+(preset?.name||'Réglage initial');
    }catch(error){if(token===request)status.textContent=error.message;}
   };
  }
  document.getElementById('auditionStop').onclick=()=>{stop();document.getElementById('auditionStatus').textContent='Arrêté';};document.getElementById('auditionOctave').onchange=stop;
  document.getElementById('modal').addEventListener('close',()=>{stop();if(wasPlaying)d.toast('Lecture de la session en pause. Appuie sur Lecture pour reprendre.');},{once:true});
 };
}

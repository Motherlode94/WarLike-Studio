// Interaction layer for CHAYAH DIVINITÉS — no network uploads or background automation.
import {DIVINITY_BUNDLES,divinityBundlePreview,applyDivinityBundle} from './divinity-bundles.js';
import {AI_MASTER_STYLES,LOUDNESS_TARGETS,analyzeAudioBuffer,recommendMastering,refineMasteringForTarget,applyAIMasterRecommendation} from './ai-mix-master.js';
import {measureLoudness} from './audio-loudness.js';
import {EFFECTS} from './plugins.js';
import {MASTER_MODULES,masteringSettings} from './mastering.js?v=0.15.12';

const safe = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const short = x => Number.isFinite(x) ? x.toFixed(1) : '—';

export function createDivinityUI({getProject,getTrack,engine,checkpoint,changed,toast,renderMastering,renderLibrary}) {
  let proposal = null, activeProject = null, busy = false, analysisError = null, chosenStyle = 'transparent', chosenTarget = 'streaming';
  const css = `
  .divinity-action{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0 2px}
  .divinity-action button,.chayah-ai-panel button{cursor:pointer;min-height:34px}
  .divinity-tag{font-size:11px;opacity:.8}
  .chayah-ai-panel{margin:18px 0;padding:18px;border:1px solid #66778a;border-radius:12px;background:rgba(54,74,95,.13)}
  .chayah-ai-panel h3{margin:0 0 7px;font-size:18px}
  .chayah-ai-panel p{margin:5px 0 12px}
  .chayah-ai-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .chayah-ai-controls select{min-height:36px;min-width:160px}
  .chayah-ai-result{margin:12px 0;padding:12px;border:1px solid #6b7c8e;border-radius:8px}
  .chayah-ai-warning{color:#f1bd83}
  .chayah-ai-result strong{font-variant-numeric:tabular-nums}
  `;
  if(typeof document !== 'undefined' && !document.getElementById('chayah-ai-css')) {
    const style=document.createElement('style');style.id='chayah-ai-css';style.textContent=css;document.head.append(style);
  }
  function decoratePacks(root) {
    if(!root)return;
    for(const [id,bundle] of Object.entries(DIVINITY_BUNDLES)){
      const card = [...root.querySelectorAll('.effect-pack')].find(el => el.querySelector('h3')?.textContent === bundle.name);
      if(!card || card.querySelector('[data-divinity-apply]'))continue;
      const controls=document.createElement('div');
      controls.className='divinity-action';
      controls.innerHTML=`<button class="content-add" type="button" data-divinity-apply="${safe(id)}">${bundle.kind==='master'?'Charger dans Master':'Charger la chaîne complète'}</button><span class="divinity-tag">${safe(bundle.tradition)} · ${bundle.modules.length} effets · validation requise</span>`;
      card.append(controls);
    }
  }
  function apply(id) {
    try {
      const bundle=DIVINITY_BUNDLES[id];if(!bundle)throw Error('Bundle inconnu.');
      const spec=divinityBundlePreview(id,EFFECTS);
      const project=getProject();
      if(bundle.kind==='master'){
        // Existing mastering insert routing is replaced only after explicit confirmation.
        const ok=window.confirm('Remplacer la chaîne Master par '+bundle.name+' ? Les réglages actuels resteront accessibles via Annuler.');
        if(!ok)return;
        const inserts=[...bundle.modules,...Array(12-bundle.modules.length).fill(null)];
        const values=Object.fromEntries(spec.chain.map(x=>[x.type,x.settings]));
        const state=masteringSettings({inserts,bypass:false,...values});
        checkpoint();project.mastering=state;changed();renderMastering();toast(bundle.name+' chargé sur Master.');
      }else{
        const track=getTrack();if(!track)throw Error('Sélectionne une piste.');
        const capacity = track.inserts?.some((_,i)=>track.inserts.slice(i,i+spec.chain.length).length===spec.chain.length&&track.inserts.slice(i,i+spec.chain.length).every(x=>x===null));
        if(!capacity)throw Error('Inserts insuffisants : libère '+spec.chain.length+' emplacements consécutifs.');
        if(!window.confirm('Ajouter les '+spec.chain.length+' effets '+bundle.name+' sur '+track.name+' ?'))return;
        checkpoint();applyDivinityBundle(project,track,id,EFFECTS,{confirm:true});
        changed(true);renderLibrary();toast(bundle.name+' appliqué sur '+track.name+'.');
      }
    }catch(e){toast('Bundle : '+e.message);}
  }
  async function analyze(button) {
    if(busy)return;
    const source=getProject();
    if(!source)return;
    const style=document.getElementById('chayah-ai-style')?.value||chosenStyle;
    const targetId=document.getElementById('chayah-ai-target')?.value||chosenTarget;chosenTarget=Object.hasOwn(LOUDNESS_TARGETS,targetId)?targetId:'streaming';const target=LOUDNESS_TARGETS[chosenTarget];
    chosenStyle=Object.hasOwn(AI_MASTER_STYLES,style)?style:'transparent';
    const bars=Number(source.bars);
    if(!Number.isFinite(bars)||bars<=0){analysisError='Aucune plage musicale valide à analyser.';drawProposal();return;}
    if(!Array.isArray(source.tracks)||!source.tracks.some(track=>track.clips?.some(clip=>!clip.muted))){
      analysisError='Le projet ne contient aucun clip actif. Ajoute un enregistrement ou une partie instrumentale avant le mastering.';
      drawProposal();return;
    }
    busy=true;proposal=null;activeProject=null;analysisError=null;
    button.disabled=true;button.textContent='Analyse en cours…';
    drawProposal();
    try{
      // Analyze the PRE-master mix, otherwise existing mastering skews the new recommendation.
      // Keep track FX, sends, arrangement and automation exactly as in the project.
      const dryMasterProject={...source,mastering:{...source.mastering,bypass:true}};
      const buffer=await engine.renderRange({
        startBar:0,endBar:Math.min(32,bars),tail:false,sampleRate:44100,
        project:dryMasterProject
      });
      const range={startBar:0,endBar:Math.min(32,bars),tail:false,sampleRate:44100};
      if(source!==getProject())throw Error('La session a changé pendant l’analyse. Relance-la sur le projet actif.');
      const before=measureLoudness(buffer);
      const metrics={...analyzeAudioBuffer(buffer,{maxSeconds:90}),integratedLufs:before.integrated};
      proposal=recommendMastering(metrics,{style:chosenStyle,target});
      // Verify on a real render of the proposed master and correct up to three times.
      if(proposal.target)for(let pass=0;pass<3;pass++){
        button.textContent='Vérification du master… '+(pass+1)+'/3';
        const mastered=await engine.renderRange({...range,project:{...source,mastering:proposal.mastering}});
        if(source!==getProject())throw Error('La session a changé pendant l’analyse. Relance-la sur le projet actif.');
        const after=measureLoudness(mastered);proposal={...proposal,after:{integrated:Math.round(after.integrated*10)/10,truePeakDb:Math.round(after.truePeakDb*100)/100}};
        if(Math.abs(after.integrated-proposal.target.lufs)<=.5&&after.truePeakDb<=proposal.target.truePeak)break;
        proposal=refineMasteringForTarget(proposal,after);
      }
      activeProject=source;
      toast('Analyse locale terminée : vérifie la proposition avant de l’appliquer.');
    }catch(error){
      analysisError='Analyse impossible : '+(error?.message||String(error));
      toast(analysisError);
    }finally{
      busy=false;
      if(button.isConnected){button.disabled=false;button.textContent='Analyser le mix';}
      drawProposal();
    }
  }
  function drawProposal(){
    const root=document.getElementById('chayah-ai-result');
    if(!root)return;
    if(busy){root.innerHTML='<p role="status">Rendu et analyse du mix en cours… Ne change pas de projet pendant cette opération.</p>';return;}
    if(analysisError){root.innerHTML=`<div class="chayah-ai-result chayah-ai-warning" role="alert">${safe(analysisError)}<p>Vérifie les clips, les médias importés et le chargement des instruments, puis relance l’analyse.</p></div>`;return;}
    if(!proposal||activeProject!==getProject()){root.innerHTML='<p>Aucune analyse effectuée pour cette session.</p>';return;}
    const m=proposal.metrics;
    root.innerHTML=`<div class="chayah-ai-result" role="status"><strong>${safe(proposal.label)}</strong> · crête ${short(m.samplePeakDbfs)} dBFS · RMS ${short(m.rmsDbfs)} dBFS · dynamique ${short(m.crestDb)} dB
      ${proposal.target?`<p><strong>Niveau avant : ${short(m.integratedLufs)} LUFS</strong> → cible ${short(proposal.target.lufs)} LUFS · true peak ≤ ${short(proposal.target.truePeak)} dBTP</p>${proposal.after?`<p><strong>Mesuré après mastering : ${short(proposal.after.integrated)} LUFS · true peak ${short(proposal.after.truePeakDb)} dBTP</strong>${Math.abs(proposal.after.integrated-proposal.target.lufs)<=.5&&proposal.after.truePeakDb<=proposal.target.truePeak?' ✓ conforme':' · écart restant, ajuste le mix'}</p>`:''}`:`<p>Analyse d'un extrait du mix existant, avec ses traitements actuels. Sans cible, aucun objectif LUFS n'est appliqué.</p>`}
      <p>${safe(proposal.explanation)}</p>
      ${proposal.warnings.map(w=>`<p class="chayah-ai-warning">⚠ ${safe(w)}</p>`).join('')}
      <button type="button" class="content-add" data-chayah-master-apply>Appliquer la proposition</button>
      <button type="button" class="outline-btn" data-chayah-master-reject>Rejeter</button>
    </div>`;
  }
  function mountMaster(root){
    if(!root)return;
    const panel=document.createElement('section');panel.className='chayah-ai-panel';
    panel.innerHTML=`<h3>CHAYAH AI MASTER</h3><p>Assistant d'analyse DSP locale : recommandations de mastering, écoute A/B via le bypass du Master et validation manuelle.</p>
    <div class="chayah-ai-controls"><label for="chayah-ai-style">Style musical</label><select id="chayah-ai-style">${Object.entries(AI_MASTER_STYLES).map(([id,s])=>`<option value="${id}" ${id===chosenStyle?'selected':''}>${safe(s.label)}</option>`).join('')}</select>
    <label for="chayah-ai-target">Niveau de diffusion</label><select id="chayah-ai-target">${Object.entries(LOUDNESS_TARGETS).map(([id,t])=>`<option value="${id}" ${id===chosenTarget?'selected':''}>${safe(t.label)}</option>`).join('')}</select>
    <button type="button" class="content-add" data-chayah-master-analyze ${busy?'disabled':''}>${busy?'Analyse en cours…':'Analyser le mix'}</button></div>
    <div id="chayah-ai-result" aria-live="polite"></div><small>Analyse jusqu'à 32 mesures, mesure LUFS intégrée (EBU R128) et true peak, vérifiée sur un rendu réel du master ; aucun audio envoyé au serveur. Pour comparer à l'oreille, utilise le bypass A/B Master présent au-dessus.</small>`;
    root.querySelector('.mastering-tools')?.after(panel);
    panel.querySelector('#chayah-ai-target')?.addEventListener('change',event=>{chosenTarget=event.target.value;proposal=null;activeProject=null;analysisError=null;drawProposal();});
    panel.querySelector('#chayah-ai-style')?.addEventListener('change',event=>{chosenStyle=event.target.value;proposal=null;activeProject=null;analysisError=null;drawProposal();});
    drawProposal();
  }
  document.addEventListener('click', event=>{
    const b=event.target.closest('[data-divinity-apply], [data-chayah-master-analyze], [data-chayah-master-apply], [data-chayah-master-reject]');
    if(!b)return;
    if(b.hasAttribute('data-divinity-apply')){event.preventDefault();apply(b.dataset.divinityApply);}
    if(b.hasAttribute('data-chayah-master-analyze')){event.preventDefault();analyze(b);}
    if(b.hasAttribute('data-chayah-master-reject')){event.preventDefault();proposal=null;activeProject=null;drawProposal();}
    if(b.hasAttribute('data-chayah-master-apply')){
      event.preventDefault();
      if(!proposal||activeProject!==getProject()){toast('Relance l’analyse pour cette session.');return;}
      if(!window.confirm('Appliquer la proposition ? Elle remplace la chaîne Master actuelle et peut être annulée avec Ctrl+Z.'))return;
      try{checkpoint();applyAIMasterRecommendation(getProject(),proposal,{confirm:true});changed();proposal=null;activeProject=null;renderMastering();toast('Mastering proposé appliqué. Écoute et compare avant export.');}catch(error){toast(error.message);}
    }
  });
  return {decoratePacks,mountMaster};
}

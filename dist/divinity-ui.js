// Interaction layer for CHAYAH DIVINITÉS — no network uploads or background automation.
import {DIVINITY_BUNDLES,divinityBundlePreview,applyDivinityBundle} from './divinity-bundles.js';
import {AI_MASTER_STYLES,analyzeAudioBuffer,recommendMastering,applyAIMasterRecommendation} from './ai-mix-master.js';
import {EFFECTS} from './plugins.js';
import {MASTER_MODULES,masteringSettings} from './mastering.js';

const safe = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const short = x => Number.isFinite(x) ? x.toFixed(1) : '—';

export function createDivinityUI({getProject,getTrack,engine,checkpoint,changed,toast,renderMastering,renderLibrary}) {
  let proposal = null, activeProject = null, busy = false;
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
    const project=getProject();if(!project)return;
    busy=true;proposal=null;activeProject=null;button.disabled=true;button.textContent='Analyse en cours…';
    try{
      // Render at most 8 bars; preview reflects the actual current bus processing.
      const endBar=Math.min(8,project.bars);
      const buffer=await engine.renderRange({startBar:0,endBar,tail:false,sampleRate:44100});
      const metrics=analyzeAudioBuffer(buffer,{maxSeconds:45});
      const style=document.getElementById('chayah-ai-style')?.value||'transparent';
      proposal=recommendMastering(metrics,{style});
      activeProject=project;
      drawProposal();
      toast('Analyse locale terminée : vérifier la proposition avant de l’appliquer.');
    }catch(error){toast('Analyse impossible : '+error.message);}
    finally{busy=false;button.disabled=false;button.textContent='Analyser le mix';}
  }
  function drawProposal(){
    const root=document.getElementById('chayah-ai-result');
    if(!root)return;
    if(!proposal||activeProject!==getProject()){root.innerHTML='<p>Aucune analyse effectuée pour cette session.</p>';return;}
    const m=proposal.metrics;
    root.innerHTML=`<div class="chayah-ai-result" role="status"><strong>${safe(proposal.label)}</strong> · crête ${short(m.samplePeakDbfs)} dBFS · RMS ${short(m.rmsDbfs)} dBFS · dynamique ${short(m.crestDb)} dB
      <p>Analyse d'un extrait du mix existant, avec ses traitements actuels. Pas de mesure LUFS intégrée ni de true peak.</p>
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
    <div class="chayah-ai-controls"><label for="chayah-ai-style">Style musical</label><select id="chayah-ai-style">${Object.entries(AI_MASTER_STYLES).map(([id,s])=>`<option value="${id}">${safe(s.label)}</option>`).join('')}</select>
    <button type="button" class="content-add" data-chayah-master-analyze>Analyser le mix</button></div>
    <div id="chayah-ai-result" aria-live="polite"></div><small>Analyse des 8 premières mesures au maximum ; aucun audio envoyé au serveur. Pour comparer à l'oreille, utilise le bypass A/B Master présent au-dessus.</small>`;
    root.querySelector('.mastering-tools')?.after(panel);
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

// SIDE-CHAIN panel for GLUE, modelled on the Pro Tools plug-in header:
// Key Input selector + External Key switch + Key Listen. Key HPF / Key LPF are GLUE knobs.
import {reaches} from './studio-model.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function keySourceOptions(project,trackId){
  return (project.tracks||[]).filter(t=>t.id!==trackId&&!reaches(project.tracks,trackId,t.id));
}

export function installSidechainUI({getProject,checkpoint,changed}){
  const panelHTML=(project,track)=>{
    const g=track.effects?.glue||{},options=keySourceOptions(project,track.id);
    const source=options.some(t=>t.id===g.keySource)?g.keySource:'';
    return `<section class="sidechain-panel" data-sidechain-track="${esc(track.id)}" aria-label="Side-chain GLUE">
      <h3>SIDE-CHAIN · KEY INPUT</h3>
      <label>Key Input<select data-sidechain="keySource"><option value="">Aucune (détecteur interne)</option>${options.map(t=>`<option value="${esc(t.id)}" ${t.id===source?'selected':''}>${esc(t.name||t.id)}${t.type==='bus'?' · bus':''}</option>`).join('')}</select></label>
      <button type="button" data-sidechain="keyExternal" aria-pressed="${g.keyExternal?'true':'false'}" ${source?'':'disabled'}>External Key</button>
      <button type="button" data-sidechain="keyListen" aria-pressed="${g.keyListen?'true':'false'}" ${source&&g.keyExternal?'':'disabled'}>Key Listen</button>
      <small>Le compresseur réagit au signal de la piste choisie (ex. kick → basse). Key HPF / Key LPF filtrent ce signal ; Key Listen permet de l’écouter seul pendant le réglage.</small>
    </section>`;
  };
  const trackOf=win=>getProject().tracks.find(t=>t.id===win.dataset.pluginTrack);
  const isGlue=win=>{try{return JSON.parse(win.dataset.pluginKey||'[]')[1]==='glue';}catch{return false;}};
  function mount(win){
    if(!isGlue(win))return;const track=trackOf(win);if(!track)return;
    // Re-render only when the side-chain state or the track list changed (no observer loop).
    const g=track.effects?.glue||{},signature=JSON.stringify([g.keySource||'',!!g.keyExternal,!!g.keyListen,keySourceOptions(getProject(),track.id).map(t=>[t.id,t.name,t.type])]);
    const existing=win.querySelector('.sidechain-panel');
    if(existing?.dataset.signature===signature)return;
    const anchor=win.querySelector('.plugin-window-params');if(!existing&&!anchor)return;
    const holder=document.createElement('div');holder.innerHTML=panelHTML(getProject(),track);const panel=holder.firstElementChild;panel.dataset.signature=signature;
    if(existing)existing.replaceWith(panel);else anchor.after(panel);
  }
  let queued=false;const scan=()=>{queued=false;document.querySelectorAll('.floating-plugin[data-plugin-track]').forEach(mount);};
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(scan);}}).observe(document.body,{childList:true,subtree:true});
  const apply=(el,mutate)=>{const panel=el.closest('.sidechain-panel'),track=getProject().tracks.find(t=>t.id===panel?.dataset.sidechainTrack);if(!track)return;
    checkpoint();track.effects.glue??={};mutate(track.effects.glue);
    if(!track.effects.glue.keySource){track.effects.glue.keyExternal=false;track.effects.glue.keyListen=false;}
    if(!track.effects.glue.keyExternal)track.effects.glue.keyListen=false;
    changed();scan();};
  document.addEventListener('change',e=>{const el=e.target.closest?.('[data-sidechain="keySource"]');if(!el)return;apply(el,g=>{g.keySource=el.value;g.keyExternal=!!el.value;});});
  document.addEventListener('click',e=>{const el=e.target.closest?.('button[data-sidechain]');if(!el||el.disabled)return;const key=el.dataset.sidechain;apply(el,g=>{g[key]=!g[key];});});
  scan();
  return {scan};
}

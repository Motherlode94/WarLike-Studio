import {listRecoverableRecordings,readRecoverableRecording,discardRecoverableRecording} from './recording-recovery.js';
import {encodeWav} from './wav.js?v=0.14.0';
const button=document.getElementById('recordWorkspaceRecover');
const dialog=document.createElement('dialog');
dialog.className='recording-recovery-dialog';
dialog.setAttribute('aria-label','Récupération des prises inachevées');
const panel=document.createElement('section');
panel.className='recording-recovery-panel';
dialog.append(panel);
document.body.append(dialog);
let busy=false;
function element(tag,text,className){
  const el=document.createElement(tag);
  if(text!==undefined)el.textContent=text;
  if(className)el.className=className;
  return el;
}
function downloadWav(buffer,filename){
  const data=encodeWav(buffer,{bits:32});
  const url=URL.createObjectURL(new Blob([data],{type:'audio/wav'}));
  const a=element('a');
  a.href=url;a.download=filename;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function refresh(){
  panel.replaceChildren();
  const heading=element('h2','Récupération des prises');
  panel.append(heading,element('p','Les segments audio non finalisés sont conservés dans ce navigateur uniquement. Exporte-les en WAV avant de les supprimer.'));
  const close=element('button','Fermer');
  close.type='button';close.addEventListener('click',()=>dialog.close());
  panel.append(close);
  try{
    const recordings=await listRecoverableRecordings();
    if(!recordings.length){panel.append(element('p','Aucune prise à récupérer.'));return;}
    for(const item of recordings){
      const row=element('div',undefined,'recording-recovery-entry');
      const date=new Date(item.createdAt).toLocaleString('fr-FR');
      const title=element('strong',item.projectName+' · '+date);
      const description=element('span',item.channels+' canal(aux) · '+Math.round(item.sampleRate/1000)+' kHz');
      const exportButton=element('button','Exporter en WAV');
      exportButton.type='button';
      exportButton.addEventListener('click',async()=>{
        if(busy)return;busy=true;exportButton.disabled=true;exportButton.textContent='Récupération…';
        try{
          const recovered=await readRecoverableRecording(item.id);
          downloadWav(recovered.buffer,'WarLike-prise-recuperee-'+item.createdAt+'.wav');
          exportButton.textContent='WAV téléchargé';
        }catch(error){exportButton.textContent='Échec : '+error.message;}
        finally{busy=false;exportButton.disabled=false;}
      });
      const deleteButton=element('button','Supprimer la sauvegarde');
      deleteButton.type='button';
      deleteButton.addEventListener('click',async()=>{
        if(busy||!confirm('Supprimer définitivement cette prise de secours ? Vérifie ton export WAV avant.'))return;
        busy=true;deleteButton.disabled=true;
        try{await discardRecoverableRecording(item.id);await refresh();}
        catch(error){deleteButton.textContent='Erreur : '+error.message;}
        finally{busy=false;deleteButton.disabled=false;}
      });
      row.append(title,description,exportButton,deleteButton);
      panel.append(row);
    }
  }catch(error){panel.append(element('p','Stockage local indisponible : '+error.message));}
}
button?.addEventListener('click',async()=>{
  if(dialog.open)return;
  await refresh();dialog.showModal();
});

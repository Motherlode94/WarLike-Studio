import {findPluginControl} from './plugin-window-dom.js';

// Move the existing functional controls; listeners and per-window IDs survive.
export function mountPluginCommandBar({root,body,panel,trackName,slot,canUndo,canRedo,undo,redo,canEdit}){
  const element=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
  const bar=element('section','plugin-command-bar');bar.setAttribute('aria-label','Commandes du plugin');
  const owner=element('span','plugin-command-owner',trackName+' · '+slot);owner.title=owner.textContent;
  const primary=element('div','plugin-command-primary'),actions=element('div','plugin-command-actions');
  const presets=panel.querySelector('.suite-preset-bar');
  primary.append(owner,presets);bar.append(primary,actions);
  const control=name=>findPluginControl(panel,name);
  for(const name of ['pluginPresetPrevious','pluginPresetNext']){
    const button=control(name);button.setAttribute('aria-label',button.textContent.trim());button.title=button.textContent.trim();button.textContent=name==='pluginPresetPrevious'?'←':'→';actions.append(button);
  }
  panel.querySelector('[aria-label="Parcourir les presets d’usine"]')?.remove();
  const bypass=panel.querySelector('.float-bypass');if(bypass)actions.append(bypass);
  for(const name of ['pluginCompareA','pluginCompareB']){const button=control(name);if(button){button.title='Réglage '+name.at(-1)+' de cet insert';actions.append(button);}}
  const more=element('details','plugin-command-more'),summary=element('summary','','Plus'),menu=element('div','plugin-command-menu');
  more.append(summary,menu);
  const comparisonCopy=control('pluginCompareCopy');if(comparisonCopy)menu.append(comparisonCopy);
  panel.querySelector('[aria-label="Comparaison des réglages de ce plugin"]')?.remove();
  const historyButton=(direction,label,callback,enabled)=>{
    const button=element('button','outline-btn',label);button.type='button';button.dataset.pluginHistory=direction;
    button.title=label+' la dernière modification de ce plugin uniquement';button.setAttribute('aria-label',button.title);button.disabled=!enabled;button.onclick=callback;actions.append(button);
  };
  historyButton('undo','Annuler',undo,canUndo);historyButton('redo','Rétablir',redo,canRedo);
  menu.append(control('resetPlugin'));
  const library=element('details','plugin-preset-library'),libraryTitle=element('summary','','Mes presets et racks');library.append(libraryTitle);
  for(const section of [...panel.querySelectorAll(':scope > .suite-ab-controls,:scope > .suite-rack-actions')])library.append(section);
  panel.append(library);
  const libraryButton=element('button','outline-btn','Mes presets et racks');libraryButton.type='button';
  libraryButton.onclick=()=>{more.open=false;library.open=true;library.scrollIntoView({block:'nearest'});libraryTitle.focus();};menu.append(libraryButton);actions.append(more);
  // The visible controls cannot change parameters during capture or finalization.
  for(const type of ['click','change'])bar.addEventListener(type,event=>{if(event.target.closest('button,select')&&!canEdit()){event.preventDefault();event.stopImmediatePropagation();}},true);
  bar.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End','Enter',' '].includes(event.key)&&event.target.matches('button,select')&&!canEdit()){event.preventDefault();event.stopImmediatePropagation();}},true);
  more.addEventListener('keydown',event=>{if(event.key==='Escape'&&more.open){more.open=false;summary.focus();event.preventDefault();event.stopPropagation();}});
  panel.querySelector('.plugin-window-meta > strong')?.remove();
  // Each plugin opens in its own editor. The track rack is opt-in rather than
  // occupying a permanent sidebar in every instrument/effect window.
  const rack=body.querySelector('.track-rack-catalog');
  const drawer=element('details','plugin-rack-drawer');
  const rackToggle=element('summary','','Afficher le rack de piste');
  rackToggle.setAttribute('aria-label','Afficher ou masquer le rack de la piste');
  drawer.append(rackToggle);
  if(rack)drawer.append(rack);
  const surface=element('div','plugin-command-surface');
  surface.append(panel);
  body.replaceChildren(bar,drawer,surface);
  root.dataset.commandBar='common';
}

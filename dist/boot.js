function showStartupError(){
  if(document.documentElement.dataset.appReady==='true')return;
  const alert=document.getElementById('bootError');if(alert)alert.hidden=false;
  const status=document.getElementById('saveStatus');if(status)status.textContent='Studio non chargé';
}
window.addEventListener('error',showStartupError);
window.addEventListener('unhandledrejection',showStartupError);
document.getElementById('retryStudio')?.addEventListener('click',()=>location.reload());
try{await import('./app.js?v=0.11.1');}catch{showStartupError();}

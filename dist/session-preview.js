import {createFactorySession} from './content.js';

export function sessionPreviewPlan(id){
 const project=createFactorySession(id,true);
 const section=project.sections.find(s=>s.name.startsWith('REFRAIN'))||project.sections[0];
 const bars=Math.min(4,section.length,project.bars-section.start);
 if(!(bars>0))throw Error('Aucun extrait disponible.');
 return {id,name:project.name,section:section.name,bars,seconds:bars*240/project.bpm,
  startBar:section.start,endBar:section.start+bars,project};
}

// One audition at a time. Playback and rendering are injected so cancellation,
// cache ownership and late completions can be tested without an audio device.
export class SessionPreview{
 constructor({render,play,notify=()=>{},now=()=>0,plan=sessionPreviewPlan}){
  this.render=render;this.play=play;this.notify=notify;this.now=now;this.plan=plan;
  this.serial=0;this.cache=new Map();this.state=Object.freeze({status:'idle'});
 }
 setState(state){this.state=Object.freeze(state);this.notify(this.state);}
 stop(){
  this.serial++;this.abort?.abort();this.abort=null;
  const release=this.release;this.release=null;release?.stop();
  if(this.state.status!=='idle')this.setState({status:'idle'});
 }
 get elapsed(){return this.state.status==='playing'?Math.max(0,Math.min(this.state.seconds,this.now()-this.state.startedAt)):0;}
 async preview(id){
  this.stop();const token=this.serial,abort=new AbortController();this.abort=abort;
  try{
   const plan=this.plan(id),info={id,name:plan.name,section:plan.section,bars:plan.bars,seconds:plan.seconds};
   this.setState({...info,status:'preparing'});
   let buffer=this.cache.get(id);
   if(buffer){this.cache.delete(id);this.cache.set(id,buffer);}
   else{
    buffer=await this.render(plan,abort.signal);
    if(token!==this.serial||abort.signal.aborted)return false;
    this.cache.set(id,buffer);while(this.cache.size>2)this.cache.delete(this.cache.keys().next().value);
   }
   if(token!==this.serial||abort.signal.aborted)return false;
   let ended=false;
   const release=await this.play(buffer,()=>{
    ended=true;if(token!==this.serial)return;
    this.release=null;this.abort=null;this.setState({status:'idle'});
   },abort.signal);
   if(token!==this.serial||abort.signal.aborted||ended){release.stop();return false;}
   this.release=release;this.setState({...info,status:'playing',startedAt:release.startedAt});return true;
  }catch(error){
   if(token!==this.serial||abort.signal.aborted)return false;
   this.abort=null;this.setState({id,status:'error',message:error.message||'Préécoute indisponible.'});return false;
  }
 }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {installFloatingWindow} from '../dist/windows.js';
import {readGeometry,writeGeometry} from '../dist/workspace-layout-model.js';

// DOM-free host for the real window controller: CSS fitting is modeled separately
// from storage so viewport-driven changes cannot masquerade as user edits.
function host(t,saved){
 const names=['window','document','localStorage','innerWidth','innerHeight','getComputedStyle','ResizeObserver'];
 const previous=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 const memory=new Map(),storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
 class Node extends EventTarget{
  constructor(){super();this.hidden=false;this.dataset={};this.style={removeProperty(key){delete this[key];},setProperty(key,value){this[key]=value;}};this.attributes=new Map();const values=new Set();this.classList={contains:v=>values.has(v),add:v=>values.add(v),remove:v=>values.delete(v),toggle(v){if(values.has(v)){values.delete(v);return false;}values.add(v);return true;}};}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  append(){}
  remove(){}
 }
 const panel=new Node(),header=new Node(),toggle=new Node(),close=new Node();let resize;
 toggle.before=node=>resize=node;
 panel.querySelector=selector=>selector==='[data-float-minimize]'?toggle:selector==='[data-float-close]'?close:null;
 header.contains=()=>false;
 panel.getBoundingClientRect=()=>({left:parseFloat(panel.style.left)||0,top:parseFloat(panel.style.top)||0,width:Math.min(parseFloat(panel.style.width)||850,parseFloat(panel.style.maxWidth)||Infinity),height:panel.classList.contains('collapsed')?66:Math.min(parseFloat(panel.style.height)||600,parseFloat(panel.style.maxHeight)||Infinity)});
 Object.assign(globalThis,{window:new EventTarget(),document:{body:{dataset:{layoutProfile:'pt'}},head:new Node(),getElementById:()=>null,createElement:()=>new Node()},localStorage:storage,innerWidth:1440,innerHeight:960,getComputedStyle:()=>({position:'static',minWidth:'300px',minHeight:'85px'}),ResizeObserver:class{constructor(callback){this.callback=callback;}observe(){this.callback();}disconnect(){}}});
 const key='plugin:'+JSON.stringify(['test','glue']);if(saved)writeGeometry(storage,'pt',{[key]:saved});
 const controller=installFloatingWindow(panel,header,{key});controller.show();
 t.after(()=>{controller.dispose();for(const [name,descriptor] of previous){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}});
 return {controller,panel,toggle,stored:()=>readGeometry(storage,'pt')[key],viewport(width,height=960){globalThis.innerWidth=width;globalThis.innerHeight=height;window.dispatchEvent(new Event('resize'));},resize(key){const event=new Event('keydown',{cancelable:true});event.key=key;resize.dispatchEvent(event);}};
}
const large={x:100,y:60,width:1200,height:800};

test('closing a window fitted to a smaller desktop retains the desired geometry',t=>{
 const h=host(t,large);h.viewport(900);assert.equal(h.panel.getBoundingClientRect().width,884);
 h.controller.close();assert.deepEqual(h.stored(),large);
 h.viewport(1440);h.controller.show();assert.equal(h.panel.getBoundingClientRect().width,1200);assert.equal(h.panel.getBoundingClientRect().left,100);
});

test('minimizing a fitted window also retains the desired desktop geometry',t=>{
 const h=host(t,large);h.viewport(900);h.toggle.dispatchEvent(new Event('click'));
 assert.ok(h.panel.classList.contains('collapsed'));assert.deepEqual(h.stored(),large);
 h.toggle.dispatchEvent(new Event('click'));h.controller.close();assert.deepEqual(h.stored(),large);
});

test('explicit resize persists while automatic viewport fitting does not',t=>{
 const h=host(t,large);h.resize('ArrowLeft');const resized=h.stored();assert.equal(resized.width,1176);
 h.viewport(900);h.controller.close();assert.deepEqual(h.stored(),resized);
 h.viewport(1440);h.controller.show();assert.equal(h.panel.getBoundingClientRect().width,1176);
});

test('first opening saves a default position without needing a geometry edit',t=>{
 const h=host(t);const first=h.stored();assert.ok(first);h.viewport(900);h.controller.close();assert.deepEqual(h.stored(),first);
});

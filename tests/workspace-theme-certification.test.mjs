import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../dist/'+p,import.meta.url),'utf8');
const foundation=read('design-system/warlike-foundation.css');
const shell=read('design-system/warlike-shell.css');
const blocks=[...foundation.matchAll(/:root[^{}]*\{([^{}]+)\}/g)].map(m=>Object.fromEntries([...m[1].matchAll(/--wl-([\w-]+):\s*(#[\da-f]{6})(?=\s*[;}])/gi)].map(x=>[x[1],x[2]])));
function luminance(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('Foundation dark and light text contrast meets WCAG AA',()=>{
 assert.equal(blocks.length,2);
 for(const [i,overrides] of blocks.entries()){
 const p={...blocks[0],...overrides};
 for(const fg of ['text','text-muted'])for(const bg of ['bg','surface','surface-alt']){
 assert.ok(p[fg]&&p[bg]);assert.ok(ratio(p[fg],p[bg])>=4.5,`theme ${i}: ${fg}/${bg}`);
 }
 assert.ok(ratio(p.primary,p['primary-text'])>=4.5);
 }
});
test('shell resolves only declared Foundation tokens',()=>{
 const declared=new Set([...foundation.matchAll(/(--wl-[\w-]+)\s*:/g)].map(m=>m[1]));
 for(const [,token] of shell.matchAll(/var\((--wl-[\w-]+)/g))assert.ok(declared.has(token),token);
});
test('workspace theme rules retain shared surfaces and focus',()=>{
 const rules=[...shell.matchAll(/([^{}]+)\{([^{}]+)\}/g)];
 for(const selector of ['.track-lane','.pr-grid','.mixer-channel','.rack-channel','.fl-mixer-effects','.pt-send-bank','.signature-workspaces']){
 assert.ok(rules.some(([,s,d])=>s.includes(selector)&&s.includes('.reference-studio')&&/background(?:-color)?:\s*var\(--wl-/.test(d)&&/color:\s*var\(--wl-text\)/.test(d)),selector);
 }
 for(const selector of ['.pr-toolbar','.rack-toolbar','.mixer-channel'])assert.ok(rules.some(([,s,d])=>s.includes(selector)&&s.includes(':focus-visible')&&d.includes('var(--wl-focus)')),selector);
});

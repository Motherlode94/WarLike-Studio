import test from 'node:test';
import assert from 'node:assert/strict';
import {menuShortcut} from '../dist/app-menus.js';

const event=(key,extra={})=>({key,ctrlKey:true,metaKey:false,altKey:false,isComposing:false,repeat:false,...extra});

test('file shortcuts are delegated only for new and open',()=>{
 assert.equal(menuShortcut(event('n')),'new');
 assert.equal(menuShortcut(event('O')),'open');
 assert.equal(menuShortcut(event('s')),null,'Main Studio owns Ctrl+S: no duplicate export');
 for(const key of ['x','c','v','z','d','y'])assert.equal(menuShortcut(event(key)),null,'Main Studio owns editing key '+key);
});
test('menu shortcuts ignore Alt chords, repeats and composition',()=>{
 assert.equal(menuShortcut(event('n',{altKey:true})),null);
 assert.equal(menuShortcut(event('n',{repeat:true})),null);
 assert.equal(menuShortcut(event('n',{isComposing:true})),null);
 assert.equal(menuShortcut(event('n',{ctrlKey:false})),null);
 assert.equal(menuShortcut(event('o',{ctrlKey:false,metaKey:true})),'open');
});

import {menuSpecs,menuPosition} from '../dist/app-menus.js';
test('hierarchical menus retain every existing command exactly once',()=>{
 const actions=menuSpecs.flatMap(([, ,groups])=>groups.flatMap(([,items])=>items.map(([id])=>id)));
 assert.deepEqual(actions.sort(),['new','open','save','import','export','undo','redo','cut','copy','paste','duplicate','delete'].sort());
});
test('submenu flips at right edge and clamps bottom',()=>{
 assert.deepEqual(menuPosition({left:700,right:790,top:550,bottom:580},190,200,800,600,true),{left:510,top:396});
 assert.deepEqual(menuPosition({left:10,right:80,top:10,bottom:30},190,200,800,600),{left:10,top:30});
});

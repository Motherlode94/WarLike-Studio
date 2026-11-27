import test from 'node:test';import assert from 'node:assert/strict';
import {sidebarPath,sidebarMatches} from '../dist/sidebar-browser.js';
import {pluginTree} from '../dist/plugin-picker.js';import {INSTRUMENTS,EFFECTS} from '../dist/plugins.js';
test('sidebar and insertion picker use the same collection and family identity for every module',()=>{
 for(const [id,def] of Object.entries({...INSTRUMENTS,...EFFECTS})){const [bundle,categories]=[...pluginTree([[id,def]])][0];assert.deepEqual(sidebarPath(id,def),[bundle,[...categories.keys()][0]]);}
});
test('browser search matches separated terms, accents, source and preset metadata',()=>{
 assert.equal(sidebarMatches('reverbe usine','Réverbe','Usine'),true);assert.equal(sidebarMatches('vector voix','VECTOR','Voix'),true);assert.equal(sidebarMatches('vector voix','VECTOR','Drums'),false);assert.equal(sidebarMatches(''),true);
});

test('guitar, bass and vocal families describe the instrument rather than a generic synthesizer',()=>{
 assert.deepEqual(sidebarPath('wlsteel',INSTRUMENTS.wlsteel),['WLGUITARS','Guitares']);assert.equal(sidebarPath('bass',INSTRUMENTS.bass)[1],'Basses');assert.equal(sidebarPath('wlvox',INSTRUMENTS.wlvox)[1],'Voix synthétique');
});

// Measured on four-bar choruses rendered through the production audio engine.
// These are editable starting gains, not a claim about whole-song LUFS.
// Applied by new-demo builders only; never during project load or playback.
export const FACTORY_DEMO_DRIVE=Object.freeze({
 nocturne:2.5,soleil:7.5,brume:9.75,'trap-abyss':6.5,'trap-enigma':9.25,
 'rnb-2005':10,'popstar-2008':9.75,'etoiles-interdites':12.25,
 'derriere-les-murs':15.5,'un-dernier-soleil':10,'au-bord-du-ciel':7,
 'promesses-de-pluie':11,rives:2.75,pluie:4.75,horizon:5,eclats:1.75,kin:8.75,lumiere:3
});
export const PUBLIC_DEMO_DRIVE=Object.freeze({"drill":0.75,"trap808":0,"trap-air":0,"funk":4.5,"rock":7.25,"pop":15.5,"rumba":22.25,"trap":4.75,"afro":1.75,"rnb":2.75,"vox-trap":0.5,"vox-afro":1.75,"vox-rnb":2.75});

export function setDemoPlaybackLevel(project,id,family='factory') {
 const profiles=family==='factory'?FACTORY_DEMO_DRIVE:PUBLIC_DEMO_DRIVE;
 if(!(family==='factory'?project?.demo&&project.fullSong:project?.publicDemo)||!Object.hasOwn(profiles,id))return project;
 const profile=family+':'+id;
 if(project.demoLevelProfile===profile)return project;
 if(!project.mastering?.peak?.enabled||!project.mastering.inserts.includes('peak'))throw Error('Le niveau de démo exige le limiteur Master actif.');
 project.masterVolume=0;
 project.mastering.peak.drive=profiles[id];
 project.demoLevelProfile=profile;
 return project;
}

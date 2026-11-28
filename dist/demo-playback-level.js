// Measured on four-bar choruses rendered through the production audio engine.
// These are editable starting gains, not a claim about whole-song LUFS.
// Applied by new-demo builders only; never during project load or playback.
export const FACTORY_DEMO_DRIVE=Object.freeze({"nocturne":10,"soleil":12.25,"brume":13.75,"trap-abyss":12.5,"trap-enigma":14.75,"rnb-2005":14.5,"popstar-2008":16.75,"etoiles-interdites":20.5,"derriere-les-murs":21,"un-dernier-soleil":17.5,"au-bord-du-ciel":11.75,"promesses-de-pluie":15.5,"rives":9,"pluie":9.75,"horizon":10.75,"eclats":8.75,"kin":15.25,"lumiere":10});
export const PUBLIC_DEMO_DRIVE=Object.freeze({"drill":9,"trap808":7.5,"trap-air":6.25,"funk":12.25,"rock":17.25,"pop":24,"rumba":24,"trap":11,"afro":9.75,"rnb":10.75,"vox-trap":8.25,"vox-afro":9.75,"vox-rnb":10.75});

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

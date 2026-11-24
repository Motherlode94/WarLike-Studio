// Per-genre instrument and master racks. Real Studio processors only.
// Keep templates declarative: mix-master-templates validates all parameters
// and applies in a transaction, without embedding plugin editors in the rack.
const template=(id,genre,category,label,description,stages)=>({
 id:'genre-'+id,genre,category,name:genre.toUpperCase()+' / '+label,description,
 stages:stages.map(([id,values])=>({id,values}))
});
const inst=(id,g,label,description,eq,comp,space)=>template(id,g,'Instruments',label,description,[
 ['circuiteq',eq],['vectorcomp',comp],['exospace',{mix:space}]
]);
const master=(id,g,label,description,eq,comp,limit)=>template(id,g,'Master',label,description,[
 ['vectoreq',eq],['circuitbus',comp],['vectorlimit',{ceiling:-1,drive:limit}]
]);
export const GENRE_INSTRUMENT_TEMPLATES=Object.freeze([
 inst('trap-instruments','Trap','808 / SYNTH','Basse 808 nette et synthés sans bas-médium encombré.',
  {body:-1,presence:1},{threshold:-17,ratio:2.5,attack:22,release:160,mix:.7},.10),
 inst('drill-instruments','Drill','DRUMS / 808','Attaque sèche et grave compact pour drill.',
  {body:-1.5,presence:1.5},{threshold:-19,ratio:2.6,attack:26,release:145,mix:.75},.08),
 inst('afro-instruments','Afrobeat','GUITARES / PERC','Guitares vives et percussions ouvertes.',
  {body:-1,presence:1},{threshold:-18,ratio:1.8,attack:32,release:170,mix:.65},.13),
 inst('amapiano-instruments','Amapiano','LOG DRUM / KEYS','Préserve les impacts et la profondeur du log drum.',
  {body:.5,presence:.5},{threshold:-17,ratio:1.5,attack:38,release:210,mix:.6},.12),
 inst('rnb-instruments','R&B','KEYS / PAD','Claviers doux et textures profondes.',
  {body:-.5,air:1},{threshold:-20,ratio:1.7,attack:36,release:240,mix:.65},.23),
 inst('rock-instruments','Rock','GUITAR / DRUMS','Guitares présentes et batterie expressive.',
  {body:-1,presence:1.5},{threshold:-18,ratio:2.5,attack:30,release:150,mix:.8},.09),
 inst('pop-instruments','Pop','KEYS / GROOVE','Instruments clairs au centre du mix.',
  {body:-.5,air:1.5},{threshold:-18,ratio:2,attack:28,release:160,mix:.7},.16),
 inst('rumba-instruments','Rumba','GUITARES / SEBENE','Guitares rythmiques, articulation et espace léger.',
  {body:-1.5,presence:2},{threshold:-19,ratio:2,attack:28,release:140,mix:.65},.12),
 inst('funk-instruments','Funk','BASS / GUITAR','Conserve l’attaque rythmique du groove.',
  {body:.5,presence:1.5},{threshold:-20,ratio:2,attack:40,release:130,mix:.65},.08),
 inst('gospel-instruments','Gospel','PIANO / ORGUE','Claviers et accompagnement chaleureux.',
  {body:.5,air:1},{threshold:-18,ratio:1.6,attack:40,release:250,mix:.6},.22),
 inst('dance-instruments','Dance','SYNTH / PULSE','Synthés et percussions contrôlés pour la danse.',
  {body:-.5,presence:1},{threshold:-18,ratio:2.4,attack:20,release:150,mix:.75},.18),
 inst('soul-instruments','Soul','KEYS / GUITAR','Chaleur et dynamique douce sur les instruments.',
  {body:1,air:.5},{threshold:-20,ratio:1.6,attack:40,release:260,mix:.6},.20)
]);
export const GENRE_MASTER_TEMPLATES=Object.freeze([
 master('trap-master','Trap','MASTER','Bas contrôlé, crêtes bornées.',{g1:-.5,g5:.5},{threshold:-15,ratio:2,attack:30,release:145,mix:.75},1),
 master('drill-master','Drill','MASTER','Basse précise et dynamique conservée.',{g1:-.5,g4:.5},{threshold:-16,ratio:2,attack:28,release:135,mix:.75},1),
 master('afro-master','Afrobeat','MASTER','Groove aéré et punch naturel.',{g1:-.25,g5:.5},{threshold:-14,ratio:1.6,attack:36,release:210,mix:.7},.5),
 master('amapiano-master','Amapiano','MASTER','Log drum et profondeur sans surcompression.',{g1:-.25,g4:.25},{threshold:-13,ratio:1.5,attack:40,release:230,mix:.65},.5),
 master('rnb-master','R&B','MASTER','Dynamique douce et brillance maîtrisée.',{g1:-.4,g5:.4},{threshold:-14,ratio:1.6,attack:38,release:220,mix:.7},.75),
 master('rock-master','Rock','MASTER','Cohésion des instruments sans écraser les attaques.',{g1:-.4,g4:.5},{threshold:-16,ratio:2,attack:30,release:160,mix:.8},1),
 master('pop-master','Pop','MASTER','Équilibre et niveau final modéré.',{g1:-.5,g5:.6},{threshold:-15,ratio:1.8,attack:34,release:180,mix:.75},1),
 master('rumba-master','Rumba','MASTER','Préserve les guitares et la respiration du morceau.',{g1:-.4,g4:.4},{threshold:-13,ratio:1.5,attack:40,release:230,mix:.65},.5),
 master('funk-master','Funk','MASTER','Préserve l’attaque du groove et la basse.',{g1:-.25,g4:.5},{threshold:-14,ratio:1.6,attack:40,release:180,mix:.65},.6),
 master('gospel-master','Gospel','MASTER','Préserve la dynamique des voix et du piano.',{g1:-.25,g5:.4},{threshold:-13,ratio:1.5,attack:42,release:260,mix:.6},.5),
 master('dance-master','Dance','MASTER','Énergie maîtrisée et plafond conservateur.',{g1:-.5,g5:.5},{threshold:-16,ratio:2.2,attack:28,release:150,mix:.8},1.5),
 master('soul-master','Soul','MASTER','Chaleur, transitoires souples et profondeur.',{g1:-.25,g4:.4},{threshold:-13,ratio:1.5,attack:44,release:260,mix:.6},.5)
]);

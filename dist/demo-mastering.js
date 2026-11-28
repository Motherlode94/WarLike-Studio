import {masteringSettings} from './mastering.js?v=0.15.12';
// Conservative starting points, not measured loudness targets.
const profiles={
 trap:[25,.25,.25,.75,-18,1.8,30,150,.5,2,.12,1,-1.5,120],
 drill:[27,-.25,.5,.5,-18,2,25,140,.5,2.5,.15,1,-1.5,110],
 afro:[24,.25,-.25,.75,-17,1.5,35,220,.25,1.5,.1,.5,-1.5,150],
 rnb:[25,.25,-.5,.75,-18,1.4,45,350,.25,1.5,.12,.5,-1.5,180],
 funk:[28,0,.5,.25,-17,1.7,25,130,.25,2,.12,.75,-1.5,120],
 rock:[28,0,.5,.5,-17,2,35,180,.5,2.5,.15,.75,-1.5,140],
 pop:[25,0,.25,1,-18,1.6,30,200,2.25,1.5,.1,.75,-1.5,150],
 rumba:[24,.25,-.25,.5,-16,1.4,40,260,3.75,1.5,.1,.5,-1.5,180]
};
const aliases={'trap808':'trap','trap-air':'trap','vox-trap':'trap','vox-afro':'afro','vox-rnb':'rnb'};
export function demoMasteringSettings(kind){
 const values=profiles[aliases[kind]||kind];if(!Array.isArray(values))return null;
 const [cut,low,mid,high,threshold,ratio,attack,release,makeup,drive,mix,limitDrive,ceiling,limitRelease]=values;
 return masteringSettings({inserts:['balance','press','circuitcolor','peak'],bypass:false,
 balance:{enabled:true,cut,low,mid,high},
 press:{enabled:true,threshold,ratio,attack,release,makeup},
 circuitcolor:{enabled:true,drive,mix,bias:.08,tone:16000,output:0},
 peak:{enabled:true,drive:limitDrive,ceiling,release:limitRelease}});
}
export function masterPublicDemo(p,kind){
 if(!p?.publicDemo||p.demoMasteringRevision===1)return p;
 const settings=demoMasteringSettings(kind);if(!settings)return p;
 // The public Trap session contains recorded lead + derived doubles/adlibs.
 // Keep the native limiter active, but avoid additional saturation stages
 // when these sources enter on top of the existing 808 and drums.
 if(kind==='trap'&&p.vocalDemo){
  if(settings.circuitcolor)Object.assign(settings.circuitcolor,{drive:0,mix:0});
  if(settings.press)Object.assign(settings.press,{makeup:0,ratio:1.6});
  if(settings.peak)Object.assign(settings.peak,{drive:0,ceiling:-1.5});
 }
 p.mastering=settings;p.demoMasteringRevision=1;return p;
}

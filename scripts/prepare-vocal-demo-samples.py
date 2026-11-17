#!/usr/bin/env python3
"""Rebuild the licensed human vocal excerpts. Requires ffmpeg + numpy.
Inputs are original MP3s downloaded separately from the documented source URLs.
No speech synthesis, voice cloning or replacement of the backing arrangements.
"""
import argparse, hashlib, json, subprocess, tempfile
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SOURCES={
 'trap':dict(title='This Beat (A Cappella)',artist='Donnie Ozone',year=2013,url='https://ccmixter.org/files/donnieozone/41083',download='https://ccmixter.org/content/donnieozone/donnieozone_-_This_Beat_(A_Cappella).mp3',sha256='0750db32e4fdca548b334c732c6a09a4f361a76a2db8d2080aca52eb34df5167',sourceBpm=93,targetBpm=138,tempo=69/93,pitchSemitones=0,sourceBars=2,starts=[480/93,960/93,2400/93],targetKey='Fa♯ mineur (rap non mélodique)'),
 'afro':dict(title='Put your Hands Up (Acapella)',artist='Andres Franco feat. Miss Muffin and Jhonblack',year=2009,url='https://ccmixter.org/files/andrewfranco/23076',download='https://ccmixter.org/content/andrewfranco/andrewfranco_-_Put_your_Hands_Up_(Acapella).mp3',sha256='be636be6c997130f5bc82c8ef1a7ecd338a482c85a86f0ac2a0f2d07aea107c2',sourceBpm=95,targetBpm=108,tempo=108/95,pitchSemitones=-4,sourceBars=4,starts=[1920/95,2880/95,0],targetKey='Ré majeur / Si mineur'),
 'rnb':dict(title='[Rhiannon] Venom Acapella — Main Vocals',artist='Rhiannon Delpero (SizzleFly), WolfFly / Ascension',year=2011,url='https://ccmixter.org/files/ascension/30636',download='https://ccmixter.org/content/ascension/ascension_-_Rhiannon_Venom_Acapella_1.mp3',sha256='6b5d249c744276bed956c80fd0c32f1209635a88900921c00700a0cd67bc95a4',sourceBpm=85.1,targetBpm=84,tempo=84/85.1,pitchSemitones=3,sourceBars=4,starts=[24.67,24.67+960/85.1,24.67+1920/85.1],targetKey='Do mineur')
}
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=Path,required=True);args=parser.parse_args()
 output=ROOT/'dist/samples/vocals';output.mkdir(parents=True,exist_ok=True);manifest={}
 for style,definition in SOURCES.items():
  source=args.source_dir/(style+'.mp3');raw=source.read_bytes()
  if hashlib.sha256(raw).hexdigest()!=definition['sha256']:raise ValueError('Unexpected source: '+style)
  target=960/definition['targetBpm'];parts=[]
  for section,start in zip(['verse-a','verse-b','chorus'],definition['starts']):
   length=definition['sourceBars']*240/definition['sourceBpm']
   filters=f"rubberband=tempo={definition['tempo']}:pitch={2**(definition['pitchSemitones']/12)}:formant=preserved,highpass=f=80,lowpass=f=15000,apad,atrim=duration={target}"
   pcm=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-t',str(length),'-i',str(source),'-af',filters,'-ac','1','-ar','44100','-f','f32le','-'])
   samples=np.frombuffer(pcm,dtype='<f4').copy();rms=float(np.sqrt(np.mean(samples*samples)));peak=float(np.max(abs(samples)))
   if not np.isfinite(samples).all() or rms<.005:raise ValueError('Silent/invalid vocal: '+style+'/'+section)
   samples*=min(.14/rms,.82/max(peak,1e-9))
   fade=min(441,len(samples)//10);samples[:fade]*=np.linspace(0,1,fade);samples[-fade:]*=np.linspace(1,0,fade)
   file=output/(style+'-'+section+'.mp3')
   subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','44100','-ac','1','-i','-','-c:a','libmp3lame','-b:a','128k','-map_metadata','-1','-metadata','title='+definition['title']+' — '+section,'-metadata','artist='+definition['artist'],'-metadata','copyright=CC BY 3.0; '+definition['url'],'-metadata','comment=WarLike demo adaptation: excerpt, tempo/pitch adjustment, filtering, gain and fades; CC BY 3.0 https://creativecommons.org/licenses/by/3.0/',str(file)],input=samples.astype('<f4').tobytes(),check=True)
   data=file.read_bytes();parts.append(dict(section=section,file=file.name,seconds=round(target,8),bars=4,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),sourceStartSeconds=round(start,8),sourceLengthSeconds=round(length,8),rms=round(float(np.sqrt(np.mean(samples*samples))),6),peak=round(float(np.max(abs(samples))),6)))
  manifest['vox-'+style]={**{k:v for k,v in definition.items() if k!='starts'},'license':'CC BY 3.0','licenseUrl':'https://creativecommons.org/licenses/by/3.0/','language':'en','humanRecording':True,'adaptation':'Extraits, adaptation du tempo et de la hauteur avec conservation des formants, filtrage, gain et fondus. Les doublures/réponses dans la session sont dérivées du lead, pas de nouvelles prises.','parts':parts}
 (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({style:{'files':len(x['parts']),'bytes':sum(p['bytes'] for p in x['parts'])} for style,x in manifest.items()}))
if __name__=='__main__':main()

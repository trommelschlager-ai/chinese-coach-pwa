"""Cut the existing indexed recordings; never synthesize or substitute phrases."""
import json, re, subprocess, pathlib, concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1]
source=(root/'assets/hsk2-user-voice/phrase-index-v332.js').read_text()
clips=json.loads(re.search(r'const clips=(\[.*?\]);', source, re.S).group(1))
out=root/'assets/panda-voice-clips-v365';out.mkdir(exist_ok=True)
def cut(pair):
 i,c=pair;src=root/'assets/hsk2-user-voice'/c['file']
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(src)]))
 assert 0<=c['start']<c['end']<=duration, c
 name=f'p{i:03d}.mp3'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-ss',str(c['start']),'-t',str(c['end']-c['start']),'-map_metadata','-1','-c:a','libmp3lame','-q:a','2',str(out/name)],check=True)
 return dict(c,src='./assets/panda-voice-clips-v365/'+name)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: result=list(pool.map(cut,enumerate(clips,1)))
(root/'assets/panda-voice-clips-v365.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(root/'assets/panda-voice-clips-v365.mjs').write_text('// Exact indexed source cuts. Transcript alignment inherits v332; no synthesized audio.\nexport const PANDA_CLIPS='+json.dumps(result,ensure_ascii=False)+';\n')
print(f'Built {len(result)} source clips; all ranges within source duration.')

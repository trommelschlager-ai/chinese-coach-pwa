"""Generate optional local Mandarin previews using the course's existing Edge-TTS workflow.
Existing character recordings are unchanged. These evaluation previews need a licensed
replacement before commercial distribution, like the other existing course previews.
"""
import ast, asyncio, hashlib, json, pathlib, re, subprocess
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/hanzi-phrases-v141'
html=(ROOT/'hanzi-lab.html').read_text()
phrases=[]
for name in ('pgSentences','pgExamples'):
    data=ast.literal_eval(re.search(r'const '+name+r'=({.*?});',html,re.S).group(1))
    for rows in data.values():
        for row in rows:
            if row[0] not in phrases: phrases.append(row[0])
VOICE='zh-CN-XiaoxiaoNeural'
async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    sem=asyncio.Semaphore(2)
    async def generate(text):
        async with sem:
            file=hashlib.sha256(text.encode()).hexdigest()[:16]+'.mp3'
            path=OUT/file
            if path.exists() and path.stat().st_size>1500:
                duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
                if .2<duration<15:
                    return text,'assets/hanzi-phrases-v141/'+file
            for attempt in range(3):
                try:
                    await asyncio.wait_for(edge_tts.Communicate(text,voice=VOICE,rate='-5%').save(str(path)),timeout=40)
                    seconds=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
                    if path.stat().st_size<1500 or not .2<seconds<15: raise ValueError('Invalid MP3')
                    print('OK',text,file,flush=True)
                    return text,'assets/hanzi-phrases-v141/'+file
                except Exception:
                    if attempt==2: raise
                    await asyncio.sleep(1)
    pairs=await asyncio.gather(*(generate(text) for text in phrases))
    mapping=dict(pairs)
    (ROOT/'assets/hanzi-phrases-v141.js').write_text('window.PANDA_HANZI_PHRASE_AUDIO='+json.dumps(mapping,ensure_ascii=False,indent=2)+';\n')
    (OUT/'manifest.json').write_text(json.dumps({'voice':VOICE,'source':'Existing course Edge Read Aloud evaluation workflow','commercialUse':'Replace with licensed production speech before commercial distribution.','phrases':mapping},ensure_ascii=False,indent=2))
asyncio.run(main())

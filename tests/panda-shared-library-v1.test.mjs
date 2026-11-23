import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkSharedPandaManifest,createPandaSharedLibrary,PANDA_SHARED_DB} from '../assets/panda-shared-library-v1.mjs';
import {PANDA_MEMORY_DB} from '../assets/panda-offline-memory-v1.mjs';

const manifest=JSON.parse(readFileSync(new URL('../assets/panda-shared-library/manifest-v1.json',import.meta.url),'utf8'));
const copy=()=>structuredClone(manifest);

test('Shared course pack is manually reviewed, versioned and contains no learner data',()=>{
 const checked=checkSharedPandaManifest(manifest);
 assert.equal(checked.release,1);
 assert.equal(checked.entries.length,3);
 assert.ok(checked.entries.every(e=>e.voiceId==='voice-093'&&e.reviewRef.startsWith('reviewed:')));
 assert.ok(checked.entries.every(e=>!('userId' in e)&&!('history' in e)&&!('transcript' in e)));
 assert.notEqual(PANDA_SHARED_DB,PANDA_MEMORY_DB,'Shared and private IndexedDB must be separate');
 assert.ok(Object.isFrozen(checked.entries));
});
test('Only pre-reviewed exact examples may enter the public library',()=>{
 const mutation=copy();mutation.entries[0].answer='我不喜欢喜剧片。';
 assert.throws(()=>checkSharedPandaManifest(mutation),/reviewed source/);
 const leaked=copy();leaked.entries[0].studentId='my-student';
 assert.throws(()=>checkSharedPandaManifest(leaked),/Extra or missing course/);
 const stranger=copy();stranger.entries[0].id='unknown-dialogue';
 assert.throws(()=>checkSharedPandaManifest(stranger),/approved/);
 const mp3=copy();mp3.entries[0].src='https://cdn.luvvoice.com/temporary.mp3';
 assert.throws(()=>checkSharedPandaManifest(mp3),/reviewed source/);
 const fakeVoice=copy();fakeVoice.entries[0].voiceId='male-panda-street';
 assert.throws(()=>checkSharedPandaManifest(fakeVoice),/reviewed source/);
});
test('Release IDs and unique phrases reject rollback-compatible malformed packs',()=>{
 const invalid=copy();invalid.release=0;
 assert.throws(()=>checkSharedPandaManifest(invalid),/release/);
 const duplicate=copy();duplicate.entries.push(duplicate.entries[0]);
 assert.throws(()=>checkSharedPandaManifest(duplicate),/Duplicate/);
 const lang=copy();lang.language='en-US';
 assert.throws(()=>checkSharedPandaManifest(lang),/language/);
 const meta=copy();meta.studentHistory=[];
 assert.throws(()=>checkSharedPandaManifest(meta),/metadata/);
});
test('No local IndexedDB means no false claim that a shared pack was saved',async()=>{
 const library=createPandaSharedLibrary({database:null,baseUrl:'https://trommelschlager-ai.github.io/chinese-coach-pwa/'});
 await assert.rejects(library.installedRelease(),/IndexedDB unavailable/);
 await assert.rejects(library.recall({topic:'movies',trigger:'我想看喜剧片。'}),/IndexedDB unavailable/);
});

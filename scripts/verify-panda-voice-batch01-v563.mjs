// Explicit preflight: no changes to runtime registry or cache.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const manifest=JSON.parse(readFileSync(new URL('../docs/panda-voice-batch01-v563-staged.json',import.meta.url),'utf8'));
const dir=process.argv[2];
assert.equal(manifest.items.length,12);
assert.equal(new Set(manifest.items.map(x=>x.zh)).size,12);
const errors=[];
for(const x of manifest.items){const path=dir?resolve(dir,x.id+'.mp3'):new URL('../'+x.src.slice(2),import.meta.url);if(!existsSync(path)){errors.push(x.id+' missing');continue;}const b=readFileSync(path);if(b.length!==x.bytes||createHash('sha256').update(b).digest('hex')!==x.sha256)errors.push(x.id+' hash or size mismatch');}
assert.deepEqual(errors,[],'Batch incomplete; do not activate registry');console.log('12/12 MP3 hashes match staged manifest; listening and browser QA still required.');

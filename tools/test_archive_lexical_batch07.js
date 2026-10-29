'use strict';
// An index expansion cannot silently create historical or grammatical evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const M=JSON.parse(read('research/batches/classical_archive_lexical_batch07_2026_10_29.json'));
const D=JSON.parse(read('dictionary.json')),R=JSON.parse(read('release.json'));
assert.equal(M.entries.length,1664);assert.equal(R.headwords,2142);assert.equal(D.words.length,2142);
assert.equal(D.version,R.version);assert.equal(D.version,M.version);
const index=new Map(D.words.map(w=>[w.word,w]));assert.equal(index.size,D.words.length);
const rows=[0,1,2,3].map(n=>JSON.parse(read('research/amoxcalli_archive/kaikki_0'+n+'.json')).rows);
const provisional='Archive-indexed; lexical review pending';let pos={};
for(const item of M.entries){
 const row=rows[item.shard][item.row];
 assert.deepEqual(row.slice(0,3),[item.source_word,item.pos,'nci']);
 assert(row[3].some(s=>s[0]?.[0]===item.gloss&&JSON.stringify(s[2])===JSON.stringify(item.tags)),item.word);
 const w=index.get(item.word);
 assert(w&&w.status===provisional&&w.pos===item.pos+' (provisional archive index)',item.word);
 assert.equal(w.meaning,item.gloss);assert.equal(w.original,item.word===item.source_word?'':item.source_word);
 assert.equal(w.stem,'');assert.equal(w.plural,'');assert.equal(w.possessed,'');
 assert.equal(w.animacy,'not_applicable');assert.equal(w.number,'not_applicable');assert.deepEqual(w.inflections,[]);
 assert.deepEqual(w.claims.map(c=>[c.field,c.assessment]),[['headword','inference'],['meaning','inference'],['pos','inference'],['stem','unverified']]);
 for(const c of w.claims)if(c.assessment!=='unverified')assert(c.locator.includes('shard '+item.shard+', row '+item.row));
 pos[item.pos]=(pos[item.pos]||0)+1;
}
assert.deepEqual(pos,M.by_pos);
assert.equal(D.words.filter(w=>w.status==='Checked against source').length,187);
assert.equal(D.words.filter(w=>w.status===provisional&&w.pos.startsWith('verb')).length,225);
assert.equal(D.words.reduce((n,w)=>n+w.inflections.length,0),305);
assert.equal(Object.keys(JSON.parse(read('paradigms.json')).paradigms).length,12);
const context={window:{},URL};vm.runInNewContext(read('translator-engine.js'),context,{filename:'translator-engine.js'});
const model=context.window.TlahtolliTranslator.create(D,{entries:[]}),noun=M.entries.find(x=>x.pos==='noun');
const reading=model.analyze(noun.word);
assert.equal(reading.stats.provisional,1);assert.equal(reading.stats.matched,0);assert.equal(reading.stats.unknown,1);
assert.match(reading.gloss,/unreviewed archive index gloss/);
assert.equal(model.lookup(noun.word).candidates[0].evidence,'archive-index');
console.log('PASS: Batch 07 frozen archive source rows and nonproductive uncertainty firewall');

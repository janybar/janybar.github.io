const assert=require('node:assert/strict');
const {ARTWORKS,makeArt}=require('../coloring/art.js'),core=require('../coloring/core.js');
assert.equal(new Set(ARTWORKS.map(a=>a.id)).size,12);
for(const info of ARTWORKS){
 const art=makeArt(info.id),s=core.createSession(art);
 assert.ok(art.regions.length>25);
 assert.equal(new Set(art.regions.map(r=>r.id)).size,art.regions.length);
 for(const r of art.regions){assert.ok(r.color>=0&&r.color<art.palette.length);assert.ok(Number.isFinite(r.x)&&Number.isFinite(r.y));assert.ok(r.d.endsWith('Z'));}
 const original=core.serialize(s);const wrong=art.regions.find(r=>r.color!==s.selected);
 assert.equal(core.paint(art,s,wrong.id).status,'wrong');assert.equal(s.filled.size,0);
 const first=art.regions.find(r=>r.color===s.selected);assert.equal(core.paint(art,s,first.id).status,'painted');
 assert.equal(core.paint(art,s,first.id).status,'ignored');
 const restored=core.createSession(art,core.serialize(s));assert.deepEqual([...restored.filled],[...s.filled]);
 assert.equal(core.createSession(art,{...original,artId:'other',filled:[0]}).filled.size,0);
 assert.equal(core.createSession(art,{...original,filled:[-1,999,0,0,'2']}).filled.size,1);
 while(s.selected!==null){const r=art.regions.find(r=>r.color===s.selected&&!s.filled.has(r.id));assert.ok(r);core.paint(art,s,r.id);}
 assert.equal(s.filled.size,art.regions.length);assert.ok(core.counts(art,s).every(n=>n===0));
}
assert.equal(core.dailyId(ARTWORKS,'2026-11-10'),core.dailyId(ARTWORKS,'2026-11-10'));
assert.deepEqual(core.clampView({scale:3,x:999,y:-999},100,100),{scale:3,x:0,y:-200});
assert.equal(core.contrast('#ffffff'),'#263d3b');assert.equal(core.contrast('#000000'),'#ffffff');
console.log('All 12 colouring pages: palette rules, full completion, restore validation, daily selection and zoom limits passed');

const assert=require('node:assert/strict');
const Z=require('../zen/core.js'),L=require('../zen/levels.js');
const crypto=require('node:crypto');
const previous=JSON.stringify(Array.from({length:140},(_,i)=>L.createLevel(i+1)));
assert.equal(crypto.createHash('sha256').update(previous).digest('hex'),'d38be1b8a57bbffb08fe9c979b4a5195154d769e8b855802c32b8f2186104e66','Existing levels must remain compatible with saved sessions');
assert.equal(L.totalLevels,240);assert.equal(L.chapters.length,12);
const names=new Set();
for(let number=121;number<=L.totalLevels;number++){
 const level=L.createLevel(number);names.add(level.patternName);assert.equal(level.chapter,Math.floor((number-1)/20));assert.equal(level.index,(number-1)%20);assert.equal(level.title,L.chapters[level.chapter].title);assert.ok(level.patternDescription.length>15);assert.ok(level.nodes.length>=10&&level.nodes.length<=100);
 assert.deepEqual(level,L.createLevel(number));assert.equal(new Set(level.nodes.map(n=>n.id)).size,level.nodes.length);
 for(const n of level.nodes){assert.ok(n.x-n.r>=0&&n.x+n.r<=600&&n.y-n.r>=0&&n.y+n.r<=800,`${number}: out of bounds ${n.id}`);if(n.parent)assert.ok(level.nodes.some(p=>p.id===n.parent));}
 const free=Z.roots(level);
 for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)assert.ok(!Z.overlap(free[i],free[j]),`${number}: overlapping ${free[i].id}/${free[j].id}`);
 const answer=Z.solve(level);assert.equal(answer.status,'solved','No solution: '+number);let state=level;for(const step of answer.path){state=Z.action(state,step).state;}assert.ok(Z.won(state));
 for(const guide of level.guides||[])assert.ok(guide.ids.every(id=>level.nodes.some(n=>n.id===id)));
}
assert.equal(names.size,20);
assert.equal(L.createLevel(120).chapter,5);assert.equal(L.createLevel(99999).number,240);
// Rule families differ in required planning, not only geometry or palette.
for(let number=161;number<=180;number++)assert.ok(L.createLevel(number).nodes.some(n=>n.parent&&L.createLevel(number).nodes.find(p=>p.id===n.parent)?.parent));
for(let number=181;number<=200;number++)assert.ok(Z.roots(L.createLevel(number)).filter(n=>n.movable).every(n=>n.color==='white'));
for(let number=201;number<=220;number++)assert.ok(L.createLevel(number).nodes.some(n=>n.color==='black'&&n.parent));
for(let number=221;number<=240;number++)assert.equal(L.createLevel(number).nodes.filter(n=>n.canShield).length,2);
const layouts=new Set();for(let number=121;number<=240;number++){const level=L.createLevel(number);layouts.add(JSON.stringify([level.goal,level.nodes.map(n=>[n.x,n.y,n.color,n.parent,!!n.canShield])]));}assert.equal(layouts.size,120);
const hex={x:100,y:100,r:30,shape:'hexagon',rotation:0};assert.equal(Z.vertices(hex).length,6);assert.ok(Z.contains(hex,100,100));assert.ok(!Z.contains(hex,130,70));
console.log('120 mathematical levels: 20 patterns, distinct puzzles, deterministic geometry, no initial collisions, verified solutions and hexagonal hit areas passed');

const assert=require('node:assert/strict');
const {createPuzzle,stars,collection,restore}=require('../puzzle.js');
const {pour,won}=require('../game.js');
const pack=require('../levels.js');
for(const group of pack)for(const puzzle of group){let b=[...puzzle.board.map(t=>t.slice()),[]];for(const m of puzzle.solution){b=pour(b,m.from,m.to);assert.ok(b);}assert.ok(won(b));}
for(const difficulty of ['easy','medium','hard','classic'])for(let level=1;level<=60;level++)for(const extra of [1,2,4]){
 const p=createPuzzle({level,difficulty,extra});assert.ok(!won(p.board));assert.equal(p.board.filter(t=>!t.length).length,extra);assert.ok(p.board.every(t=>!t.length||t.length===4));assert.deepEqual(p,createPuzzle({level,difficulty,extra}));
}
assert.deepEqual(createPuzzle({mode:'daily',date:'2026-11-03'}),createPuzzle({mode:'daily',date:'2026-11-03',level:77,difficulty:'hard',extra:4}));
assert.notEqual(createPuzzle({mode:'daily',date:'2026-11-03'}).id,createPuzzle({mode:'daily',date:'2026-11-04'}).id);
assert.equal(stars(10,10),3);assert.equal(stars(12,10),2);assert.equal(stars(20,10),1);
assert.deepEqual(collection([[0,0,0,0],[1,0],[]]),{complete:1,total:2});
const p=createPuzzle({level:1});const snapshot={id:p.id,board:p.board,history:[],moves:0};assert.ok(restore(snapshot,p));assert.equal(restore({...snapshot,id:'wrong'},p),null);assert.equal(restore({...snapshot,board:[[9]]},p),null);
console.log('120 certified puzzles, deterministic variants, daily challenge, stars and checkpoint validation passed');

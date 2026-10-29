const assert = require('node:assert/strict');
const {pour, won, generate} = require('../game.js');
assert.deepEqual(pour([[0,0,1,1],[]],0,1), [[0,0],[1,1]]);
assert.equal(pour([[0],[1]],0,1), null);
assert.equal(pour([[0], [0,0,0,0]],0,1), null);
assert.equal(won([[0,0,0,0],[],[1,1,1,1]]), true);
assert.equal(won([[0,1,0,1],[]]), false);
for(let level=1;level<=50;level++){ const board=generate(level); assert.ok(!won(board)); assert.ok(board.every(t=>t.length<=4)); const counts=board.flat().reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{}); assert.ok(Object.values(counts).every(n=>n===4)); }
console.log('Game rules and generated levels passed');

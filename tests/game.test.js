const assert = require('node:assert/strict');
const {pour, won, generate} = require('../game.js');
assert.deepEqual(pour([[0,0,1,1],[]],0,1), [[0,0],[1,1]]);
assert.equal(pour([[0],[1]],0,1), null);
assert.equal(pour([[0], [0,0,0,0]],0,1), null);
assert.equal(won([[0,0,0,0],[],[1,1,1,1]]), true);
assert.equal(won([[0,1,0,1],[]]), false);
for(let level=1;level<=50;level++){ const board=generate(level); assert.ok(!won(board)); assert.ok(board.every(t=>t.length<=4)); const counts=board.flat().reduce((a,c)=>(a[c]=(a[c]||0)+1,a),{}); assert.ok(Object.values(counts).every(n=>n===4)); }
console.log('Game rules and generated levels passed');
for (const [difficulty, colors] of [['easy',3],['medium',5],['hard',7]]) {
  for (let n=1;n<=20;n++) {
    const b=generate(n,difficulty);
    assert.equal(new Set(b.flat()).size, colors);
    assert.equal(won(b), false);
    assert.deepEqual(generate(n,difficulty), b);
  }
}
console.log('Difficulty levels passed');
for (const empty of [1,2,3,4]) {
  const b=generate(8,'medium',empty);
  assert.equal(b.length, 5 + empty);
  assert.equal(won(b), false);
  assert.deepEqual(generate(8,'medium',empty), b);
}
console.log('Tube counts passed');

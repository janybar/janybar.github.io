const assert=require('node:assert/strict');
const {createFractal}=require('../victory.js');
assert.deepEqual(createFractal(42),createFractal(42));
assert.notDeepEqual(createFractal(42),createFractal(43));
const families=new Set();
for(let seed=1;seed<=60;seed++){
 const model=createFractal(seed);families.add(model.family);
 assert.ok(model.segments.length>100&&model.segments.length<=4000);
 for(const s of model.segments){for(const k of ['x1','y1','x2','y2','birth'])assert.ok(Number.isFinite(s[k]));assert.ok(Math.hypot(s.x1,s.y1)<=1.001);assert.ok(Math.hypot(s.x2,s.y2)<=1.001);}
}
assert.equal(families.size,3);
console.log('Fractal diversity, deterministic seeds, finite geometry and rendering budget passed');

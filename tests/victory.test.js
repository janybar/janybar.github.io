const assert=require('node:assert/strict');
const {createFractal}=require('../victory.js');
assert.deepEqual(createFractal(42),createFractal(42));
assert.notDeepEqual(createFractal(42),createFractal(43));
const families=new Set();
for(let seed=1;seed<=60;seed++){
 const model=createFractal(seed);families.add(model.family);
 assert.ok(model.name.length>3);
 if(model.field){assert.ok(model.field.iterations<=120);continue;}
 assert.ok(model.segments.length>100&&model.segments.length<=4000);
 for(const s of model.segments){for(const k of ['x1','y1','x2','y2','birth'])assert.ok(Number.isFinite(s[k]));assert.ok(Math.hypot(s.x1,s.y1)<=1.001);assert.ok(Math.hypot(s.x2,s.y2)<=1.001);}
}
assert.equal(families.size,9);
console.log('Fractal diversity, deterministic seeds, finite geometry and rendering budget passed');
const {escapeAt}=require('../victory.js');
const mandelbrot=createFractal(42,4).field;
assert.equal(escapeAt(0,0,mandelbrot),mandelbrot.iterations);
assert.ok(escapeAt(2,2,mandelbrot)<mandelbrot.iterations);
const julia={julia:true,cx:0,cy:0,iterations:96};
assert.equal(escapeAt(0,0,julia),96);
assert.ok(escapeAt(2,2,julia)<96);
for(let family=0;family<9;family++)assert.equal(createFractal(123,family).family,family);
console.log('Julia and Mandelbrot escape-time calculations passed');

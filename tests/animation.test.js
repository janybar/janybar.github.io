const assert = require('node:assert/strict');
const { area, below, waterline } = require('../pour-animation.js');
const box=[{x:0,y:0},{x:40,y:0},{x:40,y:100},{x:0,y:100}];
assert.equal(area(box),4000);
assert.equal(area(below(box,75)),1000);
for(const angle of [0,.5,1,1.6]){
 const polygon=box.map(p=>({x:p.x*Math.cos(angle)-p.y*Math.sin(angle),y:p.x*Math.sin(angle)+p.y*Math.cos(angle)}));
 for(const fraction of [.01,.25,.5,.75,1]) assert.ok(Math.abs(area(below(polygon,waterline(polygon,fraction)))/area(polygon)-fraction)<.00001);
}
console.log('Liquid volume remains correct at every tilt');

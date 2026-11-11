const assert=require('node:assert/strict'),Z=require('../zen/core.js'),L=require('../zen/levels.js');
// Validate the drawn route against the same swept contacts as touch dragging.
// In particular, white movers must never spend themselves on a different colour.
let routes=0,fallbacks=0;
for(let number=121;number<=240;number++){
 let state=L.createLevel(number);const solution=Z.solve(state);
 for(const step of solution.path){
  const expected=Z.action(state,step);
  if(step.type==='match'){
   const route=Z.hintRoute(state,step);
   if(route){
    routes++;assert.equal(route.from,step.from);let moved=state,contact=null;
    for(let i=1;i<route.points.length&&!contact;i++){
     const a=route.points[i-1],b=route.points[i],count=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/5));
     for(let j=1;j<=count&&!contact;j++){
      moved=Z.move(moved,route.from,a.x+(b.x-a.x)*j/count,a.y+(b.y-a.y)*j/count);
      const source=moved.nodes.find(n=>n.id===route.from);
      const target=Z.roots(moved).find(n=>n.id!==source.id&&Z.overlap(source,n));
      if(target){contact=Z.collide(moved,source.id,target.id);assert.ok(contact,'Blocked hint: '+number);}
     }
    }
    assert.ok(contact,'No collision on hinted route '+number);
    assert.equal(contact.color,expected.color);assert.deepEqual(contact.removed.slice().sort(),expected.removed.slice().sort(),'Wrong first contact: '+number);
    assert.equal(Z.solve(contact.state).status,'solved','Hint led to dead end: '+number);
   }else fallbacks++;
  }
  state=expected.state;
 }
}
assert.ok(routes>400);console.log(`Collision-safe hints: ${routes} routes checked, ${fallbacks} explicit tap fallbacks`);

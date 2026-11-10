const assert=require('node:assert/strict');
const Z=require('../zen/core.js');
const node=(id,color,extra={})=>({id,color,x:100,y:100,r:30,shape:'circle',movable:true,parent:null,shield:false,...extra});
const state=nodes=>({nodes,background:'paper',goal:'red'});
let s=state([node('a','red'),node('b','red'),node('other','red'),node('blue','blue')]);
let result=Z.collide(s,'a','b');assert.equal(result.kind,'flood');assert.equal(result.state.background,'red');assert.deepEqual(result.state.nodes.map(n=>n.id),['blue']);assert.equal(s.nodes.length,4);
s=state([node('a','red'),node('b','red',{movable:false}),node('inside','red',{parent:'b'})]);
result=Z.collide(s,'a','b');assert.deepEqual(result.state.nodes.map(n=>n.id),['inside']);assert.equal(result.state.nodes[0].parent,null);
assert.equal(Z.collide(s,'a','inside'),null);
assert.equal(Z.collide(state([node('a','blue'),node('b','red')]),'a','b'),null);
result=Z.collide(state([node('a','white'),node('b','red')]),'a','b');assert.ok(Z.won(result.state));
result=Z.collide(state([node('a','red'),node('void','black',{movable:false}),node('child','blue',{parent:'void'})]),'a','void');assert.equal(result.kind,'erase');assert.equal(result.state.background,'paper');assert.equal(result.state.nodes[0].parent,null);
s=state([node('a','red'),node('b','red'),node('shielded','red',{canShield:true,shield:true})]);result=Z.collide(s,'a','b');assert.equal(result.state.nodes.length,1);assert.ok(Z.won(Z.toggleShield(result.state,'shielded').state));
assert.equal(Z.won({nodes:[],goal:'blue',background:'red'}),false);
assert.ok(Z.overlap(node('a','red'),node('b','blue',{x:159})));assert.ok(!Z.overlap(node('a','red'),node('b','blue',{x:170})));
for(const shape of ['square','diamond','triangle']){assert.ok(Z.contains(node('a','red',{shape}),100,100));assert.ok(!Z.contains(node('a','red',{shape}),200,200));}
s=state([node('a','red',{mirror:'b'}),node('b','blue',{x:500}),node('inside','gold',{parent:'a'})]);result=Z.move(s,'a',120,130);assert.equal(result.nodes.find(n=>n.id==='b').x,480);assert.equal(result.nodes.find(n=>n.id==='b').y,130);assert.equal(result.nodes.find(n=>n.id==='inside').x,120);
assert.equal(Z.solve(state([node('a','red'),node('b','red')])).status,'solved');assert.equal(Z.solve(state([node('a','blue'),node('b','blue')])).status,'dead');
console.log('Flood, nesting protection, white, black, shields, geometry, mirrored movement and solver rules passed');
const {createLevel}=require('../zen/levels.js');
for(let level=1;level<=120;level++){
 const initial=createLevel(level);assert.equal(new Set(initial.nodes.map(n=>n.id)).size,initial.nodes.length);
 const answer=Z.solve(initial);assert.equal(answer.status,'solved','Unsolvable level '+level);
 let position=initial;for(const step of answer.path){const result=Z.action(position,step);assert.ok(result);position=result.state;}assert.ok(Z.won(position));
 for(const n of initial.nodes){assert.ok(n.x-n.r>=0&&n.x+n.r<=600&&n.y-n.r>=0&&n.y+n.r<=800);if(n.parent)assert.ok(initial.nodes.some(p=>p.id===n.parent));}
}
console.log('All 120 original levels have verified solutions');

assert.equal(Z.contrastInk('#ed7470'),'#29484e');assert.equal(Z.contrastInk('#000000'),'#fffdf3');

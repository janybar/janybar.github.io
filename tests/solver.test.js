const assert=require('node:assert/strict');
const {solve,lowerBound}=require('../solver.js');
const {generate,pour,won,availableMoves}=require('../game.js');
const solved=[[0,0,0,0],[1,1,1,1],[]];
assert.equal(solve(solved).status,'solved');
assert.equal(solve([[0,1,0,1],[1,0,1,0]]).status,'unsolvable');
// There are legal moves, but every branch remains impossible to finish.
const trap=[[1,0,2],[0,1,2],[0,1,2],[2,1,0]];
assert.ok(availableMoves(trap).length>0);
assert.equal(solve(trap).status,'unsolvable');
for(const difficulty of ['easy','medium','hard']){
 for(let level=1;level<=8;level++){
  const board=generate(level,difficulty,2),copy=JSON.stringify(board);
  const answer=solve(board,{maxStates:100000,maxMs:2000});
  assert.equal(answer.status,'solvable',`${difficulty} ${level}`);
  let position=board;
  for(const step of answer.path){position=pour(position,step.from,step.to);assert.ok(position,'Solution has an illegal move');}
  assert.equal(answer.optimal,true);assert.ok(won(position));assert.equal(JSON.stringify(board),copy);
 }
}
assert.equal(solve(generate(1,'hard'),{maxStates:0}).status,'unknown');
assert.equal(solve(generate(1,'hard'),{maxMs:0}).status,'unknown');
assert.equal(solve(generate(1,'hard'),{maxFrontier:0}).status,'unknown');
assert.equal(solve(generate(1,'hard'),{maxStates:1}).status,'unknown');
console.log('Full solutions, genuine dead ends with legal moves, and search limits passed');
// Compare against an independent, unpruned graph of every two-colour / three-tube position.
const positions=new Map(),incoming=new Map();
for(let a=0;a<=4;a++)for(let b=0;b<=4;b++){
 const c=8-a-b;if(c<0||c>4)continue;
 for(let bits=0;bits<256;bits++){
  const liquid=Array.from({length:8},(_,i)=>(bits>>i)&1);if(liquid.filter(v=>v===0).length!==4)continue;
  const board=[liquid.slice(0,a),liquid.slice(a,a+b),liquid.slice(a+b)];positions.set(JSON.stringify(board),board);
 }
}
for(const [id,board] of positions){
 for(let from=0;from<3;from++)for(let to=0;to<3;to++){
  const next=pour(board,from,to);if(!next)continue;
  const target=JSON.stringify(next);if(!incoming.has(target))incoming.set(target,[]);incoming.get(target).push(id);
 }
}
const reachable=new Set([...positions].filter(([,b])=>won(b)).map(([id])=>id)),queue=[...reachable],distance=new Map(queue.map(id=>[id,0]));
for(let i=0;i<queue.length;i++)for(const previous of incoming.get(queue[i])||[])if(!reachable.has(previous)){reachable.add(previous);distance.set(previous,distance.get(queue[i])+1);queue.push(previous);}
for(const [id,board] of positions){
 const actual=solve(board);assert.equal(actual.status!=='unsolvable',reachable.has(id),id);assert.notEqual(actual.status,'unknown');if(reachable.has(id)){assert.equal(actual.path.length,distance.get(id),'Solution is not shortest: '+id);assert.ok(lowerBound(board)<=distance.get(id),'Heuristic overestimates '+id);}
 for(let from=0;from<3;from++)for(let to=0;to<3;to++){const next=pour(board,from,to);if(next)assert.ok(lowerBound(board)<=1+lowerBound(next),'Heuristic is inconsistent '+id);}
}
console.log(`Shortest solutions match exhaustive breadth-first reference for ${positions.size} positions`);

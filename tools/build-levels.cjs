// Development-only curation. The browser never searches for solutions to create levels.
const fs=require('node:fs');
const {solve,lowerBound}=require('../solver.js');
let state=20261103;
const rand=n=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)%n};
const pack=[];
for(let colors=3;colors<=7;colors++){
 const group=[],seen=new Set();
 for(let attempt=0;group.length<24&&attempt<20000;attempt++){
  const units=Array.from({length:colors*4},(_,i)=>Math.floor(i/4));
  for(let i=units.length-1;i>0;i--){const j=rand(i+1);[units[i],units[j]]=[units[j],units[i]];}
  const board=Array.from({length:colors},(_,i)=>units.slice(i*4,i*4+4));
  if(board.some(t=>t.every(c=>c===t[0])))continue;
  const key=board.map(t=>t.join('')).sort().join('|');if(seen.has(key))continue;
  const one=solve([...board,[]],{maxMs:120,maxStates:12000});if(one.status!=='solvable')continue;
  const answers=[one];
  for(let extra=2;extra<=4;extra++)answers.push(solve([...board,...Array.from({length:extra},()=>[])],{maxMs:120,maxStates:12000}));
  if(answers.some(a=>a.status!=='solvable'))continue;
  if(colors>=5&&answers[1].path.length<=lowerBound([...board,[],[]]))continue;
  seen.add(key);group.push({board,targets:answers.map(a=>a.path.length),solution:one.path});
 }
 if(group.length!==24)throw Error('Not enough levels for '+colors);
 group.sort((a,b)=>a.targets[1]-b.targets[1]);pack.push(group);
 console.log(`${colors} colours: ${group.length} puzzles, targets ${group[0].targets[1]}–${group.at(-1).targets[1]}`);
}
fs.writeFileSync('levels.js',`// Curated offline; every layout has a verified solution with one spare vessel.\n(function(root){const levels=${JSON.stringify(pack)};if(typeof module!=='undefined')module.exports=levels;else root.WaterLevels=levels;})(globalThis);\n`);

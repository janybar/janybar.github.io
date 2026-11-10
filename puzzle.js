(function(root){
 const levels=typeof module!=='undefined'?require('./levels.js'):root.WaterLevels;
 const chapters=['Первые открытия','Поймать ритм','На ход вперёд','Цветные узлы','Глубина цвета'];
 const hash=text=>{let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;};
 function createPuzzle({level=1,difficulty='classic',extra=2,mode='journey',date='2026-01-01'}={}){
  const daily=mode==='daily',colors=daily?5:({easy:3,medium:5,hard:7}[difficulty]||Math.min(3+Math.floor((level-1)/6),7));
  extra=daily?2:extra;
  const identity=daily?'daily:'+date:`journey:${difficulty}:${level}`,seed=hash(identity);
  const group=levels[colors-3],base=group[daily?seed%group.length:(level-1)%group.length];
  let state=seed||1;const rand=n=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)%n;};
  const shuffle=items=>{for(let i=items.length-1;i>0;i--){const j=rand(i+1);[items[i],items[j]]=[items[j],items[i]];}return items;};
  const palette=shuffle(Array.from({length:colors},(_,i)=>i));
  const board=shuffle(base.board.map(t=>t.map(color=>palette[color]))).concat(Array.from({length:extra},()=>[]));
  return {id:`v2:${identity}:${extra}`,board,par:base.targets[extra-1],colors,extra,title:daily?'Новый день — новая задача':chapters[colors-3]};
 }
 function stars(moves,par){return moves<=par?3:moves<=Math.ceil(par*1.3)?2:1;}
 function collection(board){return {complete:board.filter(t=>t.length===4&&t.every(c=>c===t[0])).length,total:new Set(board.flat()).size};}
 function restore(snapshot,puzzle){
  if(!snapshot||snapshot.id!==puzzle.id||!Number.isSafeInteger(snapshot.moves)||snapshot.moves<0||!Array.isArray(snapshot.history)||snapshot.history.length>80||snapshot.history.length>snapshot.moves)return null;
  const valid=board=>{
   if(!Array.isArray(board)||board.length!==puzzle.board.length)return false;
   const counts=Array(puzzle.colors).fill(0);
   for(const tube of board){if(!Array.isArray(tube)||tube.length>4)return false;for(const c of tube){if(!Number.isInteger(c)||c<0||c>=puzzle.colors)return false;counts[c]++;}}
   return counts.every(count=>count===4);
  };
  if(!valid(snapshot.board)||!snapshot.history.every(valid))return null;
  return {board:snapshot.board.map(t=>t.slice()),history:snapshot.history.map(b=>b.map(t=>t.slice())),moves:snapshot.moves};
 }
 const api={createPuzzle,stars,collection,restore};if(typeof module!=='undefined')module.exports=api;else root.WaterPuzzle=api;
})(globalThis);

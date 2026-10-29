(function(root){
  const {pour,won,availableMoves}=typeof module!=='undefined'?require('./game.js'):root.WaterRules;
  // Permuting vessels does not change the puzzle or the distance to a goal.
  const key=board=>board.map(tube=>tube.join('')).sort().join('|');

  function lowerBound(board){
    let runs=0;
    const colors=new Set(),bottoms=new Set();
    for(const tube of board){
      if(tube.length)bottoms.add(tube[0]);
      for(let i=0;i<tube.length;i++){
        colors.add(tube[i]);if(i===0||tube[i]!==tube[i-1])runs++;
      }
    }
    // Each move merges at most one colour run. A colour absent from all bottoms
    // also needs a move into an empty vessel, which cannot merge any runs.
    // These are disjoint costs: the estimate never exceeds the true distance.
    return runs-colors.size+[...colors].filter(color=>!bottoms.has(color)).length;
  }

  class Frontier{
    constructor(){this.nodes=[];}
    get length(){return this.nodes.length;}
    before(a,b){return a.f<b.f||(a.f===b.f&&(a.h<b.h||(a.h===b.h&&a.order<b.order)));}
    push(node){
      const nodes=this.nodes;let i=nodes.length;nodes.push(node);
      while(i>0){const parent=(i-1)>>1;if(!this.before(node,nodes[parent]))break;nodes[i]=nodes[parent];i=parent;}nodes[i]=node;
    }
    pop(){
      const nodes=this.nodes,first=nodes[0],last=nodes.pop();
      if(nodes.length){let i=0;while(i*2+1<nodes.length){let child=i*2+1;if(child+1<nodes.length&&this.before(nodes[child+1],nodes[child]))child++;if(!this.before(nodes[child],last))break;nodes[i]=nodes[child];i=child;}nodes[i]=last;}
      return first;
    }
  }

  function solve(board,{maxStates=150000,maxFrontier=50000,maxMs=8000,onProgress=()=>{}}={}){
    if(won(board))return {status:'solved',path:[],optimal:true,explored:0};
    const began=performance.now(),best=new Map(),frontier=new Frontier();
    let explored=0,order=0,lastProgress=began;
    const unknown=reason=>({status:'unknown',reason,explored});
    if(maxStates<=0||maxFrontier<=0)return unknown('memory');
    const signature=key(board),h=lowerBound(board);
    best.set(signature,0);frontier.push({board,g:0,h,f:h,signature,parent:null,order:order++});
    while(frontier.length){
      if(performance.now()-began>=maxMs)return unknown('time');
      const node=frontier.pop();
      if(best.get(node.signature)!==node.g)continue;
      explored++;
      // A goal is accepted only when removed from the minimum-f queue: at this
      // point admissibility guarantees that no shorter solution is pending.
      if(won(node.board)){
        const path=[];for(let step=node;step.parent;step=step.parent)path.push(step.move);
        return {status:'solvable',path:path.reverse(),optimal:true,explored};
      }
      for(const move of availableMoves(node.board)){
        const next=pour(node.board,move.from,move.to),nextKey=key(next),g=node.g+1,previous=best.get(nextKey);
        if(previous!==undefined&&previous<=g)continue;
        // Never discard unexplored branches to fit a budget: that would make
        // both a shortest-path claim and an impossibility claim unreliable.
        if((previous===undefined&&best.size>=maxStates)||frontier.length>=maxFrontier)return unknown('memory');
        const h=lowerBound(next);best.set(nextKey,g);
        frontier.push({board:next,g,h,f:g+h,signature:nextKey,parent:node,move,order:order++});
      }
      if(performance.now()-lastProgress>200){onProgress(explored);lastProgress=performance.now();}
    }
    return {status:'unsolvable',explored};
  }
  if(typeof module!=='undefined')module.exports={solve,lowerBound};else root.WaterSolver={solve};
})(globalThis);

importScripts('./game.js','./solver.js');
self.onmessage=event=>{
  try{
    const {board,longer}=event.data;
    const answer=WaterSolver.solve(board,{maxMs:longer?30000:8000,maxStates:longer?400000:150000,onProgress:explored=>self.postMessage({status:'searching',explored})});
    self.postMessage(answer);
  }catch(error){self.postMessage({status:'error'});}
};

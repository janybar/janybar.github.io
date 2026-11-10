(function(root){
 const clone=s=>({...s,nodes:s.nodes.map(n=>({...n}))});
 const roots=s=>s.nodes.filter(n=>n.parent===null);
 const won=s=>s.nodes.length===0&&s.background===s.goal;
 function remove(state,ids){return {...state,nodes:state.nodes.filter(n=>!ids.has(n.id)).map(n=>ids.has(n.parent)?{...n,parent:null}:n)};}
 function collide(state,from,to){
  const a=state.nodes.find(n=>n.id===from),b=state.nodes.find(n=>n.id===to);
  if(!a||!b||a.id===b.id||a.parent!==null||b.parent!==null||!a.movable)return null;
  const ids=new Set([a.id,b.id]);
  if(a.color==='black'||b.color==='black')return {kind:'erase',state:remove(state,ids),removed:[...ids],color:null};
  if(a.color!==b.color&&a.color!=='white'&&b.color!=='white')return null;
  const color=a.color==='white'?b.color:a.color;
  // Only pieces exposed BEFORE this contact are swallowed by the flood.
  // Newly uncovered children survive until another move, even if their colour matches.
  for(const n of roots(state))if(n.color===color&&!n.shield)ids.add(n.id);
  const next=remove(state,ids);next.background=color;
  return {kind:'flood',state:next,removed:[...ids],color};
 }
 function toggleShield(state,id){
  const n=state.nodes.find(n=>n.id===id);if(!n||n.parent!==null||!n.canShield)return null;
  const next=clone(state),piece=next.nodes.find(n=>n.id===id);piece.shield=!piece.shield;
  if(!piece.shield&&piece.color===next.background)return {kind:'flood',state:remove(next,new Set([id])),removed:[id],color:next.background};
  return {kind:'shield',state:next,removed:[],color:null};
 }
 function action(state,step){return step.type==='shield'?toggleShield(state,step.id):collide(state,step.from,step.to);}
 function actions(state){const free=roots(state),out=[];for(const a of free){if(a.canShield)out.push({type:'shield',id:a.id});if(a.movable)for(const b of free)if(a.id!==b.id&&(a.color===b.color||a.color==='white'||b.color==='white'||a.color==='black'||b.color==='black'))out.push({type:'match',from:a.id,to:b.id});}return out;}
 function solve(state,{limit=18000}={}){
  const signature=s=>s.background+'|'+s.nodes.map(n=>n.id+':'+(n.parent??'')+':'+Number(n.shield)).join(',');
  const queue=[{state,path:[]}],seen=new Set([signature(state)]);
  for(let i=0;i<queue.length;i++){
   const current=queue[i];if(won(current.state))return {status:'solved',path:current.path};
   for(const step of actions(current.state)){const result=action(current.state,step);if(!result)continue;const key=signature(result.state);if(seen.has(key))continue;if(seen.size>=limit)return {status:'unknown',path:[]};seen.add(key);queue.push({state:result.state,path:[...current.path,step]});}
  }return {status:'dead',path:[]};
 }
 function vertices(n){
  const r=n.r,angle=(n.rotation||0)*Math.PI/180;
  const points=n.shape==='triangle'?[[0,-r],[r*.866,r*.5],[-r*.866,r*.5]]:n.shape==='diamond'?[[0,-r],[r,0],[0,r],[-r,0]]:[[-r,-r],[r,-r],[r,r],[-r,r]];
  return points.map(([x,y])=>({x:n.x+x*Math.cos(angle)-y*Math.sin(angle),y:n.y+x*Math.sin(angle)+y*Math.cos(angle)}));
 }
 function contains(n,x,y){if(n.shape==='circle')return Math.hypot(x-n.x,y-n.y)<=n.r;const points=vertices(n);let sign=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=(b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);if(Math.abs(cross)<1e-8)continue;if(sign&&Math.sign(cross)!==sign)return false;sign=Math.sign(cross);}return true;}
 function overlap(a,b){
  if(a.shape==='circle'&&b.shape==='circle')return Math.hypot(a.x-b.x,a.y-b.y)<=a.r+b.r;
  const ap=a.shape==='circle'?null:vertices(a),bp=b.shape==='circle'?null:vertices(b),axes=[];
  for(const points of [ap,bp])if(points)for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];axes.push({x:-(q.y-p.y),y:q.x-p.x});}
  if(!ap||!bp){const circle=ap?b:a,points=ap||bp;const closest=points.reduce((p,q)=>Math.hypot(p.x-circle.x,p.y-circle.y)<Math.hypot(q.x-circle.x,q.y-circle.y)?p:q);axes.push({x:closest.x-circle.x,y:closest.y-circle.y});}
  for(const axis of axes){const length=Math.hypot(axis.x,axis.y);if(length<1e-8)continue;axis.x/=length;axis.y/=length;
   const project=(n,points)=>{if(!points){const center=n.x*axis.x+n.y*axis.y;return [center-n.r,center+n.r]}const values=points.map(p=>p.x*axis.x+p.y*axis.y);return [Math.min(...values),Math.max(...values)]};
   const [amin,amax]=project(a,ap),[bmin,bmax]=project(b,bp);if(amax<bmin||bmax<amin)return false;
  }return true;
 }
 function move(state,id,x,y){
  const source=state.nodes.find(n=>n.id===id);if(!source||source.parent!==null||!source.movable)return state;
  const next=clone(state),dx=x-source.x,dy=y-source.y,mirror=source.mirror&&state.nodes.find(n=>n.id===source.mirror&&n.parent===null);
  const belongs=(node,rootId)=>{let current=node,guard=0;while(current&&guard++<=state.nodes.length){if(current.id===rootId)return true;current=state.nodes.find(n=>n.id===current.parent);}return false};
  for(const n of next.nodes){if(belongs(n,id)){n.x+=dx;n.y+=dy;}else if(mirror&&belongs(n,mirror.id)){n.x-=dx;n.y+=dy;}}
  return next;
 }
 function contrastInk(hex){const linear=c=>{const x=parseInt(c,16)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};const rgb=hex.slice(1).match(/../g).map(linear),lum=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;return lum>.2?'#29484e':'#fffdf3';}
 const api={contrastInk,clone,roots,won,collide,toggleShield,action,actions,solve,vertices,contains,overlap,move};if(typeof module!=='undefined')module.exports=api;else root.ZenCore=api;
})(globalThis);

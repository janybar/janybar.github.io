(function(){
'use strict';
const $=selector=>document.querySelector(selector),Z=ZenCore,L=ZenLevels,NS='http://www.w3.org/2000/svg';
let data;try{data=JSON.parse(localStorage.getItem('quiet-zen-v1'))}catch(e){}
if(!data||typeof data!=='object')data={};if(!data.sessions||typeof data.sessions!=='object')data.sessions={};if(!Array.isArray(data.completed))data.completed=[];
let level=L.createLevel(data.level),state=Z.clone(level),history=[],selected=null,effect=null,glide=null,drag=null,toastTimer=null,chapterPage=level.chapter,lastTap={id:null,time:0};
const colorNames={coral:'коралловый',teal:'бирюзовый',gold:'золотой',blue:'голубой',violet:'лиловый',leaf:'зелёный',white:'белый',black:'чёрный',paper:'светлый'};
const shapeNames={circle:'круг',square:'квадрат',triangle:'треугольник',diamond:'ромб',hexagon:'шестиугольник'};
function save(){try{data.level=level.number;data.sessions[level.number]={background:state.background,nodes:state.nodes,history:history.slice(-24)};localStorage.setItem('quiet-zen-v1',JSON.stringify(data))}catch(e){}}
function restore(saved){
 if(!saved||!L.palette[saved.background]||!Array.isArray(saved.nodes))return null;
 const known=new Map(level.nodes.map(n=>[n.id,n]));
 if(new Set(saved.nodes.map(n=>n.id)).size!==saved.nodes.length)return null;
 const live=new Set(saved.nodes.map(n=>n.id));
 for(const n of saved.nodes){const base=known.get(n.id);if(!base||n.color!==base.color||n.shape!==base.shape||n.r!==base.r||n.movable!==base.movable||n.canShield!==base.canShield||n.mirror!==base.mirror||typeof n.shield!=='boolean'||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.x>600||n.y<0||n.y>800)return null;if(n.parent!==null&&(n.parent!==base.parent||!live.has(n.parent)))return null;}
 return {...Z.clone(level),background:saved.background,nodes:saved.nodes.map(n=>({...n}))};
}
function loadLevel(number,{fresh=false}={}){
 cancelEffect();stopGlide();clearTimeout(toastTimer);$('#toast').hidden=true;drag=null;selected=null;lastTap={id:null,time:0};level=L.createLevel(number);const snapshot=fresh?null:data.sessions[level.number];state=restore(snapshot)||Z.clone(level);history=[];
 if(snapshot&&state!==null&&Array.isArray(snapshot.history))for(const item of snapshot.history.slice(-24)){const old=restore(item);if(old)history.push(old);}
 if(fresh)history=[];
 render();save();if(Z.won(state))celebrate(false);
}
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,2400);}
function svgElement(tag,attributes={}){const node=document.createElementNS(NS,tag);for(const [name,value] of Object.entries(attributes))node.setAttribute(name,value);return node;}
function geometry(n,r=n.r){
 if(n.shape==='circle')return svgElement('circle',{r,cx:0,cy:0});
 if(n.shape==='square')return svgElement('rect',{x:-r,y:-r,width:r*2,height:r*2});
 const points=Z.vertices({...n,x:0,y:0,r,rotation:0}).map(p=>[p.x,p.y]);
 return svgElement('polygon',{points:points.map(p=>p.join(',')).join(' ')});
}
function createPiece(n,mini=false){
 const group=svgElement('g',{'data-piece':n.id,transform:`translate(${n.x} ${n.y}) rotate(${n.rotation||0})`});
 const free=n.parent===null;group.classList.add('piece',free&&n.movable?'movable':'locked');
 if(n.canShield)group.classList.add('can-shield');if(n.shield)group.classList.add('shielded');if(n.id===selected)group.classList.add('selected');
 const body=geometry(n);body.setAttribute('fill',L.palette[n.color]);body.classList.add('piece-body');group.appendChild(body);
 if(n.label&&!mini){const label=svgElement('text',{'text-anchor':'middle','dominant-baseline':'central',fill:Z.contrastInk(L.palette[n.color]),class:'piece-label'});label.textContent=n.label;group.appendChild(label);}
 if(!mini){
  const ring=geometry(n,Math.max(8,n.r-8));ring.classList.add('piece-ring');group.appendChild(ring);
  if(n.canShield){const shield=geometry(n,n.r+9);shield.classList.add('shield-ring');group.appendChild(shield);}
  if(free){group.setAttribute('tabindex','0');group.setAttribute('role','button');group.setAttribute('aria-label',`${n.movable?'Подвижный':'Неподвижный'} ${shapeNames[n.shape]}, ${colorNames[n.color]}${n.canShield?', защита '+(n.shield?'включена':'выключена'):''}`);group.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();tap(n.id)}if(event.key.toLowerCase()==='s'&&n.canShield){event.preventDefault();shield(n.id)}};}
 }
 return group;
}
function caption(){
 let message=level.number===1?'Перетащи круг к квадрату':level.index===0?level.description:'Последний цвет — цвет рамки';
 if(selected){const n=state.nodes.find(n=>n.id===selected);if(n?.canShield)message='Двойное касание — включить или выключить защиту';else if(n&&!n.movable)message='Неподвижная фигура. Двигай фигуру со светлым ободком.';}
 if(!Z.won(state)&&Z.actions(state).length===0)message='Не осталось сочетаний. Отмени ход или начни заново.';
 $('#instruction').textContent=message;
}
function updateControls(){const disabled=!history.length&&!drag;$('#undo').disabled=disabled;$('#undo').setAttribute('aria-disabled',String(disabled));}
function render(){
 $('#chapter-name').textContent=level.title;$('#level-heading').innerHTML=String(level.number).padStart(2,'0')+' <span>/ '+L.totalLevels+'</span>';
 $('#pattern-caption').hidden=!level.patternName;$('#pattern-name').textContent=level.patternName||'';$('#pattern-caption').title=level.patternDescription||'';
 document.documentElement.style.setProperty('--goal',L.palette[level.goal]);$('#board-host').style.background=L.palette[state.background];$('#goal-dot').style.background=L.palette[level.goal];
 $('#pieces').replaceChildren(...state.nodes.map(n=>createPiece(n)));$('#hint-layer').replaceChildren();
 $('#mirror-guide').replaceChildren();if(level.chapter===5)$('#mirror-guide').appendChild(svgElement('line',{x1:300,y1:35,x2:300,y2:765,class:'mirror-line'}));
 renderGuides();
 $('#win-overlay').hidden=true;updateControls();caption();
}
function renderGuides(){
 const layer=$('#math-guide'),live=new Map(state.nodes.map(n=>[n.id,n]));layer.replaceChildren();
 for(const guide of level.guides||[]){let d='';for(let i=1;i<guide.ids.length;i++){const a=live.get(guide.ids[i-1]),b=live.get(guide.ids[i]);if(a&&b)d+=`M${a.x},${a.y}L${b.x},${b.y}`;}if(d)layer.appendChild(svgElement('path',{d,class:'math-line'}));}
}
function updatePositions(){for(const n of state.nodes){const group=$('#pieces').querySelector(`[data-piece="${n.id}"]`);if(group)group.setAttribute('transform',`translate(${n.x} ${n.y}) rotate(${n.rotation||0})`);}}
function select(id){selected=selected===id?null:id;$('#pieces').querySelectorAll('.piece').forEach(g=>g.classList.toggle('selected',g.dataset.piece===selected));$('#hint-layer').replaceChildren();caption();}
function cancelEffect(){if(effect){effect.cancel();effect=null;}$('#wash-layer').replaceChildren();}
function stopGlide(){if(glide){cancelAnimationFrame(glide);glide=null;}}
function settle(){
 for(const a of Z.roots(state))if(a.movable)for(const b of Z.roots(state))if(a.id!==b.id&&Z.overlap(a,b)){const result=Z.collide(state,a.id,b.id);if(result){commit(result,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},null,true);return true;}}
 return false;
}
function commit(result,origin,before=Z.clone(state),auto=false){
 if(!result)return;
 cancelEffect();stopGlide();if(before)history.push(before);selected=null;state=result.state;save();updateControls();
 const groups=[...$('#pieces').children];groups.forEach(g=>{g.classList.remove('selected','dragging');if(result.removed.includes(g.dataset.piece))g.classList.add('dissolving');});
 ZenAudio.chime(Object.keys(L.palette).indexOf(result.color||'blue'),result.kind==='erase');
 const finish=()=>{if(effect){effect.cancel();effect=null;}render();if(Z.won(state))celebrate();else if(auto)settle();};
 if(result.kind==='shield'||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
 let frame,start=null,stopped=false,wave=null;
 const duration=result.kind==='flood'?430:170;
 if(result.kind==='flood'){
  const point=new DOMPoint(origin.x,origin.y).matrixTransform($('#game-svg').getScreenCTM()),host=$('#board-host'),rect=host.getBoundingClientRect(),x=point.x-rect.left-host.clientLeft,y=point.y-rect.top-host.clientTop;
  const radius=Math.max(Math.hypot(x,y),Math.hypot(host.clientWidth-x,y),Math.hypot(x,host.clientHeight-y),Math.hypot(host.clientWidth-x,host.clientHeight-y))+5;
  wave=document.createElement('div');wave.className='flood-wave';Object.assign(wave.style,{left:(x-radius)+'px',top:(y-radius)+'px',width:radius*2+'px',height:radius*2+'px',background:L.palette[result.color]});$('#wash-layer').appendChild(wave);
 }
 const cancel=()=>{stopped=true;cancelAnimationFrame(frame);wave?.remove();};effect={cancel,finish};
 function tick(now){if(stopped)return;if(start===null)start=now;const t=Math.min(1,(now-start)/duration);if(wave)wave.style.transform=`scale(${1-Math.pow(1-t,3)})`;if(t===1)finish();else frame=requestAnimationFrame(tick);}
 frame=requestAnimationFrame(tick);
}
function celebrate(){
 stopGlide();$('#win-overlay').hidden=false;$('#instruction').textContent='Никакой спешки. Можно идти дальше.';
 document.documentElement.style.setProperty('--win-ink',Z.contrastInk(L.palette[level.goal]));
 if(!data.completed.includes(level.number))data.completed.push(level.number);$('#next-level').innerHTML=(level.number===L.totalLevels?'С начала':'Дальше')+' <span>→</span>';save();
}
function finishAnimations(){let guard=0;while(effect&&guard++<20)effect.finish();stopGlide();}
function tap(id){
 finishAnimations();if(Z.won(state))return;const n=state.nodes.find(n=>n.id===id&&n.parent===null);if(!n)return;
 const now=performance.now();
 if(n.canShield&&lastTap.id===id&&now-lastTap.time<340){lastTap={id:null,time:0};shield(id);return;}
 lastTap={id,time:now};
 if(selected&&selected!==id&&!n.canShield){const chosen=state.nodes.find(p=>p.id===selected);const result=chosen?.movable?Z.collide(state,chosen.id,id):n.movable?Z.collide(state,id,chosen?.id):null;if(result){commit(result,{x:n.x,y:n.y});return;}}
 select(id);
}
function shield(id){finishAnimations();const n=state.nodes.find(p=>p.id===id),result=Z.toggleShield(state,id);if(result){commit(result,{x:n.x,y:n.y});notify(result.state.nodes.find(p=>p.id===id)?.shield?'Защита включена':'Защита выключена');}}
function point(event){return new DOMPoint(event.clientX,event.clientY).matrixTransform($('#game-svg').getScreenCTM().inverse());}
function hit(x,y){const free=Z.roots(state),matrix=$('#game-svg').getScreenCTM(),scale=Math.max(.01,Math.min(Math.abs(matrix.a),Math.abs(matrix.d)));return free.slice().reverse().find(n=>Z.contains(n,x,y))||free.filter(n=>n.movable).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).find(n=>Z.contains({...n,r:Math.max(n.r+10,28/scale)},x,y));}
function clampPosition(n,x,y){const extra=n.shape==='square'?n.r*Math.SQRT2:n.r;return {x:Math.min(590-extra,Math.max(10+extra,x)),y:Math.min(790-extra,Math.max(10+extra,y))};}
function moveToward(id,x,y,before,auto){
 const source=state.nodes.find(n=>n.id===id);if(!source)return 'gone';const desired=clampPosition(source,x,y),distance=Math.hypot(desired.x-source.x,desired.y-source.y),steps=Math.max(1,Math.ceil(distance/7));
 const origin={x:source.x,y:source.y};
 for(let i=1;i<=steps;i++){
  const next=Z.move(state,id,origin.x+(desired.x-origin.x)*i/steps,origin.y+(desired.y-origin.y)*i/steps),moving=Z.roots(next).filter(n=>n.id===id||n.id===source.mirror),movingIds=new Set(moving.map(n=>n.id));
  for(const a of moving)for(const b of Z.roots(next))if(!movingIds.has(b.id)&&Z.overlap(a,b)){
   const result=Z.collide(next,a.id,b.id);if(result){state=next;updatePositions();commit(result,{x:(a.x+b.x)/2,y:(a.y+b.y)/2},before,auto);return 'matched';}
   updatePositions();return 'blocked';
  }
  state=next;
 }
 updatePositions();return 'moved';
}
$('#game-svg').onpointerdown=event=>{
 if(!event.isPrimary||event.button!==0)return;finishAnimations();if(Z.won(state))return;
 if(data.music)ZenAudio.enable(true);
 const p=point(event),n=hit(p.x,p.y);if(!n){selected=null;render();return;}
 drag={id:n.id,pointer:event.pointerId,start:p,last:p,offset:{x:p.x-n.x,y:p.y-n.y},before:Z.clone(state),moved:false,lastTime:performance.now(),vx:0,vy:0,movable:n.movable};
 event.currentTarget.setPointerCapture(event.pointerId);updateControls();
 if(n.movable)$('#pieces').querySelector(`[data-piece="${n.id}"]`)?.classList.add('dragging');
};
$('#game-svg').onpointermove=event=>{
 if(!drag||event.pointerId!==drag.pointer||!drag.movable)return;const p=point(event);
 if(!drag.moved&&Math.hypot(p.x-drag.start.x,p.y-drag.start.y)<6)return;
 drag.moved=true;const now=performance.now(),dt=Math.max(8,now-drag.lastTime);drag.vx=Math.max(-.8,Math.min(.8,(p.x-drag.last.x)/dt));drag.vy=Math.max(-.8,Math.min(.8,(p.y-drag.last.y)/dt));drag.last=p;drag.lastTime=now;
 const gesture=drag,result=moveToward(drag.id,p.x-drag.offset.x,p.y-drag.offset.y,drag.before,!!state.nodes.find(n=>n.id===drag.id)?.mirror);
 if(result==='matched'){drag=null;selected=null;updateControls();}
};
function release(event,cancelled){
 if(!drag||event.pointerId!==drag.pointer)return;const gesture=drag;drag=null;$('#pieces').querySelector('.dragging')?.classList.remove('dragging');updateControls();
 if(cancelled){state=gesture.before;render();save();return;}
 if(!gesture.moved){tap(gesture.id);return;}
 history.push(gesture.before);save();updateControls();
 if(performance.now()-gesture.lastTime>90||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let vx=gesture.vx*.5,vy=gesture.vy*.5,last=performance.now();
 function coast(now){const dt=Math.min(30,now-last);last=now;const n=state.nodes.find(p=>p.id===gesture.id);if(!n||Math.hypot(vx,vy)<.025){glide=null;save();return;}const result=moveToward(n.id,n.x+vx*dt,n.y+vy*dt,null,!!n.mirror);if(result==='matched'){glide=null;return;}if(result==='blocked'){vx*=-.25;vy*=-.25;}vx*=Math.exp(-dt/80);vy*=Math.exp(-dt/80);glide=requestAnimationFrame(coast);}
 glide=requestAnimationFrame(coast);
}
$('#game-svg').onpointerup=event=>release(event,false);$('#game-svg').onpointercancel=event=>release(event,true);$('#game-svg').onlostpointercapture=event=>{if(drag&&drag.pointer===event.pointerId)release(event,true)};
$('#undo').onclick=()=>{cancelEffect();stopGlide();if(drag){state=drag.before;drag=null;}else if(history.length)state=history.pop();selected=null;render();save();};
$('#restart').onclick=$('#win-repeat').onclick=()=>loadLevel(level.number,{fresh:true});
$('#next-level').onclick=()=>loadLevel(level.number===L.totalLevels?1:level.number+1,{fresh:true});
$('#hint').onclick=()=>{
 finishAnimations();if(Z.won(state))return;const result=Z.solve(state);$('#hint-layer').replaceChildren();
 if(result.status==='dead'){notify('Из этого положения завершить уровень не получится. Попробуй отменить ход.');return;}
 if(result.status!=='solved'||!result.path.length){notify('Пока не удалось найти путь. Можно отменить ход и попробовать иначе.');return;}
 const step=result.path[0];
 if(step.type==='shield'){const n=state.nodes.find(p=>p.id===step.id);$('#hint-layer').appendChild(svgElement('circle',{cx:n.x,cy:n.y,r:n.r+18,class:'hint-halo'}));notify('Дважды коснись подсвеченной фигуры, чтобы переключить защиту.');return;}
 const route=Z.hintRoute(state,step),a=state.nodes.find(n=>n.id===step.from),b=state.nodes.find(n=>n.id===(route?.to||step.to));selected=a.id;
 $('#pieces').querySelectorAll('.piece').forEach(g=>g.classList.toggle('selected',g.dataset.piece===selected));
 [a,b].forEach(n=>$('#hint-layer').appendChild(svgElement('circle',{cx:n.x,cy:n.y,r:n.r+16,class:'hint-halo'})));
 if(route)$('#hint-layer').appendChild(svgElement('path',{d:route.points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' '),class:'hint-arrow'}));
 notify(route?'Следуй по линии или коснись второй подсвеченной фигуры.':'Коснись второй подсвеченной фигуры, чтобы соединить пару.');
};
function miniature(number){const model=L.createLevel(number),svg=svgElement('svg',{viewBox:'0 0 600 800','aria-hidden':'true'});svg.appendChild(svgElement('rect',{x:7,y:7,width:586,height:786,fill:L.palette.paper,stroke:L.palette[model.goal],'stroke-width':22}));for(const guide of model.guides||[]){const points=guide.ids.map(id=>model.nodes.find(n=>n.id===id)).map(n=>n.x+','+n.y).join(' ');svg.appendChild(svgElement('polyline',{points,class:'math-line'}));}model.nodes.forEach(n=>svg.appendChild(createPiece(n,true)));return svg;}
function renderLevels(){
 $('#chapter-tabs').replaceChildren(...L.chapters.map((chapter,index)=>{const button=document.createElement('button');button.textContent=chapter.title;button.setAttribute('aria-pressed',String(chapterPage===index));button.onclick=()=>{chapterPage=index;renderLevels()};return button}));
 $('#chapter-description').textContent=L.chapters[chapterPage].description;
 $('#level-grid').replaceChildren(...Array.from({length:20},(_,i)=>{const number=chapterPage*20+i+1,model=L.createLevel(number),button=document.createElement('button');button.className='level-card'+(number===level.number?' current':'')+(data.completed.includes(number)?' complete':'');button.setAttribute('aria-label','Уровень '+number+(model.patternName?', '+model.patternName:'')+(data.completed.includes(number)?', пройден':''));button.appendChild(miniature(number));const label=document.createElement('span');label.textContent=String(number).padStart(2,'0');button.appendChild(label);if(model.patternName){const name=document.createElement('small');name.className='pattern-card-name';name.textContent=model.patternName;button.appendChild(name);}button.onclick=()=>{$('#levels-dialog').close();loadLevel(number,{fresh:data.completed.includes(number)})};return button}));
 requestAnimationFrame(()=>{if($('#levels-dialog').open)$('#chapter-tabs button[aria-pressed="true"]')?.scrollIntoView({block:'nearest',inline:'center'});});
}
function openDialog(id){finishAnimations();document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());$('#'+id).showModal();}
$('#levels-open').onclick=$('#level-heading').onclick=()=>{chapterPage=level.chapter;renderLevels();openDialog('levels-dialog')};
$('#settings-open').onclick=()=>openDialog('settings-dialog');$('#help-open').onclick=()=>openDialog('help-dialog');
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog=>dialog.onclick=event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
function music(){data.music=!data.music;if(!ZenAudio.enable(data.music))data.music=false;$('#sound-toggle').setAttribute('aria-pressed',String(!!data.music));$('#sound-toggle').setAttribute('aria-label',data.music?'Выключить музыку':'Включить музыку');$('#music-setting').setAttribute('aria-pressed',String(!!data.music));$('#music-setting').textContent=data.music?'Включены':'Выключены';save();}
$('#sound-toggle').onclick=$('#music-setting').onclick=music;
$('#volume').value=Number.isFinite(data.volume)?data.volume:35;ZenAudio.setVolume(Number($('#volume').value)/100);$('#volume').oninput=event=>{data.volume=Number(event.target.value);ZenAudio.setVolume(data.volume/100);save()};
$('#sound-toggle').setAttribute('aria-pressed',String(!!data.music));$('#music-setting').setAttribute('aria-pressed',String(!!data.music));$('#music-setting').textContent=data.music?'Включены':'Выключены';
document.addEventListener('keydown',event=>{if(document.querySelector('dialog[open]'))return;if(event.key==='Escape'){selected=null;render();}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();$('#undo').click();}if(event.key.toLowerCase()==='s'&&selected){event.preventDefault();shield(selected);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopGlide();if(drag){state=drag.before;drag=null;}if(effect)effect.finish();save();}});window.addEventListener('pagehide',save);
if('serviceWorker' in navigator){let updateRequested=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateRequested)location.reload()});window.addEventListener('load',async()=>{try{const registration=await navigator.serviceWorker.register('./sw.js');const offer=()=>{if(!registration.waiting||!navigator.serviceWorker.controller)return;$('#app-update').hidden=false;$('#app-update').onclick=()=>{save();updateRequested=true;registration.waiting?.postMessage({type:'ACTIVATE_UPDATE'})}};offer();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',()=>setTimeout(offer,0)));}catch(e){}});}
loadLevel(level.number);
})();

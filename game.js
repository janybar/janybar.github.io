(function(root){
const CAP=4;
function pour(board,from,to){if(from===to||!board[from]?.length||!board[to]||board[to].length===CAP)return null;const a=board[from],b=board[to],color=a[a.length-1];if(b.length&&b[b.length-1]!==color)return null;let n=0;while(n<a.length&&a[a.length-1-n]===color&&n<CAP-b.length)n++;const next=board.map(t=>t.slice());next[to].push(...next[from].splice(-n));return next;}
function won(board){return board.every(t=>!t.length||(t.length===CAP&&t.every(c=>c===t[0])));}
const Puzzle=typeof module!=='undefined'?require('./puzzle.js'):root.WaterPuzzle;
function generate(level,difficulty='classic',emptyTubes=2){return Puzzle.createPuzzle({level,difficulty,extra:emptyTubes}).board;}
function availableMoves(board){
  const result=[];
  board.forEach((tube,from)=>{
    if(!tube.length)return;
    board.forEach((target,to)=>{
      // Moving an entirely uniform vessel to an empty one only renames its position.
      if(!target.length&&tube.every(color=>color===tube[0]))return;
      if(pour(board,from,to))result.push({from,to});
    });
  });
  return result;
}
if(typeof module!=='undefined')module.exports={pour,won,generate,availableMoves};
root.WaterRules={pour,won,generate,availableMoves};
if(typeof document==='undefined')return;
if('serviceWorker' in navigator){
  let requestedUpdate=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requestedUpdate)location.reload();});
  window.addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register('./sw.js');
      const offerUpdate=()=>{
        if(!registration.waiting||!navigator.serviceWorker.controller)return;
        const button=document.querySelector('#app-update');button.hidden=false;
        button.onclick=()=>{stopPour();render();persistRound();requestedUpdate=true;registration.waiting?.postMessage({type:'ACTIVATE_UPDATE'});};
      };
      offerUpdate();registration.addEventListener('updatefound',()=>{registration.installing?.addEventListener('statechange',()=>{setTimeout(offerUpdate,0);});});
    }catch(e){}
  });
}
const $=s=>document.querySelector(s), palette=['#e33e40','#efa900','#168c61','#3267d5','#993fc1','#008aab','#e862a0'];const difficulties=['classic','easy','medium','hard'];let difficulty='classic',level=1,emptyTubes=2,mode='journey';const validLevel=value=>Number.isSafeInteger(Number(value))&&Number(value)>=1&&Number(value)<=999999?Number(value):1;
try{mode=localStorage.getItem('water-mode')==='daily'?'daily':'journey';const savedTubes=Number(localStorage.getItem('water-empty-tubes'));if(Number.isInteger(savedTubes)&&savedTubes>=1&&savedTubes<=4)emptyTubes=savedTubes;const saved=localStorage.getItem('water-difficulty');if(difficulties.includes(saved))difficulty=saved;level=validLevel(localStorage.getItem('water-level-'+difficulty)||(difficulty==='classic'?localStorage.getItem('water-level'):1))}catch(e){}let board,initial,history=[],selected=null,moves=0,locked=false,round=0,activePour=null,activeTubes=null,stopVictory=null,pendingBoard=null,queuedMove=null,puzzle=null;
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function readStorage(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch(e){return fallback;}}
function writeStorage(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
function save(){try{localStorage.setItem('water-mode',mode);localStorage.setItem('water-empty-tubes',emptyTubes);localStorage.setItem('water-difficulty',difficulty);localStorage.setItem('water-level-'+difficulty,level)}catch(e){}}
function sessionKey(){return mode==='daily'?'water-session-daily:'+today():'water-session-journey';}
function persistRound(){if(puzzle)writeStorage(sessionKey(),{id:puzzle.id,board,history:history.slice(-80),moves});}
function currentRecord(){const records=readStorage('water-records-v2',{});return records&&typeof records==='object'?records[puzzle.id]:null;}
function awardWin(){
  const records=readStorage('water-records-v2',{}),old=currentRecord(),rating=Puzzle.stars(moves,puzzle.par);
  const store=records&&typeof records==='object'?records:{};
  store[puzzle.id]={moves:Math.min(old?.moves??Infinity,moves),stars:Math.max(old?.stars||0,rating)};
  writeStorage('water-records-v2',store);return {rating,personalBest:!old||moves<old.moves};
}
function showWin(){
  const reward=awardWin();
  $('#win-moves').textContent=moves+' '+(moves%100>=11&&moves%100<=14?'ходов':moves%10===1?'ход':moves%10>=2&&moves%10<=4?'хода':'ходов');
  $('#win-stars').replaceChildren(...Array.from({length:3},(_,i)=>{const star=document.createElement('span');star.textContent=i<reward.rating?'★':'☆';return star;}));
  $('#win-stars').setAttribute('aria-label',reward.rating+' из 3 звёзд');
  $('#win-record').textContent=reward.personalBest?'Новый личный рекорд':mode==='daily'?'Задача дня решена':'Ещё один цветной узел распутан';
  $('#next').innerHTML=mode==='daily'?'Продолжить путешествие <span>→</span>':'Следующий уровень <span>→</span>';
  persistRound();openOverlay('win');
}
function stopPour(){
  round++;queuedMove=null;pendingBoard=null;activePour?.cancel();activePour=null;activeTubes=null;locked=false;selected=null;
  $('#board').querySelectorAll('.in-flight,.taking-water,.queued-source,.queued-target').forEach(b=>b.classList.remove('in-flight','taking-water','queued-source','queued-target'));
}
function start({resume=true}={}){
  stopVictory?.();stopVictory=null;cancelSolutionCheck();stopPour();
  puzzle=Puzzle.createPuzzle({level,difficulty,extra:emptyTubes,mode,date:today()});
  initial=puzzle.board.map(t=>t.slice());
  const saved=resume?Puzzle.restore(readStorage(sessionKey(),null),puzzle):null;
  board=saved?.board||initial.map(t=>t.slice());history=saved?.history||[];moves=saved?.moves||0;
  $('#win').hidden=true;$('#difficulty').value=difficulty;$('#empty-tubes').value=emptyTubes;$('#level-input').value=level;
  [$('#difficulty'),$('#empty-tubes'),$('#level-input')].forEach(input=>input.disabled=mode==='daily');
  $('#settings-daily-note').hidden=mode!=='daily';
  locked=won(board);render();persistRound();
  if(locked)showWin();
}
function changeMode(next){if(mode===next)return;persistRound();mode=next;save();start();}
function layoutBoard(){
  const wrap=$('.board-wrap'),field=$('#board');
  const mobile=matchMedia('(max-width: 760px), (pointer: coarse) and (max-height: 500px)').matches;
  if(!mobile){field.style.removeProperty('--hit-width');field.style.removeProperty('--vessel-height');field.style.removeProperty('--hit-height');field.style.removeProperty('--board-width');return;}
  const style=getComputedStyle(wrap),width=wrap.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=wrap.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  const count=board?.length||5,gap=12,rowGap=height<260?14:22;let best=null;
  for(let cols=1;cols<=count;cols++){
    const rows=Math.ceil(count/cols),hitWidth=Math.min(76,(width-gap*(cols-1))/cols),hitHeight=Math.min(176,(height-rowGap*(rows-1))/rows,hitWidth*2.55);
    if(hitWidth<44||hitHeight<44)continue;
    const score=hitWidth*hitHeight;
    if(!best||score>best.score)best={score,hitWidth,hitHeight,cols};
  }
  if(!best)best={hitWidth:44,hitHeight:44,cols:Math.max(1,Math.floor((width+gap)/(44+gap)))};
  field.style.setProperty('--board-width',(Math.floor(best.hitWidth)*best.cols+gap*(best.cols-1))+'px');field.style.setProperty('--row-gap',rowGap+'px');
  field.style.setProperty('--hit-width',Math.floor(best.hitWidth)+'px');field.style.setProperty('--hit-height',Math.floor(best.hitHeight)+'px');field.style.setProperty('--vessel-height',Math.floor(best.hitHeight-16)+'px');
}
function setAttributeIfChanged(node,name,value){value=String(value);if(node.getAttribute(name)!==value)node.setAttribute(name,value);}
function setTextIfChanged(node,text){text=String(text);if(node.textContent!==text)node.textContent=text;}
function syncControls(){
  const undo=$('#undo'),disabled=!history.length&&!activeTubes;
  if(undo.disabled!==disabled)undo.disabled=disabled;
  setAttributeIfChanged(undo,'aria-disabled',disabled);
  setAttributeIfChanged($('#restart'),'aria-disabled',false);
  setAttributeIfChanged($('#check-moves'),'aria-disabled',locked);
}
function updateHint(){setTextIfChanged($('#play-hint'),queuedMove?'Следующий ход готов': 'Нажми две пробирки или перетащи воду');}
function syncQueue(){
  [...$('#board').children].forEach((button,index)=>{
    button.classList.toggle('queued-source',queuedMove?.from===index);button.classList.toggle('queued-target',queuedMove?.to===index);
  });updateHint();
}
function updateProgress(){
  const progress=Puzzle.collection(board),record=currentRecord();
  setTextIfChanged($('#progress-label'),progress.complete+' / '+progress.total+' цветов');
  $('#collection-fill').style.transform='scaleX('+(progress.complete/progress.total)+')';
  setTextIfChanged($('#level-title'),mode==='daily'?'ЗАДАЧА ДНЯ':'УРОВЕНЬ');
  setTextIfChanged($('#chapter-name'),puzzle.title);
  setTextIfChanged($('#level'),mode==='daily'?today().slice(5).split('-').reverse().join('.'):String(level).padStart(2,'0'));
  setTextIfChanged($('#par-label'),'Ориентир: '+puzzle.par+' ходов'+(record?' · рекорд '+record.moves:''));
  ['journey','daily'].forEach(name=>setAttributeIfChanged($('#mode-'+name),'aria-pressed',mode===name));
}
function syncSelection(){
  [...$('#board').children].forEach((button,index)=>{
    const isSelected=index===selected;
    if(button.classList.contains('selected')!==isSelected)button.classList.toggle('selected',isSelected);
    setAttributeIfChanged(button,'aria-pressed',isSelected);
    const tube=board[index],complete=tube.length===4&&tube.every(c=>c===tube[0]);
    setAttributeIfChanged(button,'aria-label',`Пробирка ${index+1}: ${complete?'собрана':tube.length+' из 4 слоёв'}${isSelected?', выбрана':''}`);
    if(button.classList.contains('suggested-target'))button.classList.remove('suggested-target');
  });
}
function selectTube(index){selected=index;syncSelection();updateHint();}
function render(){
  updateProgress();setTextIfChanged($('#moves'),moves);syncControls();
  const field=$('#board');
  if(field.children.length!==board.length){
    field.replaceChildren(...board.map((_,index)=>{
      const button=document.createElement('button');button.className='tube-button';button.type='button';
      const glass=document.createElement('span');glass.className='tube';button.appendChild(glass);
      button.onclick=event=>{if(event.detail===0)choose(index)};
      bindDrag(button,index);
      return button;
    }));
  }
  board.forEach((tube,index)=>{
    const button=field.children[index],signature=tube.join(',');
    if(button.dataset.liquid!==signature){
      button.dataset.liquid=signature;button.classList.remove('settling','just-completed');
      button.querySelector('.tube').replaceChildren(...tube.map(color=>{const layer=document.createElement('span');layer.className='water';layer.style.setProperty('--water',palette[color]);return layer;}));
      const complete=tube.length===4&&tube.every(color=>color===tube[0]);
      button.classList.toggle('complete',complete);
      const mark=button.querySelector('.tube-check');
      if(complete&&!mark){const check=document.createElement('span');check.className='tube-check';check.textContent='✓';check.setAttribute('aria-hidden','true');button.appendChild(check);}else if(!complete)mark?.remove();
    }
    if(button.disabled)button.disabled=false;
    button.classList.remove('touch-pressed');
  });
  syncSelection();syncQueue();layoutBoard();
}
function bindDrag(button,index){
  let press=null,dragging=false,hover=null;
  const clear=()=>{press=null;dragging=false;hover=null;button.classList.remove('touch-pressed','dragging');$('#board').querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));};
  button.onpointerdown=event=>{
    if(!event.isPrimary||event.button!==0)return;
    button.classList.add('touch-pressed');
    press={x:event.clientX,y:event.clientY,id:event.pointerId,canDrag:!!(pendingBoard||board)[index]?.length};
    if(press.canDrag)button.setPointerCapture(event.pointerId);
  };
  button.onpointermove=event=>{
    if(!press||!press.canDrag)return;
    if(!dragging&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>9){dragging=true;button.classList.add('dragging');selectTube(index);}
    if(!dragging)return;
    const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest('.tube-button'),candidate=hit?[...$('#board').children].indexOf(hit):null;
    hover=candidate!==null&&candidate!==index&&pour(pendingBoard||board,index,candidate)?candidate:null;
    [...$('#board').children].forEach((node,i)=>node.classList.toggle('drop-target',i===hover));
  };
  button.onpointerup=event=>{
    const from=index,to=hover,didDrag=dragging,didTap=press&&!dragging&&Math.hypot(event.clientX-press.x,event.clientY-press.y)<=9;
    clear();if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);
    if(didDrag){if(to!==null){selectTube(from);choose(to);}else selectTube(null);}else if(didTap)choose(index);
  };
  button.onpointercancel=clear;
  button.onlostpointercapture=clear;
  button.onpointerleave=()=>{if(!press)button.classList.remove('touch-pressed')};
}
async function choose(i){
  if(locked){
    if(!activeTubes||i===activeTubes[0])return;
    const future=pendingBoard||board;
    if(selected!==null&&selected!==i&&pour(future,selected,i)){
      queuedMove={from:selected,to:i};selected=null;syncSelection();syncQueue();return;
    }
    queuedMove=null;selectTube(selected===i?null:(future[i].length?i:null));syncQueue();return;
  }
  if(selected===null){if(board[i].length)selectTube(i);return;}
  if(selected===i){selectTube(null);return;}
  const next=pour(board,selected,i);
  if(!next){selectTube(board[i].length?i:null);return;}
  const from=selected,currentRound=round;
  locked=true;activeTubes=[from,i];pendingBoard=next;selected=null;queuedMove=null;syncControls();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&window.playWaterPour){
    activePour=window.playWaterPour({source:$('#board').children[from],target:$('#board').children[i],colors:board[from],amount:next[i].length-board[i].length,palette});
    await activePour.finished;
  }
  if(currentRound!==round)return;
  const follow=queuedMove;
  activePour=null;activeTubes=null;pendingBoard=null;queuedMove=null;history.push(board.map(t=>t.slice()));board=next;moves++;locked=won(board);render();persistRound();
  const destination=$('#board').children[i];destination.classList.add('settling');if(next[i].length===4&&next[i].every(c=>c===next[i][0]))destination.classList.add('just-completed');
  if(locked){setTimeout(()=>{if(currentRound===round)showWin();},200);}
  else if(follow&&pour(board,follow.from,follow.to)){selectTube(follow.from);choose(follow.to);}
}
const themeSelect=$('#theme-select');const themes=['light','dark','retro','80s','retrofuturism','hacker','linux','gruvbox'];let theme='light';try{const saved=localStorage.getItem('water-theme');theme=themes.includes(saved)?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}function applyTheme(){document.documentElement.classList.toggle('dark',theme!=='light');document.documentElement.dataset.theme=theme;themeSelect.value=theme}themeSelect.onchange=()=>{theme=themes.includes(themeSelect.value)?themeSelect.value:'light';try{localStorage.setItem('water-theme',theme)}catch(e){}applyTheme()};applyTheme();
$('#undo').onclick=()=>{
  if(activeTubes){stopPour();render();persistRound();return;}
  if(!locked&&history.length){board=history.pop();moves=Math.max(0,moves-1);selected=null;render();persistRound();}
};
$('#restart').onclick=()=>{stopPour();board=initial.map(t=>t.slice());history=[];moves=0;render();persistRound();};
$('#next').onclick=()=>{closeOverlay('win');if(mode==='daily'){mode='journey';save();start();}else{level=level<999999?level+1:1;save();start({resume:false});}};
$('#replay').onclick=()=>{closeOverlay('win');start({resume:false});};
$('#mode-journey').onclick=()=>changeMode('journey');$('#mode-daily').onclick=()=>changeMode('daily');
$('#level-form').onsubmit=e=>{e.preventDefault();const input=$('#level-input');if(!input.reportValidity())return;if(mode==='journey'){persistRound();difficulty=$('#difficulty').value;level=validLevel(input.value);emptyTubes=Number($('#empty-tubes').value);save();start();}closeSettings()};$('#difficulty').onchange=e=>{const chosen=e.target.value;try{$('#level-input').value=chosen===difficulty?level:validLevel(localStorage.getItem('water-level-'+chosen)||(chosen==='classic'?localStorage.getItem('water-level'):1))}catch(err){$('#level-input').value=chosen===difficulty?level:1}};function openOverlay(id){
  stopVictory?.();stopVictory=null;
  document.querySelectorAll('.overlay').forEach(node=>node.hidden=node.id!==id);
  $('.app').inert=true;document.body.classList.add('modal-open');
  const panel=$('#'+id);panel.hidden=false;(panel.querySelector('.close')||panel.querySelector('button')).focus({preventScroll:true});
  if(id==='win'&&window.playVictoryFractal)stopVictory=window.playVictoryFractal();
}
function closeOverlay(id,trigger){if(id==='win'){stopVictory?.();stopVictory=null;}$('#'+id).hidden=true;$('.app').inert=false;document.body.classList.remove('modal-open');if(trigger)$('#'+trigger).focus({preventScroll:true});}
let suggestedMove=null,solverWorker=null,solverTimeout=null,solverRequest=0;
function cancelSolutionCheck(){
  solverRequest++;solverWorker?.terminate();solverWorker=null;clearTimeout(solverTimeout);solverTimeout=null;
  $('#moves-check').querySelector('.modal').setAttribute('aria-busy','false');
}
function checkSolution(longer=false){
  if(locked)return;
  cancelSolutionCheck();const request=solverRequest;
  suggestedMove=null;$('#show-move').hidden=true;$('#moves-undo').hidden=true;$('#retry-solution').hidden=true;
  $('#moves-title').textContent='Ищу решение…';
  $('#moves-description').textContent='Проверяю путь до полностью собранного уровня. Можно закрыть окно и продолжить игру.';
  $('#moves-check').querySelector('.modal').setAttribute('aria-busy','true');openOverlay('moves-check');
  function result(answer){
    if(request!==solverRequest)return;
    solverWorker?.terminate();solverWorker=null;clearTimeout(solverTimeout);solverTimeout=null;
    $('#moves-check').querySelector('.modal').setAttribute('aria-busy','false');
    const status=answer.status;
    suggestedMove=status==='solvable'?answer.path[0]:null;
    $('#moves-title').textContent=status==='solved'?'Уровень собран!':status==='solvable'?'Решение найдено':status==='unsolvable'?'Из этой позиции решения нет':'Ответ пока не найден';
    $('#moves-description').textContent=status==='solved'?'Все цвета уже на своих местах.':status==='solvable'?'Минимальное число переливаний до победы: '+answer.path.length+'. Можно подсветить первый ход кратчайшего решения.':status==='unsolvable'?'Проверены все варианты продолжения: собрать цвета из этой позиции невозможно. Отмени один или несколько ходов либо начни уровень заново.':status==='unknown'?(answer.reason==='memory'?'Поиск достиг лимита памяти. ':'За отведённое время ответ не найден. ')+'Это не означает, что уровень зашёл в тупик. Можно запустить более долгую проверку.':'Не удалось выполнить проверку. Попробуй ещё раз.';
    $('#show-move').hidden=!suggestedMove;
    $('#moves-undo').hidden=!history.length||status==='solvable'||status==='solved';
    $('#retry-solution').hidden=status!=='unknown'&&status!=='error';
  }
  try{
    solverWorker=new Worker('./solver-worker.js');
    solverWorker.onmessage=event=>{if(event.data.status!=='searching')result(event.data)};
    solverWorker.onerror=event=>{event.preventDefault();result({status:'error'})};
    solverTimeout=setTimeout(()=>result({status:'unknown'}),longer?32000:10000);
    solverWorker.postMessage({board:board.map(t=>t.slice()),longer});
  }catch(error){result({status:'error'});}
}
$('#check-moves').onclick=()=>checkSolution();
$('#retry-solution').onclick=()=>checkSolution(true);
const closeMoves=()=>{cancelSolutionCheck();closeOverlay('moves-check','check-moves')};
$('#moves-close').onclick=$('#moves-done').onclick=closeMoves;
$('#moves-check').onclick=e=>{if(e.target===$('#moves-check'))closeMoves()};
$('#show-move').onclick=()=>{
  if(!suggestedMove)return;
  closeMoves();selected=suggestedMove.from;render();
  $('#board').children[suggestedMove.to].classList.add('suggested-target');
  $('#play-hint').textContent='Первый ход решения: перелей в подсвеченную пробирку';
};
$('#moves-undo').onclick=()=>{closeMoves();$('#undo').click()};
const closeSettings=()=>closeOverlay('settings','settings-open');
$('#settings-open').onclick=()=>{$('#difficulty').value=difficulty;$('#empty-tubes').value=emptyTubes;$('#level-input').value=level;openOverlay('settings')};
$('#settings-close').onclick=closeSettings;
$('#settings').onclick=e=>{if(e.target===$('#settings'))closeSettings()};
$('#help-open').onclick=()=>openOverlay('help');
$('#help-close').onclick=$('#help-done').onclick=()=>closeOverlay('help','help-open');
$('#help').onclick=e=>{if(e.target===$('#help'))closeOverlay('help','help-open')};
document.addEventListener('keydown',e=>{
  const overlay=document.querySelector('.overlay:not([hidden])');if(!overlay)return;
  if(e.key==='Escape'){if(overlay.id==='settings')closeSettings();if(overlay.id==='help')closeOverlay('help','help-open');if(overlay.id==='moves-check')closeMoves();}
  if(e.key==='Tab'){
    const controls=[...overlay.querySelectorAll('button,input,select')].filter(node=>!node.disabled&&!node.hidden),first=controls[0],last=controls[controls.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
const viewport=window.visualViewport;
function updateViewport(){document.documentElement.style.setProperty('--visual-height',(viewport?.height||innerHeight)+'px');document.documentElement.style.setProperty('--visual-top',(viewport?.offsetTop||0)+'px');}
viewport?.addEventListener('resize',updateViewport);viewport?.addEventListener('scroll',updateViewport);updateViewport();
new ResizeObserver(layoutBoard).observe($('.board-wrap'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){queuedMove=null;activePour?.finish?.();persistRound();}});
window.addEventListener('pagehide',persistRound);
start();
})(typeof globalThis!=='undefined'?globalThis:this);

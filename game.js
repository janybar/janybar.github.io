(function(root){
const CAP=4;
function pour(board,from,to){if(from===to||!board[from]?.length||!board[to]||board[to].length===CAP)return null;const a=board[from],b=board[to],color=a[a.length-1];if(b.length&&b[b.length-1]!==color)return null;let n=0;while(n<a.length&&a[a.length-1-n]===color&&n<CAP-b.length)n++;const next=board.map(t=>t.slice());next[to].push(...next[from].splice(-n));return next;}
function won(board){return board.every(t=>!t.length||(t.length===CAP&&t.every(c=>c===t[0])));}
function generate(level,difficulty="classic",emptyTubes=2){let seed=(level*2654435761)>>>0;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n};const colors=({easy:3,medium:5,hard:7})[difficulty] || Math.min(3+Math.floor((level-1)/3),7);let board=Array.from({length:colors},(_,i)=>Array(4).fill(i)).concat(Array.from({length:emptyTubes},()=>[]));for(let step=0;step<80+level%20;step++){let options=[];for(let i=0;i<board.length;i++){const a=board[i];if(!a.length)continue;let run=1;while(run<a.length&&a[a.length-1-run]===a[a.length-1])run++;for(let j=0;j<board.length;j++){if(i===j)continue;const b=board[j];for(let n=1;n<=Math.min(run,4-b.length);n++){if(n<a.length&&a[a.length-n-1]!==a[a.length-1])continue;if(a.length!==4&&b.length&&b[b.length-1]===a[a.length-1])continue;if(n===a.length&&!b.length)continue;options.push([i,j,n]);}}}if(!options.length)break;const [i,j,n]=options[rand(options.length)];board[j].push(...board[i].splice(-n));}if(won(board)) return generate(level+101,difficulty,emptyTubes);return board;}
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
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});}
const $=s=>document.querySelector(s), palette=['#e33e40','#efa900','#168c61','#3267d5','#993fc1','#008aab','#e862a0'];const difficulties=['classic','easy','medium','hard'];let difficulty='classic',level=1,emptyTubes=2;const validLevel=value=>Number.isSafeInteger(Number(value))&&Number(value)>=1&&Number(value)<=999999?Number(value):1;
try{const savedTubes=Number(localStorage.getItem('water-empty-tubes'));if(Number.isInteger(savedTubes)&&savedTubes>=1&&savedTubes<=4)emptyTubes=savedTubes;const saved=localStorage.getItem('water-difficulty');if(difficulties.includes(saved))difficulty=saved;level=validLevel(localStorage.getItem('water-level-'+difficulty)||(difficulty==='classic'?localStorage.getItem('water-level'):1))}catch(e){}let board,initial,history=[],selected=null,moves=0,locked=false,round=0,activePour=null,activeTubes=null,stopVictory=null;
function save(){try{localStorage.setItem('water-empty-tubes',emptyTubes);localStorage.setItem('water-difficulty',difficulty);localStorage.setItem('water-level-'+difficulty,level)}catch(e){}}
function start(){stopVictory?.();stopVictory=null;cancelSolutionCheck();round++;activePour?.cancel();activePour=null;activeTubes=null;board=generate(level,difficulty,emptyTubes);initial=board.map(t=>t.slice());history=[];moves=0;selected=null;locked=false;$('#win').hidden=true;$('#difficulty').value=difficulty;$('#empty-tubes').value=emptyTubes;$('#level-input').value=level;render();}
function layoutBoard(){
  const wrap=$('.board-wrap'),field=$('#board');
  const mobile=matchMedia('(max-width: 760px), (pointer: coarse) and (max-height: 500px)').matches;
  if(!mobile){field.style.removeProperty('--hit-width');field.style.removeProperty('--vessel-height');field.style.removeProperty('--hit-height');return;}
  const style=getComputedStyle(wrap),width=wrap.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=wrap.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  const count=board?.length||5,gap=12,rowGap=22;let best=null;
  for(let cols=1;cols<=count;cols++){
    const rows=Math.ceil(count/cols),hitWidth=Math.min(76,(width-gap*(cols-1))/cols),hitHeight=Math.min(176,(height-rowGap*(rows-1))/rows,hitWidth*2.55);
    if(hitWidth<44||hitHeight<Math.min(76,Math.max(44,height/3)))continue;
    const score=hitWidth*hitHeight;
    if(!best||score>best.score)best={score,hitWidth,hitHeight};
  }
  if(!best)best={hitWidth:44,hitHeight:84};
  field.style.setProperty('--hit-width',Math.floor(best.hitWidth)+'px');field.style.setProperty('--hit-height',Math.floor(best.hitHeight)+'px');field.style.setProperty('--vessel-height',Math.floor(best.hitHeight-16)+'px');
}
function setAttributeIfChanged(node,name,value){value=String(value);if(node.getAttribute(name)!==value)node.setAttribute(name,value);}
function setTextIfChanged(node,text){text=String(text);if(node.textContent!==text)node.textContent=text;}
function syncControls(){
  const undo=$('#undo');if(undo.disabled!==!history.length)undo.disabled=!history.length;
  setAttributeIfChanged(undo,'aria-disabled',locked||!history.length);
  setAttributeIfChanged($('#restart'),'aria-disabled',locked);
  setAttributeIfChanged($('#check-moves'),'aria-disabled',locked);
}
function updateHint(){setTextIfChanged($('#play-hint'),'Выбери пробирку, затем другую');}
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
  setTextIfChanged($('#level'),String(level).padStart(2,'0'));setTextIfChanged($('#moves'),moves);syncControls();
  const field=$('#board');
  if(field.children.length!==board.length){
    field.replaceChildren(...board.map((_,index)=>{
      const button=document.createElement('button');button.className='tube-button';button.type='button';
      const glass=document.createElement('span');glass.className='tube';button.appendChild(glass);
      button.onclick=()=>choose(index);
      button.onpointerdown=event=>{if(event.isPrimary&&!button.disabled){button.classList.add('touch-pressed');}};
      const release=()=>button.classList.remove('touch-pressed');
      button.onpointerup=button.onpointercancel=button.onpointerleave=release;
      button.onlostpointercapture=release;
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
  syncSelection();updateHint();layoutBoard();
}
async function choose(i){
  if(locked){
    if(!activeTubes||activeTubes.includes(i)||!board[i].length)return;
    selectTube(selected===i?null:i);return;
  }
  if(selected===null){if(board[i].length)selectTube(i);return;}
  if(selected===i){selectTube(null);return;}
  const next=pour(board,selected,i);
  if(!next){selectTube(board[i].length?i:null);return;}
  const from=selected,currentRound=round;
  locked=true;activeTubes=[from,i];selected=null;
  activeTubes.forEach(index=>{$('#board').children[index].disabled=true});syncControls();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&window.playWaterPour){
    activePour=window.playWaterPour({source:$('#board').children[from],target:$('#board').children[i],colors:board[from],amount:next[i].length-board[i].length,palette});
    await activePour.finished;
  }
  if(currentRound!==round)return;
  activePour=null;activeTubes=null;history.push(board.map(t=>t.slice()));board=next;moves++;locked=won(board);render();
  const destination=$('#board').children[i];destination.classList.add('settling');if(next[i].length===4&&next[i].every(c=>c===next[i][0]))destination.classList.add('just-completed');
  if(locked){setTimeout(()=>{if(currentRound!==round)return;$('#win-moves').textContent=moves+' '+(moves%100>=11&&moves%100<=14?'ходов':moves%10===1?'ход':moves%10>=2&&moves%10<=4?'хода':'ходов');openOverlay('win');},300)}
}
const themeSelect=$('#theme-select');const themes=['light','dark','retro','80s','retrofuturism','hacker','linux','gruvbox'];let theme='light';try{const saved=localStorage.getItem('water-theme');theme=themes.includes(saved)?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}function applyTheme(){document.documentElement.classList.toggle('dark',theme!=='light');document.documentElement.dataset.theme=theme;themeSelect.value=theme}themeSelect.onchange=()=>{theme=themes.includes(themeSelect.value)?themeSelect.value:'light';try{localStorage.setItem('water-theme',theme)}catch(e){}applyTheme()};applyTheme();
$('#undo').onclick=()=>{if(!locked&&history.length){board=history.pop();moves=Math.max(0,moves-1);selected=null;render()}};$('#restart').onclick=()=>{if(locked)return;board=initial.map(t=>t.slice());history=[];moves=0;selected=null;render()};$('#next').onclick=()=>{closeOverlay('win');level=level<999999?level+1:1;save();start()};$('#level-form').onsubmit=e=>{e.preventDefault();const input=$('#level-input');if(!input.reportValidity())return;difficulty=$('#difficulty').value;level=validLevel(input.value);emptyTubes=Number($('#empty-tubes').value);save();start();closeSettings()};$('#difficulty').onchange=e=>{const chosen=e.target.value;try{$('#level-input').value=chosen===difficulty?level:validLevel(localStorage.getItem('water-level-'+chosen)||(chosen==='classic'?localStorage.getItem('water-level'):1))}catch(err){$('#level-input').value=chosen===difficulty?level:1}};function openOverlay(id){
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
start();
})(typeof globalThis!=='undefined'?globalThis:this);

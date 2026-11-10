(function(){
'use strict';
const $=selector=>document.querySelector(selector),{ARTWORKS,makeArt}=ColorArt,C=ColorCore;
const iconPaths={back:'M15 5l-7 7 7 7M8 12h13',close:'M6 6l12 12M18 6L6 18',more:'M5 12h.01M12 12h.01M19 12h.01',hint:'M9 18h6M10 21h4M8 13a6 6 0 1 1 8 0c-1.5 1-2 2-2 3h-4c0-1-0.5-2-2-3',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2'};
document.querySelectorAll('[data-icon]').forEach(node=>node.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[node.dataset.icon]}"/></svg>`);
let database;try{database=JSON.parse(localStorage.getItem('quiet-color-v1'))}catch(e){}
if(!database||typeof database!=='object')database={};
if(!database.progress||typeof database.progress!=='object')database.progress={};
if(!Array.isArray(database.favorites))database.favorites=[];
let tab='library',category='Все',art=null,session=null,galleryScroll=0,view={scale:1,x:0,y:0},base=1,toastTimer=null,completeTimer=null;
const artCache=new Map(),previewCache=new Map(),getArt=id=>{if(!artCache.has(id))artCache.set(id,makeArt(id));return artCache.get(id)};
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const daily=()=>C.dailyId(ARTWORKS,today());
const saveDatabase=()=>{try{localStorage.setItem('quiet-color-v1',JSON.stringify(database))}catch(e){}};
function saveProgress(){if(art&&session){database.progress[art.id]=C.serialize(session);saveDatabase();}}
function svgMarkup(model,{full=true,state=null,numbers=false,editor=false}={}){
 const defs=editor?'<defs><pattern id="selected-pattern" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#e1eadd"/><circle cx="1.5" cy="1.5" r=".7" fill="#b5c8b2"/></pattern></defs>':'';
 const regions=model.regions.map(r=>{
  const filled=full||state?.filled.has(r.id),fill=filled?model.palette[r.color]:'#fffefa';
  const path=`<path ${editor?'data-region="'+r.id+'" class="color-region'+(filled?' painted':'')+'" style="'+(filled?'fill:'+fill:'')+'" tabindex="-1" aria-label="Область '+(r.id+1)+', цвет '+(r.color+1)+'" role="button"':'fill="'+fill+'" stroke="#49685d50" stroke-width=".65" vector-effect="non-scaling-stroke"'} d="${r.d}" ${r.transform?'transform="'+r.transform+'"':''}/>`;
  return path+(numbers?`<text class="region-number" data-number="${r.id}" x="${r.x}" y="${r.y}" font-size="${r.size}" ${filled?'hidden="true"':''}>${r.color+1}</text>`:'');
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" class="color-svg" ${editor?'aria-label="'+model.title+' — раскраска по номерам"':'aria-hidden="true"'}>${defs}${regions}</svg>`;
}
function preview(model){if(!previewCache.has(model.id))previewCache.set(model.id,svgMarkup(model));return previewCache.get(model.id);}
function renderGallery(){
 document.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.tab===tab));
 $('#welcome').hidden=tab!=='library';$('#category-tabs').hidden=tab!=='library';
 $('#collection-title').textContent=tab==='works'?'Твоя коллекция':tab==='daily'?'Цвет сегодняшнего дня':'Найди своё настроение';
 $('#collection-eyebrow').textContent=tab==='works'?'КАЖДАЯ КАРТИНА ХРАНИТ ТВОЁ НАСТРОЕНИЕ':tab==='daily'?'ОДИН ДЕНЬ — ОДНА МАЛЕНЬКАЯ ИСТОРИЯ':'МИРЫ, В КОТОРЫЕ ПРИЯТНО ПОГРУЗИТЬСЯ';
 document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.category===category));
 const workCount=ARTWORKS.filter(info=>C.createSession(getArt(info.id),database.progress[info.id]).filled.size>0).length;
 $('#work-count').textContent=workCount||'';
 let pages=ARTWORKS.filter(info=>{
  if(tab==='daily')return info.id===daily();
  if(tab==='works')return C.createSession(getArt(info.id),database.progress[info.id]).filled.size>0;
  return category==='Все'||info.category===category||category==='Избранное'&&database.favorites.includes(info.id);
 });
 if(tab==='works')pages=pages.slice().sort((a,b)=>(database.progress[b.id]?.updatedAt||0)-(database.progress[a.id]?.updatedAt||0));
 $('#collection-count').textContent=pages.length?pages.length+' '+(pages.length===1?'картина':pages.length<5?'картины':'картин'):'';
 $('#art-grid').replaceChildren(...pages.map(info=>{
  const model=getArt(info.id),state=C.createSession(model,database.progress[info.id]),percent=Math.round(state.filled.size/model.regions.length*100),card=document.createElement('article');card.className='art-card';
  const picture=tab==='works'&&percent<100?svgMarkup(model,{full:false,state}):preview(model);
  card.innerHTML=`<button class="art-open" aria-label="${percent?'Продолжить':'Раскрасить'}: ${info.title}"><div class="art-image">${picture}${percent?'<span class="art-tag">'+(percent===100?'✓ Готово':percent+'% · Продолжить')+'</span>':''}</div><h3>${info.title}</h3><div class="art-meta"><span>${info.category}</span><span>${model.regions.length} областей</span></div>${percent&&percent<100?'<div class="art-progress"><span style="transform:scaleX('+percent/100+')"></span></div>':''}</button><button class="favorite-button" aria-label="${database.favorites.includes(info.id)?'Убрать из избранного':'В избранное'}: ${info.title}" aria-pressed="${database.favorites.includes(info.id)}">${database.favorites.includes(info.id)?'♥':'♡'}</button>`;
  card.querySelector('.art-open').onclick=()=>navigateArt(info.id);
  card.querySelector('.favorite-button').onclick=()=>{database.favorites=database.favorites.includes(info.id)?database.favorites.filter(id=>id!==info.id):[...database.favorites,info.id];saveDatabase();renderGallery();};return card;
 }));
 $('#empty-state').hidden=pages.length>0;
 const dailyArt=getArt(daily());$('#daily-title').textContent=dailyArt.title;$('#daily-date').textContent=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})+' · момент для себя';$('#daily-preview').innerHTML=preview(dailyArt);
}
function chooseTab(next){tab=next;category='Все';renderGallery();window.scrollTo({top:0,behavior:'auto'});}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>chooseTab(button.dataset.tab));
document.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>{category=button.dataset.category;renderGallery()});
$('#daily-open').onclick=()=>navigateArt(daily());$('#empty-library').onclick=()=>chooseTab('library');
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,2300);}
function setView(next){view=C.clampView(next,base,base);$('#art-surface').style.transform=`translate(${view.x}px,${view.y}px) scale(${view.scale})`;$('#zoom-reset').textContent=Math.round(view.scale*100)+'%';}
function zoomAt(scale,x=base/2,y=base/2){const target=Math.min(8,Math.max(1,scale));setView({scale:target,x:x-(x-view.x)*target/view.scale,y:y-(y-view.y)*target/view.scale});}
function fitStage(){
 if($('#editor-view').hidden)return;
 const stage=$('#painting-stage').getBoundingClientRect(),next=Math.max(100,Math.floor(Math.min(stage.width-28,stage.height-28,680))),old=base;
 base=next;$('#canvas-window').style.width=base+'px';$('#canvas-window').style.height=base+'px';
 setView({scale:view.scale,x:view.x*base/old,y:view.y*base/old});
}
function buildPalette(){
 $('#palette').replaceChildren(...art.palette.map((hex,color)=>{
  const button=document.createElement('button');button.className='color-button';button.style.setProperty('--swatch',hex);button.style.setProperty('--ink',C.contrast(hex));button.dataset.color=color;
  button.innerHTML='<span class="color-number">'+(color+1)+'</span><span class="color-remaining"></span>';
  button.hidden=!art.regions.some(r=>r.color===color);
  button.onclick=()=>{if(!C.counts(art,session)[color])return;session.selected=color;updatePainting();saveProgress();};return button;
 }));
}
function updatePainting(){
 const count=session.filled.size,percent=Math.round(count/art.regions.length*100),remaining=C.counts(art,session);
 $('#painted-count').textContent=count;$('#region-count').textContent=art.regions.length;$('#editor-percent').textContent=percent+'%';$('#editor-fill').style.transform='scaleX('+count/art.regions.length+')';
 const paths=$('#art-surface').querySelectorAll('[data-region]'),numbers=$('#art-surface').querySelectorAll('[data-number]');
 art.regions.forEach((r,i)=>{
  const done=session.filled.has(r.id),matching=!done&&r.color===session.selected,path=paths[i];
  path.classList.toggle('painted',done);path.classList.toggle('matching',matching);path.classList.remove('hinted');
  if(done)path.style.fill=art.palette[r.color];else path.style.removeProperty('fill');
  path.setAttribute('tabindex',matching?'0':'-1');path.setAttribute('aria-label',`Область ${r.id+1}, цвет ${r.color+1}${done?', раскрашена':''}`);
  numbers[i].style.display=done?'none':'';numbers[i].classList.toggle('matching',matching);
 });
 [...$('#palette').children].forEach((button,color)=>{
  button.classList.toggle('done',remaining[color]===0);button.setAttribute('aria-pressed',String(session.selected===color));button.setAttribute('aria-label',remaining[color]?`Цвет ${color+1}, осталось ${remaining[color]} областей`:`Цвет ${color+1}, готово`);button.disabled=remaining[color]===0;
  button.querySelector('.color-number').textContent=remaining[color]===0?'✓':color+1;button.querySelector('.color-remaining').textContent=remaining[color];
 });
 $('#hint-button').disabled=session.selected===null;$('#paint-instruction').textContent=session.selected===null?'Все цвета на своих местах':`Цвет ${session.selected+1} · осталось ${remaining[session.selected]} областей`;
}
function fillRegion(id){
 if(!art||!session)return;
 const result=C.paint(art,session,id);
 if(result.status==='wrong'){notify('Для этой области нужен цвет '+(result.color+1));return;}
 if(result.status==='ignored')return;
 updatePainting();saveProgress();
 if(result.colorDone&&session.selected!==null)$('#palette').children[session.selected].scrollIntoView({block:'nearest',inline:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 if(result.status==='complete'){
  $('#complete-art').innerHTML=preview(art);$('#complete-caption').textContent=art.title+' · '+art.regions.length+' раскрашенных областей';
  clearTimeout(completeTimer);completeTimer=setTimeout(()=>openDialog('complete-dialog'),matchMedia('(prefers-reduced-motion: reduce)').matches?0:450);
 }
}
function openArt(id){
 saveProgress();clearTimeout(completeTimer);pointers.clear();gesture=null;art=getArt(id);session=C.createSession(art,database.progress[id]);
 $('#gallery-view').hidden=true;$('#editor-view').hidden=false;document.body.style.overflow='hidden';$('#art-title').textContent=art.title;$('#actions-title').textContent=art.title;
 $('#art-surface').innerHTML=svgMarkup(art,{full:false,state:session,numbers:true,editor:true});
 $('#art-surface').querySelectorAll('[data-region]').forEach(path=>path.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();fillRegion(Number(path.dataset.region))}});
 buildPalette();view={scale:1,x:0,y:0};fitStage();updatePainting();$('#editor-back').focus({preventScroll:true});
}
function navigateArt(id){galleryScroll=scrollY;history.pushState(null,'',location.pathname+location.search+'#paint/'+id);openArt(id);}
function showGallery(){saveProgress();clearTimeout(completeTimer);pointers.clear();gesture=null;$('#editor-view').hidden=true;$('#gallery-view').hidden=false;document.body.style.overflow='';art=null;session=null;renderGallery();requestAnimationFrame(()=>scrollTo(0,galleryScroll));}
function route(){const match=location.hash.match(/^#paint\/([\w-]+)$/);if(match&&ARTWORKS.some(a=>a.id===match[1]))openArt(match[1]);else showGallery();}
$('#editor-back').onclick=()=>{history.replaceState(null,'',location.pathname+location.search);showGallery();};window.addEventListener('popstate',route);
$('#zoom-in').onclick=()=>zoomAt(view.scale*1.4);$('#zoom-out').onclick=()=>zoomAt(view.scale/1.4);$('#zoom-reset').onclick=()=>setView({scale:1,x:0,y:0});
const pointers=new Map();let gesture=null;
const localPoint=event=>{const rect=$('#canvas-window').getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top}};
$('#canvas-window').onpointerdown=event=>{
 if(event.button!==0)return;const p=localPoint(event);pointers.set(event.pointerId,p);event.currentTarget.setPointerCapture(event.pointerId);
 if(pointers.size===1)gesture={kind:'tap',start:p,last:p,region:event.target.closest('[data-region]')?.dataset.region};
 else{const [a,b]=[...pointers.values()];gesture={kind:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},view:{...view}};}
};
$('#canvas-window').onpointermove=event=>{
 if(!pointers.has(event.pointerId)||!gesture)return;const p=localPoint(event);pointers.set(event.pointerId,p);
 if(pointers.size>=2){
  const [a,b]=[...pointers.values()],center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(gesture.kind!=='pinch')return;
  const scale=Math.min(8,Math.max(1,gesture.view.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance)));
  setView({scale,x:center.x-(gesture.center.x-gesture.view.x)/gesture.view.scale*scale,y:center.y-(gesture.center.y-gesture.view.y)/gesture.view.scale*scale});
 }else{
  if(gesture.kind==='tap'&&Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>6)gesture.kind='pan';
  if(gesture.kind==='pan')setView({...view,x:view.x+p.x-gesture.last.x,y:view.y+p.y-gesture.last.y});gesture.last=p;
 }
};
function endPointer(event,cancelled){
 if(!pointers.has(event.pointerId))return;const tap=!cancelled&&pointers.size===1&&gesture?.kind==='tap'?gesture.region:null;
 pointers.delete(event.pointerId);if(pointers.size===0)gesture=null;else{gesture={kind:'pan',last:[...pointers.values()][0]};}
 if(tap!==null&&tap!==undefined)fillRegion(Number(tap));
}
$('#canvas-window').onpointerup=event=>endPointer(event,false);$('#canvas-window').onpointercancel=event=>endPointer(event,true);$('#canvas-window').onlostpointercapture=event=>{if(pointers.has(event.pointerId))endPointer(event,true)};
$('#canvas-window').addEventListener('wheel',event=>{event.preventDefault();const p=localPoint(event);zoomAt(view.scale*Math.exp(-event.deltaY*.0015),p.x,p.y);},{passive:false});
new ResizeObserver(fitStage).observe($('#painting-stage'));
$('#hint-button').onclick=()=>{
 const choices=art.regions.filter(r=>r.color===session.selected&&!session.filled.has(r.id));if(!choices.length)return;
 const center={x:(base/2-view.x)/view.scale/base*600,y:(base/2-view.y)/view.scale/base*600};choices.sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y));
 const target=choices[0],scale=Math.min(5,Math.max(2.5,view.scale));setView({scale,x:base/2-target.x/600*base*scale,y:base/2-target.y/600*base*scale});
 $('#art-surface').querySelector(`[data-region="${target.id}"]`).classList.add('hinted');$('#paint-instruction').textContent='Нужная область выделена золотым контуром';
};
function openDialog(id){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());$('#'+id).showModal();}
document.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
$('#settings-open').onclick=()=>openDialog('settings-dialog');$('#how-open').onclick=()=>openDialog('help-dialog');$('#editor-more').onclick=()=>openDialog('art-actions');
$('#reset-open').onclick=()=>openDialog('reset-dialog');$('#reset-confirm').onclick=()=>{$('#reset-dialog').close();const id=art.id;delete database.progress[id];saveDatabase();session=null;openArt(id)};
$('#complete-gallery').onclick=()=>{$('#complete-dialog').close();tab='works';history.replaceState(null,'',location.pathname);showGallery()};
async function exportArt(){
 if(!art||!session)return;const model=art,state=session,snapshot=svgMarkup(model,{full:false,state}),svgURL=URL.createObjectURL(new Blob([snapshot],{type:'image/svg+xml'}));
 try{
  const image=new Image();image.src=svgURL;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=1200;canvas.getContext('2d').drawImage(image,0,0,1200,1200);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG export failed');
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='quiet-color-'+model.id+'.png';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Рисунок готов к сохранению');
 }catch(e){notify('Не удалось сохранить рисунок. Попробуй ещё раз.')}finally{URL.revokeObjectURL(svgURL);}
}
$('#export-button').onclick=$('#complete-export').onclick=exportArt;
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){const choice=['light','dark','system'].includes(database.theme)?database.theme:'system';document.documentElement.dataset.theme=choice==='system'?(systemTheme.matches?'dark':'light'):choice;$('#theme-select').value=choice;document.querySelector('meta[name="theme-color"]').content=document.documentElement.dataset.theme==='dark'?'#172523':'#f7f8f4';}
$('#theme-select').onchange=event=>{database.theme=event.target.value;saveDatabase();applyTheme()};systemTheme.addEventListener('change',applyTheme);
document.addEventListener('keydown',event=>{if($('#editor-view').hidden||document.querySelector('dialog[open]'))return;if(event.key==='+'||event.key==='='){event.preventDefault();zoomAt(view.scale*1.3)}if(event.key==='-')zoomAt(view.scale/1.3);if(event.key==='0')setView({scale:1,x:0,y:0});});
window.addEventListener('pagehide',saveProgress);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveProgress()});
if('serviceWorker' in navigator){
 let updateRequested=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(updateRequested)location.reload()});
 window.addEventListener('load',async()=>{try{
  const registration=await navigator.serviceWorker.register('./sw.js');const offer=()=>{if(!registration.waiting||!navigator.serviceWorker.controller)return;$('#app-update').hidden=false;$('#app-update').onclick=()=>{saveProgress();updateRequested=true;registration.waiting?.postMessage({type:'ACTIVATE_UPDATE'})}};
  offer();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',()=>setTimeout(offer,0)));
 }catch(e){}});
}
applyTheme();renderGallery();route();
})();

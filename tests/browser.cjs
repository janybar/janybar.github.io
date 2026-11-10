// Browser integration checks. Start HTTP on 8765 and Chrome with --remote-debugging-port=9226.
const assert=require('node:assert/strict');
const fs=require('node:fs');
let WebSocket;try{WebSocket=require('ws')}catch{WebSocket=require('/usr/share/nodejs/ws')}
const {solve}=require('../solver.js');
(async()=>{
 const targets=await(await fetch('http://127.0.0.1:9226/json')).json();
 const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>socket.once('open',r));
 let serial=0;const pending=new Map(),errors=[];
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
 socket.on('message',async raw=>{
  const message=JSON.parse(raw);
  if(message.id){const p=pending.get(message.id);if(p){pending.delete(message.id);message.error?p.reject(message.error):p.resolve(message.result)}}
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
  if(message.method==='Fetch.requestPaused'){
   const {requestId}=message.params;
   try{
    const result=await call('Fetch.getResponseBody',{requestId});
    const body=(result.base64Encoded?Buffer.from(result.body,'base64').toString():result.body).replace('})(typeof globalThis', 'window.__waterTest=code=>eval(code);})(typeof globalThis');
    await call('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(body).toString('base64')});
   }catch(e){errors.push('Test instrumentation: '+e.message);await call('Fetch.continueRequest',{requestId})}
  }
 });
 const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const game=expression=>run('window.__waterTest('+JSON.stringify(expression)+')');
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const until=async(expression,ms=5000)=>{const deadline=Date.now()+ms;while(Date.now()<deadline){if(await run(expression))return;await sleep(25)}throw Error('Timed out: '+expression)};
 const waitGame=()=>until("typeof window.__waterTest==='function'&&document.querySelectorAll('.tube-button').length>0");
 const reloadPage=async()=>{const origin=await run('performance.timeOrigin');await call('Page.reload');await until('performance.timeOrigin!=='+origin+'&&document.readyState===\"complete\"');};
 const checks=[];const pass=name=>{checks.push(name);console.log('PASS '+name)};
 const media=value=>call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value}]});
 await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Network.setCacheDisabled',{cacheDisabled:true});
 await call('Fetch.enable',{patterns:[{urlPattern:'*/game.js',requestStage:'Response'}]});
 await call('Network.setBypassServiceWorker',{bypass:true});
 await call('Emulation.setTouchEmulationEnabled',{enabled:true});await media('no-preference');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await call('Page.addScriptToEvaluateOnNewDocument',{source:"window.workerStarts=0;const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{constructor(...args){super(...args);window.workerStarts++}}"});
 await call('Page.navigate',{url:'http://127.0.0.1:8765/water-sort/'});await waitGame();
 await run('localStorage.clear()');await game('mode="journey";level=1;difficulty="classic";emptyTubes=2;save();start({resume:false})');await reloadPage();await waitGame();
 if(process.argv.includes('--layout-only')){
 await call('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});await game('difficulty="hard";emptyTubes=4;start({resume:false})');await sleep(200);
 console.log(await run(`JSON.stringify({wrap:document.querySelector('.board-wrap').getBoundingClientRect().toJSON(),field:document.querySelector('.board').getBoundingClientRect().toJSON(),controls:document.querySelector('.controls').getBoundingClientRect().toJSON(),tubes:[...document.querySelectorAll('.tube-button')].map(b=>b.getBoundingClientRect().toJSON()),vars:document.querySelector('.board').style.cssText})`));const screenshot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/water-compact.png',Buffer.from(screenshot.data,'base64'));socket.close();return;
 }
 assert.equal(await run('workerStarts'),0);
 assert.ok(await game("mode==='journey'&&board.filter(t=>!t.length).length===2&&board.every(t=>!t.length||t.length===4)"));pass('curated puzzle loads without running solver');
 const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/water-new-play.png',Buffer.from(shot.data,'base64'));
 await game("window.nodes=[...document.querySelectorAll('.tube-button')];window.mutations=[];new MutationObserver(r=>mutations.push(...r)).observe(document.querySelector('.controls'),{attributes:true,subtree:true});choose(0);choose(0)");await sleep(10);
 assert.ok(await game('nodes.every((node,i)=>node===document.querySelectorAll(".tube-button")[i])&&mutations.length===0'));pass('selection preserves field and toolbar');
 await game('document.querySelector(".tube-button").focus()');await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await sleep(25);assert.equal(await game('selected'),0);
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});await sleep(25);assert.equal(await game('selected'),null);pass('keyboard selection remains available');

 const custom='[[0,1],[1,0],[2,3],[3,2],[0,0],[1,1],[2,2],[3,3],[],[]]';
 const reset=()=>game(`stopPour();board=${custom};initial=board.map(t=>t.slice());history=[];moves=0;selected=null;locked=false;render();`);
 await reset();const began=Date.now();await game('choose(0);choose(8);void 0');
 await game('choose(2);choose(9)');assert.ok(await game('queuedMove?.from===2&&queuedMove?.to===9'));
 await until('window.__waterTest("moves===2&&!locked")',2500);assert.ok(Date.now()-began<2200);
 assert.ok(await game('board[8][0]===1&&board[9][0]===3&&history.length===2'));pass('two pours queue and finish in under 2.2 seconds');
 await reset();await game('choose(0);choose(8);void 0');await sleep(50);await game('document.querySelector("#undo").click()');await sleep(900);
 assert.ok(await game('moves===0&&!locked&&!queuedMove&&JSON.stringify(board)===JSON.stringify(initial)&&!document.querySelector(".liquid-flight")'));pass('undo cancels a pour with no late commit');
 const point=async index=>game(`(()=>{const r=document.querySelectorAll('.tube-button')[${index}].getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 const touch=(type,p)=>call('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[p]});
 await reset();const from=await point(0),to=await point(8);await touch('touchStart',from);await touch('touchMove',{x:from.x+12,y:from.y});await touch('touchMove',to);
 assert.ok(await game('!!document.querySelector(".drop-target")'));await touch('touchEnd',to);await until('window.__waterTest("moves===1&&!locked")');
 assert.ok(await game('board[8][0]===1'));pass('native touch drag pours exactly once');
 await reset();const dragFrom=await point(0),dragTo=await point(8);await touch('touchStart',dragFrom);await touch('touchMove',{x:dragFrom.x+12,y:dragFrom.y});await touch('touchMove',dragTo);await touch('touchEnd',dragTo);
 const followingFrom=await point(2),followingTo=await point(9);await touch('touchStart',followingFrom);await touch('touchEnd',followingFrom);await sleep(25);await touch('touchStart',followingTo);await touch('touchEnd',followingTo);await sleep(25);
 const immediate=await game('({queuedMove,selected,activeTubes,moves})');assert.ok(immediate.queuedMove?.from===2&&immediate.queuedMove?.to===9||immediate.moves===2||immediate.activeTubes?.[0]===2);await until('window.__waterTest("moves===2&&!locked")',2500);pass('drag immediately accepts the next pair of touches');

 await game('mode="journey";level=1;difficulty="classic";emptyTubes=2;save();start({resume:false});const step=availableMoves(board)[0];selectTube(step.from);choose(step.to)');
 const snapshot=await game('({board,moves,history})');await reloadPage();await waitGame();assert.deepEqual(await game('({board,moves,history})'),snapshot);pass('reload restores water, move count, and undo history');
 await game('changeMode("daily")');assert.ok(await game('puzzle.colors===5&&puzzle.extra===2&&document.querySelector("#difficulty").disabled'));
 const dayBoard=await game('JSON.stringify(board)');await game('changeMode("journey")');assert.deepEqual(await game('({board,moves,history})'),snapshot);
 await game('changeMode("daily")');assert.equal(await game('JSON.stringify(board)'),dayBoard);await game('changeMode("journey")');pass('daily challenge and journey keep separate progress');
 assert.equal(await run('workerStarts'),0);await game('document.querySelector("#check-moves").click()');await until('document.querySelector("#moves-title").textContent==="Решение найдено"',10000);assert.equal(await run('workerStarts'),1);await game('closeMoves()');pass('exact solvability still starts only from button');
 await media('reduce');await game('level=1;start({resume:false})');const answer=solve(await game('board'));assert.equal(answer.status,'solvable');
 for(const step of answer.path)await game(`selectTube(${step.from});choose(${step.to})`);
 await until('!document.querySelector("#win").hidden');assert.ok(await game('currentRecord().stars===3&&document.querySelector("#win-stars").children.length===3&&document.querySelector("#progress-label").textContent.startsWith("3 / 3")'));pass('victory awards and saves stars and best move count');
 await game('document.querySelector("#replay").click()');assert.ok(await game('moves===0&&!locked&&currentRecord().stars===3&&document.querySelector("#win").hidden'));pass('replay resets the round and keeps the best result');
 const retryAnswer=solve(await game('board'));for(const step of retryAnswer.path)await game(`selectTube(${step.from});choose(${step.to})`);await until('!document.querySelector("#win").hidden');

 await game('document.querySelector("#next").click()');assert.ok(await game('level===2&&moves===0&&!document.querySelector(".app").inert'));pass('next level starts immediately');
 for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[844,390],[568,320],[1366,900]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await game('difficulty="hard";emptyTubes=4;start({resume:false})');await sleep(100);
  const layout=await run(`(()=>{const controls=document.querySelector('.controls').getBoundingClientRect(),buttons=[...document.querySelectorAll('.tube-button')].map(b=>b.getBoundingClientRect());return {page:document.documentElement.scrollHeight,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,bottom:controls.bottom,bad:buttons.some(b=>b.width<44||b.height<44||b.left<0||b.right>innerWidth+1||b.bottom>controls.top+1)}})()`);
  assert.ok(!layout.bad&&!layout.overflow&&layout.bottom<=height+1&&layout.page<=height+1,JSON.stringify({width,height,...layout}));
 }pass('11 vessels and controls fit six phone sizes plus desktop');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await game('difficulty="classic";level=1;emptyTubes=2;save();start({resume:false});const step=availableMoves(board)[0];selectTube(step.from);choose(step.to)');
 const offlineState=await game('JSON.stringify(board)');await run('navigator.serviceWorker.ready');await sleep(300);
 await call('Network.setBypassServiceWorker',{bypass:false});await reloadPage();await until('document.querySelectorAll(".tube-button").length>0');
 await run('navigator.serviceWorker.register("./sw.js?integration="+Date.now())');
 await until('!document.querySelector("#app-update").hidden',10000);
 const updateOrigin=await run('performance.timeOrigin');await run(`document.querySelector('#settings-open').click();document.querySelector('#app-update').click()`);
 await until('performance.timeOrigin!=='+updateOrigin+'&&document.readyState===\"complete\"');await until('document.querySelectorAll(".tube-button").length>0');
 assert.equal(await run("JSON.stringify([...document.querySelectorAll('.tube-button')].map(b=>b.dataset.liquid?b.dataset.liquid.split(',').map(Number):[]))"),offlineState);pass('explicit update preserves the current party');
 await call('Network.setBypassServiceWorker',{bypass:false});
 await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await reloadPage();await until("document.querySelectorAll('.tube-button').length>0");assert.equal(await run("JSON.stringify([...document.querySelectorAll('.tube-button')].map(b=>b.dataset.liquid?b.dataset.liquid.split(',').map(Number):[]))"),offlineState);
 await run('document.querySelector("#check-moves").click()');await until('document.querySelector("#moves-title").textContent==="Решение найдено"',10000);await run('document.querySelector("#moves-close").click()');pass('offline reload, saved party, and solver work');
 await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks:checks.length,errors},null,2));socket.close();
})().catch(error=>{console.error(error);process.exit(1)});

const CACHE='quiet-water-v20';
const ASSETS=['./','./index.html','./coloring/art.js','./coloring/core.js','./coloring/app.js','./coloring/color.css','./water-sort/','./water-sort/index.html','./style.css','./game.js','./levels.js','./puzzle.js','./pour-animation.js','./victory.js','./solver.js','./solver-worker.js','./fonts/NotoSans-Regular.ttf','./fonts/NotoSans-Bold.ttf','./fonts/NotoSerif-Regular.ttf','./fonts/NotoSerif-Italic.ttf'];
const assetUrls=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
const indexUrl=new URL('./index.html',self.registration.scope).href;
self.addEventListener('install',event=>{
 // Install a complete version; never mix new files into an older snapshot.
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})))));
});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('quiet-water-')&&key!==CACHE).map(key=>caches.delete(key)))));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 url.search='';url.hash='';
 if(!assetUrls.has(url.href)&&request.mode!=='navigate')return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const response=await cache.match(url.href);
  if(response)return response;
  if(request.mode==='navigate')return (await cache.match(indexUrl))||fetch(request);
  return fetch(request);
 }));
});

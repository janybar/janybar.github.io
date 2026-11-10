(function(root){
 function createSession(art,saved){
  const raw=saved&&saved.version===1&&saved.artId===art.id&&Array.isArray(saved.filled)?saved.filled:[];
  const filled=new Set(raw.filter(id=>Number.isInteger(id)&&id>=0&&id<art.regions.length));
  const selected=saved?.version===1&&saved.artId===art.id&&Number.isInteger(saved?.selected)&&art.regions.some(r=>r.color===saved.selected&&!filled.has(r.id))?saved.selected:nextColor(art,filled);
  return {artId:art.id,filled,selected,updatedAt:Date.now()};
 }
 function nextColor(art,filled,after=-1){
  for(let offset=1;offset<=art.palette.length;offset++){const color=(after+offset)%art.palette.length;if(art.regions.some(r=>r.color===color&&!filled.has(r.id)))return color;}
  return null;
 }
 function paint(art,session,id){
  const region=art.regions.find(r=>r.id===id);
  if(!region||session.filled.has(id))return {status:'ignored'};
  if(region.color!==session.selected)return {status:'wrong',color:region.color};
  session.filled.add(id);session.updatedAt=Date.now();
  const colorDone=!art.regions.some(r=>r.color===session.selected&&!session.filled.has(r.id));
  if(colorDone)session.selected=nextColor(art,session.filled,session.selected);
  return {status:session.filled.size===art.regions.length?'complete':'painted',colorDone};
 }
 function counts(art,session){return art.palette.map((_,color)=>art.regions.filter(r=>r.color===color&&!session.filled.has(r.id)).length);}
 function serialize(session){return {version:1,artId:session.artId,filled:[...session.filled],selected:session.selected,updatedAt:session.updatedAt};}
 function dailyId(artworks,date){let n=2166136261;for(const c of date)n=Math.imul(n^c.charCodeAt(0),16777619);return artworks[(n>>>0)%artworks.length].id;}
 function clampView(view,width,height){
  const scale=Math.min(8,Math.max(1,Number(view.scale)||1));
  return {scale,x:Math.min(0,Math.max(width*(1-scale),Number(view.x)||0)),y:Math.min(0,Math.max(height*(1-scale),Number(view.y)||0))};
 }
 function contrast(hex){const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.38?'#263d3b':'#ffffff';}
 const api={createSession,paint,nextColor,counts,serialize,dailyId,clampView,contrast};if(typeof module!=='undefined')module.exports=api;else root.ColorCore=api;
})(globalThis);

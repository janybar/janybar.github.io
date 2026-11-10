(function(root){
 const palette={paper:'#eeece3',coral:'#ed7470',teal:'#58b6ae',gold:'#ecc35e',blue:'#79a6cf',violet:'#a28fbc',leaf:'#a5bf7a',white:'#fffdf3',black:'#28383d'};
 const chapters=[{title:'Встреча',description:'Соединяй одинаковые цвета. Последним должен остаться цвет рамки.'},{title:'Белый свет',description:'Белая фигура соединяется с любым цветом.'},{title:'Тень',description:'Чёрная фигура поглощает то, что её коснулось. Фон не меняется.'},{title:'Внутри',description:'Внутренние фигуры раскрываются, когда исчезает внешняя оболочка.'},{title:'Защита',description:'Дважды коснись пунктирной фигуры: защита сохранит её при заливке.'},{title:'Отражение',description:'Связанные фигуры двигаются зеркально. Следи за обеими сторонами.'}];
 const colors=['coral','teal','gold','blue','violet','leaf'];
 function createLevel(number=1){
  number=Math.max(1,Math.min(120,Math.floor(Number(number)||1)));
  const chapter=Math.floor((number-1)/20),index=(number-1)%20,shift=(index+chapter)%colors.length,c=Array.from({length:6},(_,i)=>colors[(i+shift)%6]);
  const nodes=[];let serial=0;
  const piece=(color,x,y,r,movable=false,extra={})=>{const n={id:'p'+serial++,color,x,y,r,shape:['circle','square','diamond','triangle'][(index+serial)%4],parent:null,movable,shield:false,...extra};nodes.push(n);return n;};
  const stack=(sequence,x=425,y=390)=>{let parent=null;const radii=sequence.length===1?[100]:sequence.length===2?[126,60]:sequence.length===3?[138,87,40]:[142,98,60,28];return sequence.map((color,i)=>{const n=piece(color,x,y,radii[i],false,{parent,shape:i%2?'circle':index%2?'square':'circle'});parent=n.id;return n;});};
  let goal=c[0];
  if(chapter===0&&index===0){piece(c[0],170,380,82,true,{shape:'circle'});piece(c[0],438,380,83,false,{shape:'square'});}
  else if(chapter===0&&index<4){
   goal=c[1];piece(c[0],150,240,62,true);piece(c[0],450,240,73,false,{shape:'circle'});piece(c[1],150,570,62,true);piece(c[1],450,570,73,false,{shape:'diamond'});
  }else if(chapter===0||chapter===1){
   const depth=chapter===0?2+(index>=11?1:0):1+Math.min(3,Math.floor(index/5));goal=c[depth-1];
   stack(c.slice(0,depth));
   for(let i=0;i<depth;i++)piece(chapter===1?'white':c[i],135,depth===1?390:160+i*480/(depth-1),Math.max(38,60-depth*4),true,{shape:chapter===1?'circle':['circle','diamond','triangle'][i%3]});
  }else if(chapter===2){
   const depth=index<7?1:index<14?2:3;goal=c[0];stack([...Array(depth).fill('black'),goal]);
   for(let i=0;i<depth;i++)piece(c[i+1],135,160+i*170,44,true,{shape:['triangle','circle','diamond'][i%3]});piece(goal,135,690,48,true,{shape:'circle'});
  }else if(chapter===3||chapter===5){
   goal=c[4];const deep=index>=8;
   const left=piece(c[0],170,290,110,false,{shape:index%2?'square':'circle'}),right=piece(c[1],430,290,110,false,{shape:index%2?'circle':'square'});
   let lp=left.id,rp=right.id;
   if(deep){lp=piece(c[2],170,290,71,false,{shape:'circle',parent:lp}).id;rp=piece(c[3],430,290,71,false,{shape:'circle',parent:rp}).id;}
   piece(goal,170,290,deep?32:52,true,{shape:'circle',parent:lp});piece(goal,430,290,deep?32:52,false,{shape:'diamond',parent:rp});
   const a=piece(c[0],170,660,49,true,{shape:'circle'}),b=piece(c[1],430,660,49,true,{shape:'circle'});
   if(chapter===5){a.mirror=b.id;b.mirror=a.id;}
   if(deep){const d=piece(c[2],100,488,36,true,{shape:'diamond'}),e=piece(c[3],500,488,36,true,{shape:'diamond'});if(chapter===5){d.mirror=e.id;e.mirror=d.id;}}
  }else if(chapter===4){
   goal=c[0];stack([c[0],c[1],c[0]]);
   piece(c[0],135,170,48,true,{shape:'circle'});piece(c[1],135,400,48,true,{shape:'diamond'});piece(c[0],135,655,48,true,{shape:'circle',canShield:true,shield:index===0});
   if(index>=12){piece(c[2],300,700,31,true,{shape:'triangle'});piece(c[2],450,700,36,false,{shape:'circle'});}
  }
  return {id:'flow-'+number,number,chapter,index,title:chapters[chapter].title,description:chapters[chapter].description,goal,background:'paper',nodes};
 }
 const api={palette,chapters,createLevel};if(typeof module!=='undefined')module.exports=api;else root.ZenLevels=api;
})(globalThis);

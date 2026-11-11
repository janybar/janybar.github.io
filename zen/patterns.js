(function(root){
 'use strict';
 const definitions=[
  ['Квадраты Фибоначчи','Квадраты со сторонами 1, 1, 2, 3, 5, 8 и 13 складываются в одну композицию.'],
  ['Треугольник Серпинского','Треугольники внутри треугольников: три шага самоподобия.'],
  ['Снежинка Коха','Каждая сторона снова делится и вырастает маленьким треугольным выступом.'],
  ['Кривая Гильберта','Одна непрерывная линия проходит через все клетки квадратной сетки.'],
  ['Ковёр Серпинского','Из каждого квадрата убрана середина — и этот шаг повторяется снова.'],
  ['Треугольник Паскаля','Каждое число — сумма двух над ним. Цвета разделяют чётные и нечётные.'],
  ['Полярная роза','Лепестки одной кривой: r = cos(3θ).'],
  ['Кривая Лиссажу','Два перпендикулярных колебания с отношением частот 3 : 2.'],
  ['Дерево Пифагора','Над каждым квадратом вырастают два меньших квадрата.'],
  ['Шестиугольная решётка','Правильные шестиугольники заполняют плоскость без промежутков.'],
  ['Филлотаксис','Семена подсолнуха: каждый следующий поворот равен золотому углу.'],
  ['Спираль Улама','Натуральные числа идут по квадратной спирали. Простые числа выделены цветом.'],
  ['Спираль Архимеда','Радиус равномерно растёт с каждым оборотом: r = a + bθ.'],
  ['Кардиоида','Сердцевидная кривая, заданная полярным уравнением r = a(1 − cos θ).'],
  ['Лемниската Бернулли','Симметричная восьмёрка с двумя одинаковыми петлями.'],
  ['Дракон Хартера — Хейтуэя','Фрактальная линия повторяет последовательность сгибов бумажной полоски.'],
  ['Множество Кантора','На каждом шаге из отрезков удаляется открытая средняя треть.'],
  ['Бинарное дерево','Каждая вершина порождает две новые: один рисунок повторяется на всех ветвях.'],
  ['Семиконечная звезда','Правильный звёздчатый многоугольник {7/3}: соединяем каждую третью вершину.'],
  ['Концентрические окружности','Один центр объединяет несколько окружностей разного радиуса.']
 ];
 function createMathLevel(number,colors,chapters){
  const chapter=Math.floor((number-1)/20),index=(number-1)%20;
  const family=number<=140?(number-121)%10:number<=160?10+(number-141)%10:(number-161)%20;
  const profile=number<=160?Math.floor(index/10):2+Math.floor((number-161)/20),advanced=profile%2===1;
  const offset=family*2+(profile>1?profile:0),c=[0,1,3,4,2,5].map(i=>colors[(offset+i)%6]);
  const groups=family===9?3:2,goal=profile===1||profile===5?c[0]:c[groups+(profile===2?1:0)],nodes=[],guides=[];let serial=0,anchor;
  const add=(x,y,r,shape='circle',group=0,extra={})=>{const n={id:'m'+serial++,x:advanced?600-x:x,y,r,shape,color:c[group],parent:null,movable:false,shield:false,...extra};nodes.push(n);return n;};
  const guide=pieces=>guides.push({ids:pieces.map(n=>n.id)});
  const center=(x=300,y=350,r=39)=>anchor=add(x,y,r,'circle');
  // Uniform scaling keeps the mathematical curves' proportions. Nearby
  // samples share a piece at crossings, instead of creating colliding roots.
  const fit=points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),scale=Math.min(430/(x1-x0||1),410/(y1-y0||1));return points.map(p=>({x:300+(p.x-(x0+x1)/2)*scale,y:335+(p.y-(y0+y1)/2)*scale}));};
  const curve=(raw,closed=true)=>{const pieces=[],path=[];for(const [i,p] of fit(raw).entries()){const previous=path.at(-1);if(previous&&Math.hypot(previous.x-(advanced?600-p.x:p.x),previous.y-p.y)<28)continue;let n=pieces.find(n=>Math.hypot(n.x-(advanced?600-p.x:p.x),n.y-p.y)<28);if(!n){n=add(p.x,p.y,10,'circle',Math.floor(i*8/raw.length)%2);pieces.push(n);}path.push(n);}if(closed)path.push(path[0]);guide(path);};
  if(family===0){
   const squares=[[0,0,1],[1,0,1],[0,-2,2],[-3,-2,3],[-3,1,5],[2,-2,8],[-3,-15,13]],scale=23;
   squares.forEach(([x,y,size],i)=>{const n=add(58+(y+15+size/2)*scale,178+(x+3+size/2)*scale,size*scale/2-3,'square',i%2);if(i===6)anchor=n;});
  }else if(family===1){
   const recur=(a,b,c,depth,branch=0)=>{if(!depth){add((a.x+b.x+c.x)/3,(a.y+b.y+c.y)/3,32,'triangle',branch%2);return;}const mid=(p,q)=>({x:(p.x+q.x)/2,y:(p.y+q.y)/2}),ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);recur(a,ab,ca,depth-1,branch);recur(ab,b,bc,depth-1,branch+1);recur(ca,bc,c,depth-1,branch+2);};
   recur({x:300,y:83},{x:542,y:503},{x:58,y:503},3);center(300,363,40);
  }else if(family===2){
   const path=[];
   const koch=(a,b,depth)=>{if(!depth){path.push(a);return;}const u={x:(b.x-a.x)/3,y:(b.y-a.y)/3},p={x:a.x+u.x,y:a.y+u.y},q={x:a.x+2*u.x,y:a.y+2*u.y},tip={x:p.x+u.x*.5+u.y*Math.sqrt(3)/2,y:p.y-u.x*Math.sqrt(3)/2+u.y*.5};koch(a,p,depth-1);koch(p,tip,depth-1);koch(tip,q,depth-1);koch(q,b,depth-1);};
   const corners=[{x:300,y:114},{x:504,y:468},{x:96,y:468}];for(let i=0;i<3;i++)koch(corners[i],corners[(i+1)%3],2);
   const pieces=path.map((p,i)=>{const q=path[(i+1)%path.length];return add((p.x+q.x)/2,(p.y+q.y)/2,9,'circle',Math.floor(i/4)%2)});guide([...pieces,pieces[0]]);center(300,350,42);
  }else if(family===3){
   const pieces=[];
   for(let d=0;d<64;d++){let x=0,y=0,t=d;for(let s=1;s<8;s*=2){const rx=1&(t>>1),ry=1&(t^rx);if(!ry){if(rx){x=s-1-x;y=s-1-y;}[x,y]=[y,x];}x+=s*rx;y+=s*ry;t>>=2;}const n=add(104+x*56,140+y*56,15,'circle',Math.floor(d/4)%2);pieces.push(n);}
   guide(pieces);center(300,610,30);
  }else if(family===4){
   for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(!(x%3===1&&y%3===1)&&!(Math.floor(x/3)===1&&Math.floor(y/3)===1))add(108+x*48,158+y*48,20,'square',(x+y)%2);center(300,350,43);
  }else if(family===5){
   for(let row=0;row<8;row++){let value=1;for(let col=0;col<=row;col++){add(300+(col-row/2)*52,150+row*52,19,'circle',value%2,{label:String(value)});value=value*(row-col)/(col+1);}}center(300,610,30);
  }else if(family===6||family===7){
   const pieces=[];
   for(let i=0;i<144;i++){
    const t=i*(family===6?Math.PI:2*Math.PI)/144,r=225*Math.cos(3*t),x=300+(family===6?r*Math.cos(t):215*Math.sin(3*t+Math.PI/2)),y=335+(family===6?r*Math.sin(t):210*Math.sin(2*t));
    if(family===6&&Math.abs(r)<65)continue;
    if(pieces.some(n=>Math.hypot(n.x-(advanced?600-x:x),n.y-y)<26))continue;
    pieces.push(add(x,y,10,'circle',Math.floor(i/12)%2));
   }guide(pieces);if(family===6)center(300,335,38);else center(300,610,30);
  }else if(family===8){
   const tree=(a,b,depth)=>{const dx=b.x-a.x,dy=b.y-a.y,size=Math.hypot(dx,dy),p={x:a.x+dy,y:a.y-dx},q={x:b.x+dy,y:b.y-dx};const n=add((a.x+q.x)/2,(a.y+q.y)/2,size/2-2,'square',depth%2,{rotation:(advanced?-1:1)*Math.atan2(dy,dx)*180/Math.PI});if(depth===4)anchor=n;if(!depth)return;const tip={x:(p.x+q.x+dy)/2,y:(p.y+q.y-dx)/2};tree(p,tip,depth-1);tree(tip,q,depth-1);};
   tree({x:250,y:610},{x:350,y:610},4);
  }else if(family===9){
   for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++)if(Math.abs(q+r)<=2){const n=add(300+Math.sqrt(3)*48*(q+r/2),350+72*r,44,'hexagon',((q-r)%3+3)%3);if(q===0&&r===0)anchor=n;}
  }else if(family===10){
   const angle=Math.PI*(3-Math.sqrt(5));for(let i=4;i<58;i++){const r=29*Math.sqrt(i);add(300+r*Math.cos(i*angle),335+r*Math.sin(i*angle),12,'circle',i%2);}center(300,335,32);
  }else if(family===11){
   const prime=n=>{if(n<2)return false;for(let d=2;d*d<=n;d++)if(n%d===0)return false;return true;};
   let x=0,y=0,dx=1,dy=0,segment=1,used=0,turns=0;
   for(let value=1;value<=49;value++){add(300+x*56,335+y*56,21,'square',Number(prime(value)),{label:String(value)});x+=dx;y+=dy;if(++used===segment){[dx,dy]=[-dy,dx];used=0;if(++turns%2===0)segment++;}}center(300,610,30);
  }else if(family>=12&&family<=14){
   const points=Array.from({length:720},(_,i)=>{const t=i*(family===12?5*Math.PI:2*Math.PI)/719;if(family===12){const r=50+11*t;return {x:r*Math.cos(t),y:r*Math.sin(t)};}if(family===13){const r=1-Math.cos(t);return {x:r*Math.cos(t),y:r*Math.sin(t)};}return {x:Math.cos(t)/(1+Math.sin(t)**2),y:Math.sin(t)*Math.cos(t)/(1+Math.sin(t)**2)};});curve(points,family!==12);center(300,610,30);
  }else if(family===15){
   let turns=[];for(let depth=0;depth<6;depth++)turns=[...turns,1,...turns.slice().reverse().map(t=>-t)];
   const points=[{x:0,y:0},{x:1,y:0}];let x=1,y=0,dx=1,dy=0;for(const turn of turns){[dx,dy]=[-turn*dy,turn*dx];x+=dx;y+=dy;points.push({x,y});}
   const seen=new Map(),path=[];fit(points).forEach((p,i)=>{const key=p.x.toFixed(4)+','+p.y.toFixed(4);if(!seen.has(key))seen.set(key,add(p.x,p.y,10,'circle',Math.floor(i/8)%2));path.push(seen.get(key));});guide(path);center(300,610,30);
  }else if(family===16){
   const cantor=(x,width,depth)=>{const y=150+depth*125;guide([add(x,y,6,'circle',depth%2),add(x+width,y,6,'circle',depth%2)]);if(depth<3){cantor(x,width/3,depth+1);cantor(x+2*width/3,width/3,depth+1);}};cantor(60,480,0);center(300,610,30);
  }else if(family===17){
   const tree=(x,y,span,depth,parent)=>{const n=add(x,y,depth?11:26,'circle',depth%2);if(parent)guide([parent,n]);else anchor=n;if(depth<4){tree(x-span,y+90,span/2,depth+1,n);tree(x+span,y+90,span/2,depth+1,n);}};tree(300,150,125,0);
  }else if(family===18){
   const points=Array.from({length:7},(_,i)=>add(300+215*Math.cos(-Math.PI/2+i*2*Math.PI/7),335+215*Math.sin(-Math.PI/2+i*2*Math.PI/7),18,'circle',i%2));guide(Array.from({length:8},(_,i)=>points[(i*3)%7]));center(300,335,38);
  }else{
   for(let ring=0;ring<3;ring++){const count=14+ring*8,r=75+ring*70,pieces=[];for(let i=0;i<count;i++)pieces.push(add(300+r*Math.cos(i*2*Math.PI/count),335+r*Math.sin(i*2*Math.PI/count),10,'circle',ring%2));guide([...pieces,pieces[0]]);}center(300,335,32);
  }
  const layers=profile===2?[c[groups],goal]:profile===3?[c[1],goal]:profile===4?['black',goal]:profile===5?[c[1],c[0],goal]:[goal];
  let parent=anchor.id;
  layers.forEach((color,i)=>{const r=layers.length===1?Math.min(25,anchor.r*.52):Math.min(48,anchor.r*.78)*(layers.length-i)/layers.length;parent=add(advanced?600-anchor.x:anchor.x,anchor.y,r,'circle',0,{color,parent}).id;});
  const controls=Array.from({length:groups},(_,i)=>({color:c[i]}));
  if(profile===2)controls.push({color:c[groups]});
  if(profile===4)controls.push({color:c[groups+1]});
  if(profile===5)controls.push({color:c[0],canShield:true});
  controls.push({color:goal,...(profile===1||profile===5?{canShield:true}:{})});
  if(profile===3)controls.forEach(n=>n.color='white');
  controls.forEach((n,i)=>add(90+i*420/(controls.length-1),720,35,'circle',0,{movable:true,...n}));
  const descriptions=['Узор исчезает цвет за цветом. Последний цвет — цвет рамки.','Сохрани цвет рамки: включи защиту двойным касанием.','Под оболочкой спрятаны ещё два цвета. Выбери порядок заливок.','Белых фигур ровно столько, сколько нужно. Найди порядок раскрытия слоёв.','Под узором скрыта чёрная оболочка. Оставь для неё отдельную фигуру.','Цвет рамки возвращается дважды. Сохрани обе пунктирные фигуры.'];
  return {id:'flow-'+number,number,chapter,index,title:chapters[chapter].title,description:descriptions[profile],patternName:definitions[family][0],patternDescription:definitions[family][1],goal,background:'paper',nodes,guides};
 }
 const api={createMathLevel};if(typeof module!=='undefined')module.exports=api;else root.ZenPatterns=api;
})(globalThis);

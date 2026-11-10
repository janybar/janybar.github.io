(function(root){
 const PALETTES={
  lake:['#cbe5e4','#e6f1e8','#efc66c','#d7a568','#829eae','#567a87','#adc4ba','#799d88','#477c78','#699e9e','#a2c5b6','#375e5b','#d5c6a4','#d88e6b'],
  sunset:['#efd4be','#f8e5ce','#eab95b','#dd8c69','#9f93ac','#756782','#c2abac','#9c9e88','#6e8e8d','#8fa9ac','#c2c6b5','#525f6d','#dfba92','#b46d61'],
  coast:['#c9e1e5','#e6eee7','#eac778','#d29c72','#93bcbf','#57969f','#c4d5c2','#88a594','#468487','#77b3b0','#b2d5cb','#466d6e','#ead8b7','#c77e6b'],
  garden:['#e8e7d6','#f2edda','#e8bd70','#c99a70','#d6a3a7','#b97c91','#b9c8a1','#91ad86','#5b896e','#8daaa4','#c8d9c2','#426e62','#d6c1a1','#dfab89'],
  night:['#b9c8de','#dae2e9','#eac67c','#c7a16e','#a69dc3','#7e82a7','#b4c6c3','#8ca99d','#5a8290','#8bb4be','#c1d3d4','#455f79','#d7bf9c','#be94ad']
 };
 const ARTWORKS=[
  {id:'alpine',title:'Тишина у озера',category:'Природа',kind:'mountain',scheme:'lake'},
  {id:'wildflowers',title:'Букет для себя',category:'Цветы',kind:'flowers',scheme:'garden'},
  {id:'lighthouse',title:'Свет далёкого маяка',category:'Природа',kind:'coast',scheme:'coast'},
  {id:'sleepy-cat',title:'Солнечный сон',category:'Уют',kind:'cat',scheme:'sunset'},
  {id:'lotus',title:'Сад на воде',category:'Природа',kind:'pond',scheme:'lake'},
  {id:'mandala-sage',title:'Круг равновесия',category:'Узоры',kind:'mandala',scheme:'garden'},
  {id:'evening-lake',title:'Озеро на закате',category:'Природа',kind:'mountain',scheme:'sunset'},
  {id:'peonies',title:'Письмо из сада',category:'Цветы',kind:'flowers',scheme:'sunset'},
  {id:'night-cat',title:'Вечер у окна',category:'Уют',kind:'cat',scheme:'night'},
  {id:'koi',title:'Медленное течение',category:'Природа',kind:'pond',scheme:'coast'},
  {id:'mandala-moon',title:'Лунный цветок',category:'Узоры',kind:'mandala',scheme:'night'},
  {id:'golden-coast',title:'Тёплый берег',category:'Природа',kind:'coast',scheme:'sunset'}
 ];
 function makeArt(id){
  const meta=ARTWORKS.find(a=>a.id===id);if(!meta)throw Error('Unknown artwork');
  const regions=[];
  const add=(d,color,x,y,size=12,transform='')=>{regions.push({id:regions.length,d,color,x,y,size,transform});};
  const poly=(points,color,x,y,size=12)=>add('M'+points.map(p=>p.join(',')).join('L')+'Z',color,x,y,size);
  const rect=(x,y,w,h,color,lx=x+w/2,ly=y+h/2,size=12)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],color,lx,ly,size);
  const ellipse=(x,y,rx,ry,color,lx=x,ly=y,size=12)=>add(`M${x-rx},${y}a${rx},${ry} 0 1,0 ${rx*2},0a${rx},${ry} 0 1,0 ${-rx*2},0Z`,color,lx,ly,size);
  const pine=(x,y,s)=>{rect(x-4*s,y,8*s,86*s,3,x,y+81*s,7);for(let i=0;i<3;i++){const top=y+i*18*s;poly([[x,top],[x+(23+i*5)*s,top+39*s],[x-(23+i*5)*s,top+39*s]],i%2?8:11,x,top+(i<2?10:24)*s,9);}};
  function flower(x,y,r,color,petals=8){
   for(let i=0;i<petals;i++){
    const a=i*Math.PI*2/petals,p=(radius,angle)=>[x+Math.cos(angle)*radius,y+Math.sin(angle)*radius];
    const start=p(r*.13,a-.25),tip=p(r,a),end=p(r*.13,a+.25),c1=p(r*.75,a-.37),c2=p(r*.75,a+.37);
    add(`M${start}Q${c1} ${tip}Q${c2} ${end}Z`,color+(i%2),...p(r*.62,a),9);
   }ellipse(x,y,r*.2,r*.2,2,x,y,8);
  }
  function pad(x,y,r){add(`M${x},${y}L${x+r*.9},${y-r*.4}A${r},${r*.65} 0 1,1 ${x+r*.9},${y+r*.4}Z`,7,x-r*.25,y+3,11);}
  rect(0,0,600,600,0,12,12,8);
  if(meta.kind==='mountain'){
   add('M0,75Q180,35 600,80L600,190Q300,135 0,180Z',1,65,120);
   ellipse(460,125,52,52,2,460,165);ellipse(460,125,31,31,3);
   add('M40,85Q52,66 72,76Q92,47 111,75Q143,66 151,91L40,91Z',1,100,82,9);
   poly([[0,325],[156,152],[323,325]],4,112,260);poly([[156,152],[323,325],[197,298]],5,219,275);
   poly([[107,207],[156,152],[209,207],[179,194],[155,213],[135,192]],1,155,185,9);
   poly([[214,332],[365,105],[600,333]],5,371,248);poly([[365,105],[600,333],[432,285]],4,484,278);
   poly([[317,178],[365,105],[434,176],[391,159],[364,186],[341,160]],1,365,146,9);
   add('M0,315Q130,272 280,330Q440,280 600,325L600,405L0,405Z',6,70,350);
   add('M0,372Q160,317 340,362Q484,326 600,370L600,440L0,440Z',7,260,380);
   add('M0,418Q170,397 600,420L600,600L0,600Z',9,40,453);
   for(let i=0;i<4;i++){const y=447+i*31;add(`M95,${y}Q285,${y-12} 560,${y+5}Q318,${y+13} 95,${y+6}Z`,i%2?10:0,320,y+3,8);}
   add('M0,550Q170,520 263,574Q430,532 600,561L600,600L0,600Z',12,30,580);
   pine(518,295,.92);pine(568,335,.78);pine(32,349,.72);
   poly([[120,504],[210,504],[193,521],[138,521]],3,164,512,9);poly([[163,448],[163,500],[128,500]],1,150,484,9);poly([[169,465],[192,500],[169,500]],13,178,490,8);
   for(let i=0;i<7;i++)ellipse(340+i*29,565+(i%2)*12,12,5,i%2?7:3,340+i*29,565+(i%2)*12,7);
  }else if(meta.kind==='coast'){
   add('M0,190Q320,150 600,198L600,600L0,600Z',9,560,235);
   for(let i=0;i<5;i++){const y=252+i*51;add(`M240,${y}Q385,${y-23} 600,${y-7}L600,${y+18}Q370,${y+1} 240,${y+9}Z`,i%2?4:10,558,y+2,10);}
   ellipse(466,101,41,41,2);add('M53,93Q70,65 97,81Q128,53 152,84Q177,76 190,100L53,100Z',1,125,91,10);
   add('M0,295Q105,261 218,320L283,409L125,498L0,510Z',6,60,345);
   poly([[0,370],[171,355],[250,406],[118,496],[0,510]],3,100,411);
   add('M0,507Q135,456 229,508Q336,544 600,535L600,600L0,600Z',12,45,555);
   add('M0,538Q174,489 290,544Q425,572 600,556L600,576Q406,590 272,559Q136,515 0,560Z',1,140,535,9);
   for(let i=0;i<4;i++)rect(105-i*3,160+i*39,76+i*6,39,i%2?13:1,143,180+i*39);
   rect(103,140,80,20,5,143,150,8);rect(111,110,65,30,2,144,126,10);
   poly([[98,110],[144,76],[189,110]],13,144,98,10);rect(136,277,19,39,5,146,297,9);
   for(let i=0;i<2;i++)rect(137,183+i*76,13,19,4,144,193+i*76,7);
   poly([[382,424],[488,424],[470,444],[401,444]],5,437,434,9);poly([[432,349],[432,418],[387,418]],1,417,395,10);poly([[439,371],[477,418],[439,418]],2,451,404,9);
   for(let i=0;i<9;i++)ellipse(255+i*31,572+(i%2)*14,11,5,i%3===0?13:3,255+i*31,572+(i%2)*14,7);
   pine(40,355,.65);
  }else if(meta.kind==='flowers'){
   rect(24,24,552,552,1,43,300);
   const blooms=[[166,196,65],[330,139,68],[444,269,64],[278,316,67],[139,371,44],[418,406,42]];
   for(const [i,[x,y,r]] of blooms.entries()){
    add(`M${x-4},${y}Q${x-9},400 300,487L308,487Q${x+4},390 ${x+5},${y}Z`,8,(x+300)/2,421-i*12,7);
    const lx=(x+300)/2,ly=380-i*20;
    add(`M${lx},${ly}Q${lx-67},${ly-70} ${lx-70},${ly-7}Q${lx-34},${ly+26} ${lx},${ly}Z`,7,lx-41,ly-12,9);
    add(`M${lx+4},${ly+18}Q${lx+75},${ly-37} ${lx+62},${ly+13}Q${lx+27},${ly+46} ${lx+4},${ly+18}Z`,6,lx+40,ly+13,9);
   }
   for(const [i,[x,y,r]] of blooms.entries())flower(x,y,r,i%2?4:12,7+i%2);
   add('M227,440L371,440Q362,546 333,566L265,566Q234,530 227,440Z',9,300,481);
   add('M227,440Q298,453 371,440L368,458Q299,470 230,458Z',10,299,456,8);
   add('M257,470Q266,512 282,548L269,551Q250,513 248,471Z',0,264,513,8);
  }else if(meta.kind==='mandala'){
   const cx=300,cy=300;
   for(let ring=4;ring>=0;ring--){
    const inner=ring*48+14,outer=inner+60,petals=12;
    for(let i=0;i<petals;i++){
     const a=i*Math.PI*2/petals+(ring%2)*Math.PI/12,p=(r,angle)=>[cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
     add(`M${p(inner,a)}Q${p((inner+outer)/2,a-.25)} ${p(outer,a)}Q${p((inner+outer)/2,a+.25)} ${p(inner,a)}Z`,(ring*2+i%2+2)%14,...p(inner+29,a),10);
    }
   }ellipse(300,300,18,18,2,300,300,10);
  }else if(meta.kind==='pond'){
   for(let i=0;i<5;i++){const y=70+i*110;add(`M0,${y}Q175,${y-40} 325,${y+8}T600,${y-2}L600,${y+32}Q360,${y+66} 0,${y+28}Z`,i%2?9:4,30,y+12,10);}
   pad(111,135,65);pad(469,405,78);pad(125,484,49);
   flower(116,115,43,4,8);flower(468,393,43,12,8);
   function fish(x,y,rotation){
    const transform=`translate(${x} ${y}) rotate(${rotation})`,p=(px,py)=>[x+px*Math.cos(rotation*Math.PI/180)-py*Math.sin(rotation*Math.PI/180),y+px*Math.sin(rotation*Math.PI/180)+py*Math.cos(rotation*Math.PI/180)];
    const f=(d,c,px,py,size=10)=>add(d,c,...p(px,py),size,transform);
    f('M-66,0Q-94,-34 -110,-24L-88,0L-110,24Q-89,35 -66,0Z',13,-96,0,8);
    f('M-70,0Q-16,-43 42,-25Q79,-13 83,0Q72,30 28,30Q-23,38 -70,0Z',1,12,10);
    f('M-23,-29Q-13,-5 0,-4Q16,-12 30,-29Q2,-37 -23,-29Z',13,5,-22,8);
    f('M25,29Q33,4 53,-5Q66,-5 80,1Q70,24 51,29Z',2,54,16,8);
    f('M-5,29Q4,59 26,53L18,30Z',3,15,41,7);
    f('M11,-33L38,-50L45,-25Z',13,34,-36,7);
   }
   fish(296,239,35);fish(311,474,-145);fish(385,102,-10);
  }else if(meta.kind==='cat'){
   rect(22,22,556,405,12,42,380);
   rect(94,66,412,290,5,305,78);rect(108,82,384,258,0,121,103);
   ellipse(376,147,40,40,2,376,147);
   add('M108,266Q190,208 280,266Q389,209 492,250L492,339L108,339Z',6,143,300);
   add('M108,304Q250,270 492,296L492,340L108,340Z',7,200,320);
   rect(293,82,13,258,3,299,200,9);rect(108,208,384,10,3,242,213,8);
   add('M67,58L106,58Q151,213 94,365L49,365Q94,228 67,58Z',4,91,159);
   add('M494,58L535,58Q508,226 552,365L507,365Q452,216 494,58Z',4,512,172);
   rect(80,346,440,15,3,300,354,8);
   for(let i=0;i<5;i++)rect(0,427+i*35,600,35,i%2?3:12,35,445+i*35,10);
   ellipse(293,459,153,68,9,225,474);
   ellipse(301,447,125,56,13,284,447);
   add('M191,440Q153,458 174,489Q210,508 242,479Q222,484 202,473Q188,461 210,445Z',3,189,476,9);
   ellipse(397,413,51,45,13,409,412);
   poly([[356,391],[358,346],[389,373]],13,367,370,9);poly([[409,374],[447,351],[442,405]],13,433,377,9);
   poly([[362,383],[363,360],[380,376]],4,367,374,6);poly([[420,378],[440,363],[437,390]],4,434,377,6);
   ellipse(404,430,27,14,1,404,433,9);
   for(let i=0;i<3;i++)add(`M${247+i*29},${397+i%2*5}Q${245+i*29},418 ${252+i*29},425L${261+i*29},425Q${264+i*29},411 ${260+i*29},${397+i%2*5}Z`,3,255+i*29,413,7);
   rect(88,394,47,51,1,110,421);add('M135,403Q168,399 161,426Q151,443 135,434L135,425Q148,432 150,417Q153,409 135,412Z',1,151,417,7);
  }
  // Anchors are placed on visible portions after foreground objects overlap them.
  const anchors={flowers:{6:[296.6,358.8],8:[409.9,386.2],9:[358.9,336.4],11:[285,403.6],12:[232.1,295.8],14:[171.7,407.3],16:[255.8,307.4],17:[366.1,438.1],19:[384.8,299.9]},coast:{8:[116.4,81.8],16:[118.3,296]},cat:{5:[324,268.7],17:[228,508.3],21:[374.6,365.7],22:[416.1,376]},pond:{6:[196.2,133.9],7:[571.2,403.7],8:[189.2,483.2],27:[231.3,191.2],33:[375.7,523.5],39:[301.7,112.2]}};
  for(const [id,position] of Object.entries(anchors[meta.kind]||{})){regions[id].x=position[0];regions[id].y=position[1];}
  return {...meta,palette:PALETTES[meta.scheme],regions};
 }
 const api={ARTWORKS,makeArt};if(typeof module!=='undefined')module.exports=api;else root.ColorArt=api;
})(globalThis);

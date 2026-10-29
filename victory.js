(function(root){
  const names=['Ветвящийся фрактал','Снежинка Коха','Треугольник Серпинского','Множество Жюлиа','Множество Мандельброта','Дракон Хартера','Папоротник Барнсли','Ковёр Серпинского','Кривая Гильберта'];
  function escapeAt(x,y,field){
    let zx=field.julia?x:0,zy=field.julia?y:0,cx=field.julia?field.cx:x,cy=field.julia?field.cy:y,n=0;
    while(zx*zx+zy*zy<=4&&n<field.iterations){const next=zx*zx-zy*zy+cx;zy=2*zx*zy+cy;zx=next;n++;}return n;
  }
  function createFractal(seed,family=seed%9){
    let state=seed>>>0;const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
    const segments=[],hue=Math.floor(random()*360),turn=random()*Math.PI*2;
    function line(a,b,depth){segments.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,depth,birth:0});}
    const point=(angle,r=1)=>({x:Math.cos(angle)*r,y:Math.sin(angle)*r});
    if(family===0){
      const arms=5+Math.floor(random()*4),spread=.36+random()*.38,ratio=.57+random()*.09;
      function branch(p,angle,length,depth){const q={x:p.x+Math.cos(angle)*length,y:p.y+Math.sin(angle)*length};line(p,q,depth);if(depth<6){branch(q,angle-spread,length*ratio,depth+1);branch(q,angle+spread,length*ratio,depth+1);}}
      for(let i=0;i<arms;i++)branch({x:0,y:0},turn+i*Math.PI*2/arms,.3,0);
    }else if(family===1){
      const sides=3+Math.floor(random()*3);
      function koch(a,b,depth){
        if(!depth){line(a,b,0);return;}
        const p={x:(2*a.x+b.x)/3,y:(2*a.y+b.y)/3},q={x:(a.x+2*b.x)/3,y:(a.y+2*b.y)/3};
        const dx=q.x-p.x,dy=q.y-p.y,r={x:p.x+dx*.5+dy*Math.sqrt(3)/2,y:p.y+dy*.5-dx*Math.sqrt(3)/2};
        koch(a,p,depth-1);koch(p,r,depth-1);koch(r,q,depth-1);koch(q,b,depth-1);
      }
      for(let i=0;i<sides;i++)koch(point(turn+i*2*Math.PI/sides),point(turn+(i+1)*2*Math.PI/sides),4);
    }else if(family===2){
      const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
      function triangle(a,b,c,depth){line(a,b,depth);line(b,c,depth);line(c,a,depth);if(depth<5){const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);triangle(a,ab,ca,depth+1);triangle(ab,b,bc,depth+1);triangle(ca,bc,c,depth+1);}}
      triangle(point(turn),point(turn+2*Math.PI/3),point(turn+4*Math.PI/3),0);
    }
    if(family===3||family===4){
      const constants=[[-.8,.156],[-.4,.6],[.285,.01],[-.74543,.11301],[-.70176,-.3842]];
      const c=constants[Math.floor(random()*constants.length)];
      return {seed,family,hue,name:names[family],segments,field:{julia:family===3,cx:c[0],cy:c[1],scale:family===3?1.65:1.6+random()*.25,centerX:family===3?0:-.55,iterations:96,smooth:true}};
    }
    if(family===5){
      const points=[{x:0,y:0},{x:1,y:0}];
      for(let depth=0;depth<11;depth++){const end=points[points.length-1],length=points.length;for(let i=length-2;i>=0;i--){const p=points[i];points.push({x:end.x-(p.y-end.y),y:end.y+(p.x-end.x)});}}
      for(let i=1;i<points.length;i++)line(points[i-1],points[i],Math.floor(i/points.length*7));
    }
    if(family===6){
      let x=0,y=0;const tilt=(random()-.5)*.3;
      for(let i=0;i<3250;i++){
        const pick=random();let nx,ny;
        if(pick<.01){nx=0;ny=.16*y;}else if(pick<.86){nx=.85*x+.04*y;ny=-.04*x+.85*y+1.6;}else if(pick<.93){nx=.2*x-.26*y;ny=.23*x+.22*y+1.6;}else{nx=-.15*x+.28*y;ny=.26*x+.24*y+.44;}x=nx;y=ny;
        if(i>=50){const p={x:x*Math.cos(tilt)+y*Math.sin(tilt),y:x*Math.sin(tilt)-y*Math.cos(tilt)};line(p,{x:p.x,y:p.y-.015},Math.min(6,Math.floor(y/10*7)));}
      }
    }
    if(family===7){
      function square(x,y,size,depth){const p=[{x,y},{x:x+size,y},{x:x+size,y:y+size},{x,y:y+size}];for(let i=0;i<4;i++)line(p[i],p[(i+1)%4],depth);}
      function carpet(x,y,size,depth){const third=size/3;square(x+third,y+third,third,depth);if(depth<3)for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(a!==1||b!==1)carpet(x+a*third,y+b*third,third,depth+1);}
      square(-1,-1,2,0);carpet(-1,-1,2,0);
    }
    if(family===8){
      const size=32,points=[];
      for(let d=0;d<size*size;d++){
        let x=0,y=0,t=d;
        for(let scale=1;scale<size;scale*=2){const rx=1&(t>>1),ry=1&(t^rx);if(!ry){if(rx){x=scale-1-x;y=scale-1-y;}[x,y]=[y,x];}x+=scale*rx;y+=scale*ry;t>>=2;}points.push({x,y});
      }
      for(let i=1;i<points.length;i++)line(points[i-1],points[i],Math.floor(i/points.length*7));
    }
    if(family>=5){
      const xs=segments.flatMap(s=>[s.x1,s.x2]),ys=segments.flatMap(s=>[s.y1,s.y2]);
      const midX=(Math.min(...xs)+Math.max(...xs))/2,midY=(Math.min(...ys)+Math.max(...ys))/2;
      const rotation=family===6?0:turn;
      for(const s of segments)for(const end of ['1','2']){const x=s['x'+end]-midX,y=s['y'+end]-midY;s['x'+end]=x*Math.cos(rotation)-y*Math.sin(rotation);s['y'+end]=x*Math.sin(rotation)+y*Math.cos(rotation);}
    }
    const radius=Math.max(...segments.flatMap(s=>[Math.hypot(s.x1,s.y1),Math.hypot(s.x2,s.y2)]));
    segments.forEach((s,i)=>{for(const name of ['x1','y1','x2','y2'])s[name]/=radius;s.birth=family===0?s.depth/8:family===1||family===5||family===8?i/segments.length*.8:family===6?((1-s.y1)/2)*.8:s.depth/7;});
    return {seed,family,hue,segments,name:names[family]};
  }
  if(typeof module!=='undefined')module.exports={createFractal,escapeAt,names};
  if(typeof document==='undefined')return;
  let previousFamily=-1,previousSeed=-1,familyBag=[];
  root.playVictoryFractal=function(){
    const canvas=document.querySelector('#victory-art'),overlay=document.querySelector('#win'),panel=overlay.querySelector('.modal'),ctx=canvas.getContext('2d');
    if(!ctx)return ()=>{};
    let seed;try{seed=crypto.getRandomValues(new Uint32Array(1))[0];}catch(e){seed=(Date.now()^Math.floor(Math.random()*4294967296))>>>0;}
    if(seed===previousSeed)seed=(seed+1)>>>0;
    if(!familyBag.length){
      familyBag=names.map((_,i)=>i);let shuffle=seed;
      for(let i=familyBag.length-1;i>0;i--){shuffle=(Math.imul(shuffle,1664525)+1013904223)>>>0;const j=shuffle%(i+1);[familyBag[i],familyBag[j]]=[familyBag[j],familyBag[i]];}
      if(familyBag[familyBag.length-1]===previousFamily)[familyBag[0],familyBag[familyBag.length-1]]=[familyBag[familyBag.length-1],familyBag[0]];
    }
    const family=familyBag.pop(),model=createFractal(seed,family);
    document.querySelector('#fractal-name').textContent=model.name;
    previousSeed=seed;previousFamily=family;canvas.dataset.seed=String(seed);canvas.dataset.family=String(family);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),duration=4400;
    let raster=null,rasterContext=null,rasterData=null,rasterRow=0;
    const rasterSize=256;
    if(model.field){raster=document.createElement('canvas');raster.width=raster.height=rasterSize;rasterContext=raster.getContext('2d');if(rasterContext)rasterData=rasterContext.createImageData(rasterSize,rasterSize);}
    function prepareRaster(all){
      if(!rasterData||rasterRow>=rasterSize)return;
      const deadline=performance.now()+3,field=model.field;
      do{
        const py=(rasterRow/(rasterSize-1)*2-1)*field.scale;
        for(let col=0;col<rasterSize;col++){
          const px=(col/(rasterSize-1)*2-1)*field.scale+field.centerX,n=escapeAt(px,py,field),offset=(rasterRow*rasterSize+col)*4;
          if(n===field.iterations){rasterData.data.set([16,32,39,245],offset);}else{
            const hue=(model.hue+n*7)*Math.PI/180;
            rasterData.data[offset]=Math.round(140+110*Math.cos(hue));rasterData.data[offset+1]=Math.round(140+110*Math.cos(hue-2*Math.PI/3));rasterData.data[offset+2]=Math.round(140+110*Math.cos(hue+2*Math.PI/3));rasterData.data[offset+3]=Math.min(240,Math.max(0,(n-1)*42));
          }
        }
        rasterRow++;
      }while(rasterRow<rasterSize&&(all||performance.now()<deadline));
      rasterContext.putImageData(rasterData,0,0);
    }
    let frame=null,stopped=false,began=null,lastFrame=-Infinity,progress=0,width,height,ratio;
    function size(){const rect=overlay.getBoundingClientRect();width=rect.width;height=rect.height;ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);paint(progress);}
    function paint(value){
      const panelRect=panel.getBoundingClientRect(),overlayRect=overlay.getBoundingClientRect();
      const mobile=matchMedia('(max-width:760px), (pointer:coarse) and (max-height:500px)').matches;
      const stageHeight=mobile?Math.max(90,panelRect.top-overlayRect.top):height;
      const radius=Math.min(width*.43,stageHeight*.44),cx=width/2,cy=stageHeight/2;
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
      const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,radius*1.35);glow.addColorStop(0,`hsla(${model.hue},75%,65%,.13)`);glow.addColorStop(1,`hsla(${model.hue},75%,65%,0)`);ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
      ctx.save();ctx.translate(cx,cy);ctx.rotate((value-.5)*.07);ctx.scale(radius*(.86+.14*Math.min(1,value*1.4)),radius*(.86+.14*Math.min(1,value*1.4)));
      if(model.field&&rasterContext){
        prepareRaster(reduced.matches||value===1);ctx.save();ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.clip();ctx.globalAlpha=Math.min(1,value*2.5);ctx.imageSmoothingEnabled=true;ctx.drawImage(raster,-1,-1,2,2);ctx.restore();
      }
      for(let group=0;group<7;group++){
        ctx.beginPath();
        for(const segment of model.segments){
          const bucket=model.family===1?Math.floor(Math.hypot(segment.x1,segment.y1)*6)%7:segment.depth%7;
          if(bucket!==group)continue;
          const reveal=Math.max(0,Math.min(1,(value-segment.birth*.76)*5));if(!reveal)continue;
          ctx.moveTo(segment.x1,segment.y1);ctx.lineTo(segment.x1+(segment.x2-segment.x1)*reveal,segment.y1+(segment.y2-segment.y1)*reveal);
        }
        ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=`hsla(${(model.hue+group*17)%360},80%,76%,.12)`;ctx.lineWidth=6/radius;ctx.stroke();ctx.strokeStyle=`hsla(${(model.hue+group*17)%360},82%,78%,.85)`;ctx.lineWidth=Math.max(.75,1.45-group*.1)/radius;ctx.stroke();
      }
      ctx.restore();
      // A quiet halo of points complements the recursive geometry without flashing.
      ctx.fillStyle=`hsla(${model.hue},85%,85%,.55)`;
      for(let i=0;i<22;i++){const angle=i*2.399963+model.seed*.001,r=radius*(1.02+(i%5)*.035);ctx.globalAlpha=Math.min(1,value*3)*(.45+(i%3)*.15);ctx.beginPath();ctx.arc(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r,1+(i%2)*.4,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    }
    function draw(now){if(stopped)return;if(began===null)began=now;if(now-lastFrame>=30){progress=Math.min(1,(now-began)/duration);paint(progress);lastFrame=now;}if(progress<1)frame=requestAnimationFrame(draw);else frame=null;}
    function finish(){if(stopped)return;cancelAnimationFrame(frame);frame=null;progress=1;paint(1);}
    function onVisibility(){if(document.hidden)finish();}
    function onPreference(){if(reduced.matches)finish();}
    const observer=new ResizeObserver(size);observer.observe(overlay);observer.observe(panel);
    document.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',onPreference);
    size();if(reduced.matches)finish();else frame=requestAnimationFrame(draw);
    return function stop(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onPreference);ctx.clearRect(0,0,canvas.width,canvas.height);};
  };
})(globalThis);

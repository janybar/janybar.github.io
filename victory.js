(function(root){
  function createFractal(seed,family=seed%3){
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
    }else{
      const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
      function triangle(a,b,c,depth){line(a,b,depth);line(b,c,depth);line(c,a,depth);if(depth<5){const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);triangle(a,ab,ca,depth+1);triangle(ab,b,bc,depth+1);triangle(ca,bc,c,depth+1);}}
      triangle(point(turn),point(turn+2*Math.PI/3),point(turn+4*Math.PI/3),0);
    }
    const radius=Math.max(...segments.flatMap(s=>[Math.hypot(s.x1,s.y1),Math.hypot(s.x2,s.y2)]));
    segments.forEach((s,i)=>{for(const name of ['x1','y1','x2','y2'])s[name]/=radius;s.birth=family===0?s.depth/8:family===1?i/segments.length*.75:s.depth/7;});
    return {seed,family,hue,segments};
  }
  if(typeof module!=='undefined')module.exports={createFractal};
  if(typeof document==='undefined')return;
  let previousFamily=-1,previousSeed=-1;
  root.playVictoryFractal=function(){
    const canvas=document.querySelector('#victory-art'),overlay=document.querySelector('#win'),panel=overlay.querySelector('.modal'),ctx=canvas.getContext('2d');
    if(!ctx)return ()=>{};
    let seed;try{seed=crypto.getRandomValues(new Uint32Array(1))[0];}catch(e){seed=(Date.now()^Math.floor(Math.random()*4294967296))>>>0;}
    if(seed===previousSeed)seed=(seed+1)>>>0;
    const family=previousFamily<0?seed%3:(previousFamily+1+seed%2)%3,model=createFractal(seed,family);
    previousSeed=seed;previousFamily=family;canvas.dataset.seed=String(seed);canvas.dataset.family=String(family);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),duration=4400;
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

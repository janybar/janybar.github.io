/* Local canvas overlay: horizontal liquid surfaces preserve their volume at any angle. */
(function () {
  function area(points) {
    return Math.abs(points.reduce((sum,p,i) => { const q=points[(i+1)%points.length]; return sum+p.x*q.y-q.x*p.y; },0))/2;
  }
  function below(points,y) {
    const out=[];
    points.forEach((p,i)=>{
      const q=points[(i+1)%points.length], a=p.y>=y, b=q.y>=y;
      if(a)out.push(p);
      if(a!==b){const t=(y-p.y)/(q.y-p.y);out.push({x:p.x+t*(q.x-p.x),y});}
    });
    return out;
  }
  function waterline(points,fraction) {
    let low=Math.min(...points.map(p=>p.y)),high=Math.max(...points.map(p=>p.y));
    const wanted=area(points)*fraction;
    for(let i=0;i<24;i++){const middle=(low+high)/2;if(area(below(points,middle))>wanted)low=middle;else high=middle;}
    return (low+high)/2;
  }
  if(typeof module!=='undefined')module.exports={area,below,waterline};
  if(typeof window==='undefined')return;
  window.playWaterPour=function({source,target,colors,amount,palette}) {
    const glass=source.querySelector('.tube'),receiver=target.querySelector('.tube');
    const a=glass.getBoundingClientRect(),b=receiver.getBoundingClientRect();
    const canvas=document.createElement('canvas');canvas.className='liquid-flight';canvas.setAttribute('aria-hidden','true');
    const ratio=Math.min(window.devicePixelRatio||1,2),width=innerWidth,height=innerHeight;
    canvas.width=width*ratio;canvas.height=height*ratio;document.body.appendChild(canvas);
    const ctx=canvas.getContext('2d');
    if(!ctx){canvas.remove();return {finished:Promise.resolve(true),cancel(){}};}
    ctx.scale(ratio,ratio);
    const style=getComputedStyle(glass),border=style.borderLeftColor,background=style.backgroundColor;
    const direction=b.left+b.width/2>width/2?1:-1;
    const w=a.width-7,h=a.height-4,r=Math.min(w/2,16);
    const shape=[{x:-w/2,y:0},{x:w/2,y:0},{x:w/2,y:h-r}];
    for(let i=1;i<=6;i++){const theta=i*Math.PI/12;shape.push({x:w/2-r+r*Math.cos(theta),y:h-r+r*Math.sin(theta)});}
    shape.push({x:-w/2+r,y:h});
    for(let i=1;i<=6;i++){const theta=Math.PI/2+i*Math.PI/12;shape.push({x:-w/2+r+r*Math.cos(theta),y:h-r+r*Math.sin(theta)});}
    shape.push({x:-w/2,y:0});
    const transform=(x,y,angle)=>shape.map(p=>({x:x+p.x*Math.cos(angle)-p.y*Math.sin(angle),y:y+p.x*Math.sin(angle)+p.y*Math.cos(angle)}));
    const ease=t=>t*t*t*(t*(t*6-15)+10),clamp=t=>Math.max(0,Math.min(1,t));
    const travel=Math.min(370,260+Math.hypot(b.left-a.left,b.top-a.top)*.18);
    const flowStart=travel+35,flowDuration=390+amount*90,flowEnd=flowStart+flowDuration;
    const returnStart=flowEnd+90,duration=returnStart+300;
    const liquidColor=palette[colors[colors.length-1]];
    const incoming=document.createElement('span');incoming.className='water incoming-water';incoming.style.setProperty('--water',palette[colors[colors.length-1]]);incoming.style.height='0px';receiver.appendChild(incoming);
    const existing=receiver.children.length-1,unit=(receiver.clientHeight-3)/4;
    source.classList.add('in-flight');target.classList.add('taking-water');
    let resolve,frame,ended=false,started;
    const finished=new Promise(r=>resolve=r);
    function cleanup(commit){if(ended)return;ended=true;cancelAnimationFrame(frame);canvas.remove();incoming.remove();source.classList.remove('in-flight');target.classList.remove('taking-water');window.removeEventListener('resize',finish);window.removeEventListener('scroll',finish);document.removeEventListener('visibilitychange',onVisibility);resolve(commit);}
    const finish=()=>cleanup(true),onVisibility=()=>{if(document.hidden)finish();};
    window.addEventListener('resize',finish);window.addEventListener('scroll',finish,{passive:true});document.addEventListener('visibilitychange',onVisibility);
    function draw(now){
      if(ended)return;if(started===undefined)started=now;
      const elapsed=now-started,approach=ease(clamp(elapsed/travel)),flow=clamp((elapsed-flowStart)/flowDuration),drain=flow*flow*(3-2*flow),back=ease(clamp((elapsed-returnStart)/300));
      const remaining=colors.length-amount*drain;
      // Find the tilt at which the liquid surface reaches the lower edge of the mouth.
      let lo=0,hi=Math.PI*.72;
      for(let n=0;n<16;n++){const mid=(lo+hi)/2,poly=transform(0,0,mid),lip=w/2*Math.sin(mid);if(area(below(poly,lip))/area(poly)>Math.max(.015,remaining/4))lo=mid;else hi=mid;}
      const angle=direction*(lo+hi)/2*approach*(1-back);
      const targetX=b.left+b.width/2,lipY=b.top-24;
      const mouthX=targetX-direction*w/2*Math.cos(angle),mouthY=lipY-w/2*Math.abs(Math.sin(angle));
      const blend=approach*(1-back),x=(a.left+a.width/2)*(1-blend)+mouthX*blend;
      const y=(a.top+12*back)*(1-blend)+mouthY*blend-16*Math.sin(Math.PI*approach)*(1-back)-10*Math.sin(Math.PI*back);
      const polygon=transform(x,y,angle);
      ctx.clearRect(0,0,width,height);
      const shadow=ctx.createRadialGradient(a.left+a.width/2,a.bottom+8,1,a.left+a.width/2,a.bottom+8,a.width*.7);
      shadow.addColorStop(0,`rgba(20,40,32,${.1*blend})`);shadow.addColorStop(1,'rgba(20,40,32,0)');
      ctx.save();ctx.translate(0,a.bottom+8);ctx.scale(1,.18);ctx.translate(0,-a.bottom-8);ctx.fillStyle=shadow;ctx.fillRect(a.left-a.width,a.bottom-a.width,a.width*3,a.width*2);ctx.restore();
      ctx.save();ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=background;ctx.fill();ctx.clip();
      let cumulative=0;
      for(let i=0;i<colors.length;i++){
        const volume=Math.min(1,Math.max(0,remaining-i));if(!volume)continue;
        const lower=cumulative?waterline(polygon,cumulative/4):Math.max(...polygon.map(p=>p.y))+1;cumulative+=volume;
        const upper=waterline(polygon,cumulative/4);
        const left=Math.min(...polygon.map(p=>p.x))-2,right=Math.max(...polygon.map(p=>p.x))+2;
        const wave=i===Math.ceil(remaining)-1?.65*(Math.sin(Math.PI*flow)+Math.sin(Math.PI*back)):0;
        ctx.beginPath();ctx.moveTo(left,lower+.5);ctx.lineTo(left,upper);
        for(let px=left;px<=right+3;px+=3)ctx.lineTo(px,upper+wave*Math.sin((px-left)*.1+elapsed*.012));
        ctx.lineTo(right+3,lower+.5);ctx.closePath();ctx.fillStyle=palette[colors[i]];ctx.fill();
        const sheen=ctx.createLinearGradient(left,0,right,0);sheen.addColorStop(0,'#ffffff18');sheen.addColorStop(.35,'#ffffff00');sheen.addColorStop(1,'#00000015');ctx.fillStyle=sheen;ctx.fill();
        ctx.strokeStyle='#ffffff40';ctx.lineWidth=.8;ctx.beginPath();
        for(let px=left;px<=right+3;px+=3){const py=upper+wave*Math.sin((px-left)*.1+elapsed*.012);if(px===left)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
      }
      ctx.restore();ctx.beginPath();polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=border;ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();
      // Subtle glass reflection follows the vessel, never the liquid.
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle='#ffffff55';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-w/2+5,9);ctx.lineTo(-w/2+5,h-r-3);ctx.stroke();ctx.restore();
      incoming.style.height=`${amount*drain*unit}px`;
      const surface=b.bottom-6-(existing+amount*drain)*unit;
      const tip={x:x+direction*w/2*Math.cos(angle),y:y+direction*w/2*Math.sin(angle)};
      if(elapsed>=flowStart&&elapsed<flowEnd){
        const strength=Math.pow(Math.sin(Math.PI*flow),.45),streamWidth=1.4+2.8*strength;
        const fall=clamp((elapsed-flowStart)/65),endY=tip.y+(surface-tip.y)*fall;
        ctx.globalAlpha=Math.min(1,(flowEnd-elapsed)/45);ctx.strokeStyle=liquidColor;ctx.lineWidth=streamWidth;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.bezierCurveTo(tip.x,tip.y+14,targetX,endY-16,targetX,endY);ctx.stroke();
        ctx.strokeStyle='#ffffff50';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(tip.x-.7,tip.y+2);ctx.bezierCurveTo(tip.x-.7,tip.y+14,targetX-.7,endY-16,targetX-.7,endY);ctx.stroke();ctx.globalAlpha=1;
      }
      // Expanding rings stay inside the receiving vessel; their energy decays after the stream stops.
      if(elapsed>flowStart+60&&elapsed<flowEnd+200){
        const energy=clamp((flowEnd+200-elapsed)/200);
        ctx.save();ctx.beginPath();ctx.rect(b.left+5,b.top,b.width-10,b.height-5);ctx.clip();
        for(let ring=0;ring<2;ring++){
          const phase=((elapsed-flowStart)/250+ring*.5)%1;
          ctx.globalAlpha=(1-phase)*.48*energy;ctx.strokeStyle='#ffffff';ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(targetX,surface+1,2+phase*(b.width*.48),.7+phase*2.3,0,0,Math.PI*2);ctx.stroke();
        }
        ctx.restore();
      }
      // Two small trailing drops finish the stream without an abrupt cutoff.
      if(elapsed>=flowEnd&&elapsed<flowEnd+90){
        for(let drop=0;drop<2;drop++){
          const t=clamp((elapsed-flowEnd-drop*22)/65);
          if(t>0&&t<1){ctx.globalAlpha=1-t*.6;ctx.fillStyle=liquidColor;ctx.beginPath();ctx.ellipse(targetX,tip.y+(surface-tip.y)*t*t,1.3,2,0,0,Math.PI*2);ctx.fill();}
        }ctx.globalAlpha=1;
      }
      if(elapsed>=duration){cleanup(true);return;}frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);
    return {finished,cancel:()=>cleanup(false)};
  };
})();

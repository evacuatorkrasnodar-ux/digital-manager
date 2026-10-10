/* My Day v261: redraw locally hosted photo pixels to create luminous sunset.
   No user data, IndexedDB, or network storage touched. */
(() => {
 'use strict';
 function gauss(x,y,cx,cy,rx,ry){return Math.exp(-Math.pow((x-cx)/rx,2)-Math.pow((y-cy)/ry,2));}
 function init(){
   const shell=document.querySelector('.day-shell:not(.care-shell,.world-shell,.health-shell)');if(!shell)return;
   const img=new Image();img.decoding='async';
   img.onload=()=>{
    try {
     const w=640,h=360,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;
     ctx.drawImage(img,0,0,w,h);const frame=ctx.getImageData(0,0,w,h),d=frame.data;
     const clamp=n=>Math.max(0,Math.min(1,n));
     for(let y=0;y<h;y++){
      const yy=y*432/h,sky=clamp((265-yy)/90);
      for(let x=0;x<w;x++){
       const xx=x*768/w,k=(y*w+x)*4;
       let r=d[k]/255,g=d[k+1]/255,b=d[k+2]/255;
       const lum=.2126*r+.7152*g+.0722*b;
       const lit=clamp((lum-.12)/.22)*sky;
       const warm=lit*gauss(xx,yy,452,176,230,107)*.76;
       r=r*(1-warm)+warm;g=g*(1-warm)+.19*warm;b=b*(1-warm)+.028*warm;
       const cool=gauss(xx,yy,50,37,295,195)*clamp((310-yy)/280)*.52;
       r=r*(1-cool)+.015*cool;g=g*(1-cool)+.10*cool;b=b*(1-cool)+.27*cool;
       const l1=gauss(xx,yy,430,181,150,75)*lit*.55,l2=gauss(xx,yy,430,187,88,36)*lit*.37,l3=gauss(xx,yy,430,184,27,13)*lit*.31;
       r=1-(1-r)*(1-l1);g=1-(1-g)*(1-.32*l1);b=1-(1-b)*(1-.04*l1);
       r=1-(1-r)*(1-l2);g=1-(1-g)*(1-.46*l2);b=1-(1-b)*(1-.10*l2);
       r=1-(1-r)*(1-l3);g=1-(1-g)*(1-.77*l3);b=1-(1-b)*(1-.39*l3);
       const haze=gauss(xx,yy,350,286,320,64)*clamp((680-xx)/300)*.20;
       r=1-(1-r)*(1-.04*haze);g=1-(1-g)*(1-.3*haze);b=1-(1-b)*(1-.59*haze);
       const water=gauss(xx,yy,422,367,150,90)*clamp((yy-291)/100)*(.25+clamp(lum*1.4));
       r=1-(1-r)*(1-.32*water);g=1-(1-g)*(1-.12*water);b=1-(1-b)*(1-.028*water);
       d[k]=255*Math.pow(clamp((r-.46)*1.085+.46),.93);
       d[k+1]=255*Math.pow(clamp((g-.46)*1.085+.46),.93);
       d[k+2]=255*Math.pow(clamp((b-.46)*1.085+.46),.93);
      }
     }
     ctx.putImageData(frame,0,0);
     // Extend the scene with a blurred reflection so that the photograph
     // does not abruptly end between the greeting and the glass tabs.
     const extended=document.createElement('canvas');
     extended.width=w;extended.height=780;
     const ec=extended.getContext('2d');
     if(!ec)return;
     ec.drawImage(canvas,0,0);
     ec.save();
     ec.translate(0,h*2);ec.scale(1,-1);
     ec.filter='blur(15px) saturate(.93)';
     ec.drawImage(canvas,0,0);
     ec.restore();
     const fade=ec.createLinearGradient(0,h-60,0,780);
     fade.addColorStop(0,'rgba(1,6,15,0)');
     fade.addColorStop(.25,'rgba(1,6,15,.30)');
     fade.addColorStop(.62,'rgba(0,4,11,.83)');
     fade.addColorStop(1,'#01040b');
     ec.fillStyle=fade;ec.fillRect(0,h-60,w,780-h+60);
     extended.toBlob(blob=>{
      if(!blob)return;
      const url=URL.createObjectURL(blob);
      shell.style.setProperty('--dm-scene','url("'+url+'")');
      window.addEventListener('pagehide',()=>URL.revokeObjectURL(url),{once:true});
     },'image/webp',.88);
    }catch(_){/* retain original photograph */}
   };
   img.src='./assets/architecture-hero.png';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
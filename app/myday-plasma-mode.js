/* Calendar / My Day: respect the single Home "Show dock" preference.
   Only myday.html uses this file. The animated orb markup is the real Home
   dock-free launcher, not a hand-drawn or generated image. */
(() => {
  'use strict';
  if((location.pathname.split('/').pop()||'index.html')!=='myday.html')return;
  const KEY='digital-manager-black-velvet-v2';
  function dockEnabled(){
    try{
      const settings=JSON.parse(localStorage.getItem(KEY)||'{}');
      return settings?.management?.voice?.dock!==false;
    }catch(_){return true;}
  }
  function init(){
    const stage=document.createElement('div');
    stage.className='dm-myday-plasma-stage';
    stage.hidden=true;
    stage.innerHTML="<button type=\"button\" id=\"mydayPlasmaLauncher\" class=\"dock-launcher\" aria-label=\"Открыть действия помощника\" aria-expanded=\"false\" aria-controls=\"mydayPlasmaMenu\"><svg class=\"dm-voice-waves dm-voice-waves-electric dm-launcher-waves\" viewBox=\"0 0 400 125\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"dmLauncherWaveElectric0\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#4ca4ff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#4ca4ff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#4ca4ff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmLauncherWaveElectric1\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#8577ef\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#8577ef\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#8577ef\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmLauncherWaveElectric2\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#5eacff\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#5eacff\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#5eacff\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmLauncherWaveElectric3\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/><stop offset=\"21%\" stop-color=\"#7055d9\" stop-opacity=\".52\"/><stop offset=\"36%\" stop-color=\"#a4dfff\" stop-opacity=\".79\"/><stop offset=\"43%\" stop-color=\"#9cdaff\" stop-opacity=\".79\"/><stop offset=\"57%\" stop-color=\"#b9a0ff\" stop-opacity=\".82\"/><stop offset=\"64%\" stop-color=\"#72baff\" stop-opacity=\".70\"/><stop offset=\"79%\" stop-color=\"#7055d9\" stop-opacity=\".49\"/><stop offset=\"100%\" stop-color=\"#7055d9\" stop-opacity=\".06\"/></linearGradient><linearGradient id=\"dmLauncherWaveElectric4\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\"><stop offset=\"0%\" stop-color=\"#357fe6\" stop-opacity=\".08\"/><stop offset=\"14%\" stop-color=\"#488bea\" stop-opacity=\".29\"/><stop offset=\"22%\" stop-color=\"#63a9ff\" stop-opacity=\".59\"/><stop offset=\"25%\" stop-color=\"#b9eaff\" stop-opacity=\".95\"/><stop offset=\"28%\" stop-color=\"#68bfff\" stop-opacity=\".64\"/><stop offset=\"36%\" stop-color=\"#5389fa\" stop-opacity=\".47\"/><stop offset=\"48%\" stop-color=\"#628dfb\" stop-opacity=\".36\"/><stop offset=\"60%\" stop-color=\"#705ff0\" stop-opacity=\".44\"/><stop offset=\"69%\" stop-color=\"#917bfa\" stop-opacity=\".62\"/><stop offset=\"74%\" stop-color=\"#dfdcff\" stop-opacity=\".97\"/><stop offset=\"78%\" stop-color=\"#8bafff\" stop-opacity=\".66\"/><stop offset=\"87%\" stop-color=\"#5888ec\" stop-opacity=\".28\"/><stop offset=\"100%\" stop-color=\"#4772d8\" stop-opacity=\".06\"/></linearGradient></defs><g class=\"dm-laser-track dm-electric-wave-0\"><path class=\"dm-laser-bloom\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmLauncherWaveElectric0)\"/><path class=\"dm-laser-halo\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmLauncherWaveElectric0)\"/><path class=\"dm-laser-core\" d=\"M-12 72C26 73 63 34 104 53S149 88 171 90 M229 90C259 68 284 34 320 53S370 86 412 73\" stroke=\"url(#dmLauncherWaveElectric0)\"/></g><g class=\"dm-laser-track dm-electric-wave-1\"><path class=\"dm-laser-bloom\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmLauncherWaveElectric1)\"/><path class=\"dm-laser-halo\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmLauncherWaveElectric1)\"/><path class=\"dm-laser-core\" d=\"M-12 100C35 82 73 104 113 90S155 79 171 91 M229 91C263 104 293 79 329 88S375 94 412 100\" stroke=\"url(#dmLauncherWaveElectric1)\"/></g><g class=\"dm-laser-track dm-electric-wave-2\"><path class=\"dm-laser-bloom\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmLauncherWaveElectric2)\"/><path class=\"dm-laser-halo\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmLauncherWaveElectric2)\"/><path class=\"dm-laser-core\" d=\"M-12 88C33 83 75 56 111 72S152 99 171 90 M229 90C266 85 287 58 321 72S369 78 412 88\" stroke=\"url(#dmLauncherWaveElectric2)\"/></g><g class=\"dm-laser-track dm-electric-wave-3\"><path class=\"dm-laser-bloom\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmLauncherWaveElectric3)\"/><path class=\"dm-laser-halo\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmLauncherWaveElectric3)\"/><path class=\"dm-laser-core\" d=\"M-12 113C26 101 70 108 111 99S151 96 171 92 M229 92C268 99 294 112 335 99S372 101 412 113\" stroke=\"url(#dmLauncherWaveElectric3)\"/></g><g class=\"dm-laser-track dm-electric-wave-4\"><path class=\"dm-laser-bloom\" d=\"M-12 114 C25 114 52 114 78 113.4 C102 112.8 123 110.8 146 112.5 C169 114 183 114 200 113.8 C218 113.6 228 113.6 248 113.1 C274 112.4 287 111.4 309 112.9 C338 114.2 370 114 412 114\" stroke=\"url(#dmLauncherWaveElectric4)\"/><path class=\"dm-laser-halo\" d=\"M-12 114 C25 114 52 114 78 113.4 C102 112.8 123 110.8 146 112.5 C169 114 183 114 200 113.8 C218 113.6 228 113.6 248 113.1 C274 112.4 287 111.4 309 112.9 C338 114.2 370 114 412 114\" stroke=\"url(#dmLauncherWaveElectric4)\"/><path class=\"dm-laser-core\" d=\"M-12 114 C25 114 52 114 78 113.4 C102 112.8 123 110.8 146 112.5 C169 114 183 114 200 113.8 C218 113.6 228 113.6 248 113.1 C274 112.4 287 111.4 309 112.9 C338 114.2 370 114 412 114\" stroke=\"url(#dmLauncherWaveElectric4)\"/></g></svg><span class=\"dm-voice-orb dm-voice-orb-electric dm-launcher-plasma\" aria-hidden=\"true\"><i class=\"dm-orb-halo\"></i><i class=\"dm-orb-rim\"></i><i class=\"dm-orb-edge\"></i><svg class=\"dm-orb-spectral\" viewBox=\"0 0 120 120\" aria-hidden=\"true\"><defs><linearGradient id=\"dmLauncherElectricStroke\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#68bfff\"/><stop offset=\".22\" stop-color=\"#d7fbff\"/><stop offset=\".43\" stop-color=\"#2d82ff\"/><stop offset=\".63\" stop-color=\"#264be5\"/><stop offset=\".82\" stop-color=\"#a080ff\"/><stop offset=\"1\" stop-color=\"#5960f4\"/></linearGradient><linearGradient id=\"dmLauncherElectricInner\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#89ceff\"/><stop offset=\".34\" stop-color=\"#1b6af7\"/><stop offset=\".62\" stop-color=\"#0b26a7\"/><stop offset=\".87\" stop-color=\"#b394ff\"/><stop offset=\"1\" stop-color=\"#376eff\"/></linearGradient></defs><circle cx=\"60\" cy=\"60\" r=\"53\" fill=\"none\" stroke=\"#3564ec\" stroke-width=\".65\" opacity=\".42\"/><circle cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"url(#dmLauncherElectricStroke)\" stroke-width=\"2.1\" opacity=\".9\"/><circle cx=\"60\" cy=\"60\" r=\"47\" fill=\"none\" stroke=\"url(#dmLauncherElectricInner)\" stroke-width=\"1.1\" opacity=\".83\"/><circle class=\"dm-orb-arc dm-arc-ice\" cx=\"60\" cy=\"60\" r=\"50.5\" fill=\"none\" stroke=\"#c5efff\" stroke-width=\"2.05\" stroke-linecap=\"round\" stroke-dasharray=\"80 238\"/><circle class=\"dm-orb-arc dm-arc-violet\" cx=\"60\" cy=\"60\" r=\"50\" fill=\"none\" stroke=\"#d2aaff\" stroke-width=\"2.15\" stroke-linecap=\"round\" stroke-dasharray=\"53 261\"/></svg></span></button>";
    // The existing five laser tracks stay intact; mount the SAME restored
    // plasma component directly, without creating or layering another logo.
    const oldOrb=stage.querySelector('.dm-launcher-plasma');
    if(oldOrb&&window.DMSharedPlasma?.create){
      oldOrb.replaceWith(window.DMSharedPlasma.create('calendar'));
    }
    const button=stage.querySelector('#mydayPlasmaLauncher');
    button.dataset.mode='idle'; // Exactly the white waiting state, never blue-thinking.
    const menu=document.createElement('nav');
    menu.id='mydayPlasmaMenu';
    menu.className='dm-myday-plasma-menu';
    menu.setAttribute('aria-label','Быстрые действия помощника');
    menu.hidden=true;
    menu.innerHTML=
      '<a href="./index.html" aria-label="На главную"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3z"/></svg><span>Главная</span></a>'+
      '<a href="./index.html?jump=assistant" aria-label="Открыть помощника"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H6l-3 2v-8a8 8 0 1 1 17-2Z"/></svg><span>Помощник</span></a>'+
      '<a href="./index.html?jump=management" aria-label="Открыть управление"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span>Управление</span></a>';
    stage.append(menu);
    document.body.append(stage);
    const legacyDock=document.querySelector('body > nav.bottom-nav');
    function close(){
      menu.hidden=true;
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Открыть действия помощника');
    }
    function sync(){
      const enabled=dockEnabled();
      document.documentElement.classList.toggle('dm-myday-no-dock',!enabled);
      if(legacyDock)legacyDock.hidden=!enabled;
      stage.hidden=enabled;
      if(enabled)close();
    }
    button.addEventListener('click',event=>{
      event.stopPropagation();
      if(dockEnabled())return;
      const open=menu.hidden;
      menu.hidden=!open;
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Закрыть действия помощника':'Открыть действия помощника');
    });
    document.addEventListener('click',event=>{
      if(!stage.contains(event.target))close();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!menu.hidden){close();button.focus();}
    });
    window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)sync();});
    window.addEventListener('pageshow',sync);
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
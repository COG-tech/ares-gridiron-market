(function(){
  function ready(fn){if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn);}else{fn();}}
  ready(function(){
    document.documentElement.classList.add('ares-public-preview');
    var banner=document.createElement('div');
    banner.className='ares-paid-preview-banner';
    banner.innerHTML='<strong>Public preview:</strong> ARES paid rankings, scores, player profiles, and model data are locked. This page shows layout only.';
    document.body.insertBefore(banner, document.body.firstChild);
  });
}());

/* FESTNEST — TOAST  |  assets/js/toast.js */
'use strict';
function showToast(msg,type='',dur=3000){
  let c=document.getElementById('toastContainer');
  if(!c){c=document.createElement('div');c.className='toast-container';c.id='toastContainer';c.setAttribute('aria-live','polite');document.body.appendChild(c);}
  const t=document.createElement('div');
  t.className='toast'+(type?' toast--'+type:'');t.textContent=msg;t.setAttribute('role','alert');
  c.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('toast--show')));
  const rm=()=>{t.classList.remove('toast--show');t.addEventListener('transitionend',()=>t.remove(),{once:true});};
  const timer=setTimeout(rm,dur);
  t.addEventListener('click',()=>{clearTimeout(timer);rm();});
}
window.showToast=showToast;

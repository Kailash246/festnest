/* FESTNEST — LANDING  |  assets/js/landing.js */
'use strict';
document.addEventListener('DOMContentLoaded',function(){
  if(!('IntersectionObserver' in window))return;
  const obs=new IntersectionObserver((entries)=>{entries.forEach((e,i)=>{if(e.isIntersecting){e.target.style.animationDelay=(i*.07)+'s';e.target.classList.add('animate-fadeInUp');obs.unobserve(e.target);}});},{threshold:.1});
  document.querySelectorAll('.feature-card,.how-card,.testi-card,.category-card').forEach(el=>obs.observe(el));
});

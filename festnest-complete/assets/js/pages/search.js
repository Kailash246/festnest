/* FESTNEST — SEARCH PAGE  |  assets/js/pages/search.js */
'use strict';
document.addEventListener('DOMContentLoaded',function(){
  const bigInp=document.getElementById('bigSearchInput');
  const resultsSection=document.getElementById('searchResultsSection');
  const trendingSection=document.getElementById('trendingSection');
  const resultsCount=document.getElementById('searchResultsCount');

  async function loadDefaults(){
    const tg=document.getElementById('trendingGrid'),ng=document.getElementById('newGrid');
    try{
      const d=await FN_EVENTS_API.getEvents({limit:3,badge:'mega'});
      if(tg)renderEventsGrid('#trendingGrid',d.events);
      const d2=await FN_EVENTS_API.getEvents({limit:3,badge:'new'});
      if(ng)renderEventsGrid('#newGrid',d2.events);
    }catch(err){console.warn('Trending load failed:',err.message);}
  }
  loadDefaults();

  document.querySelectorAll('.pop-tag').forEach(t=>t.addEventListener('click',()=>{if(bigInp)bigInp.value=t.dataset.query;doSearch(t.dataset.query);bigInp?.focus();}));
  const dSearch=debounce(v=>doSearch(v),300);
  bigInp?.addEventListener('input',e=>dSearch(e.target.value));
  bigInp?.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch(e.target.value);});
  document.getElementById('searchSubmitBtn')?.addEventListener('click',()=>doSearch(bigInp?.value||''));

  async function doSearch(q){
    q=(q||'').trim();
    if(!q){if(resultsSection)resultsSection.style.display='none';if(trendingSection)trendingSection.style.display='block';return;}
    if(resultsSection)resultsSection.style.display='block';
    if(trendingSection)trendingSection.style.display='none';
    if(resultsCount)resultsCount.innerHTML='<div class="skeleton" style="height:20px;width:200px;border-radius:8px;"></div>';
    try{
      const d=await FN_EVENTS_API.getEvents({search:q,limit:24});
      if(resultsCount)resultsCount.textContent='Found '+d.total+' result'+(d.total!==1?'s':'')+' for "'+q+'"';
      renderEventsGrid('#searchResultsGrid',d.events);
    }catch(err){if(resultsCount)resultsCount.textContent='Search failed: '+err.message;}
  }
});

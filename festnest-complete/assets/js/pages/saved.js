/* FESTNEST — SAVED PAGE  |  assets/js/pages/saved.js */
'use strict';
document.addEventListener('DOMContentLoaded',async function(){
  const c=document.getElementById('savedContainer');if(!c)return;
  if(!FN_AUTH.isLoggedIn()){c.innerHTML='<div class="saved-empty"><div class="saved-empty-icon">🔒</div><div class="saved-empty-title">Log in to see saved events</div><p class="saved-empty-desc">Create a free account and bookmark events you\'re interested in.</p><button class="btn btn-primary btn-lg" onclick="openAuthModal(\'signup\')">Sign Up Free</button></div>';return;}
  c.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;">'+Array(3).fill('<div class="ev-card"><div class="skeleton" style="height:180px;"></div><div class="ev-card-body"><div class="skeleton" style="height:18px;margin-bottom:8px;"></div><div class="skeleton" style="height:14px;width:60%;"></div></div></div>').join('')+'</div>';
  try{const d=await FN_EVENTS_API.getSavedEvents();renderSaved(d.events);}
  catch(err){c.innerHTML='<div class="saved-empty"><div class="saved-empty-icon">⚠️</div><div class="saved-empty-title">Failed to load saved events</div><p class="saved-empty-desc">'+err.message+'</p><button class="btn btn-primary" onclick="location.reload()">Retry</button></div>';}
});
function renderSaved(evts){
  const c=document.getElementById('savedContainer');if(!c)return;
  if(!evts||!evts.length){c.innerHTML='<div class="saved-empty"><div class="saved-empty-icon">🔖</div><div class="saved-empty-title">Nothing saved yet</div><p class="saved-empty-desc">Browse events and tap 🤍 to save them here.</p><a class="btn btn-primary btn-lg" href="events.html">Browse Events</a></div>';return;}
  const sorted=[...evts].reverse();
  c.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;"><div style="font-size:14px;font-weight:700;color:var(--text-2);">'+sorted.length+' saved event'+(sorted.length!==1?'s':'')+'</div><button class="btn btn-ghost btn-sm" id="clearSavedBtn">Clear All</button></div><div class="events-grid">'+sorted.map(e=>buildAPIEventCard(e)).join('')+'</div>';
  document.getElementById('clearSavedBtn')?.addEventListener('click',async()=>{
    if(!confirm('Remove all saved events?'))return;
    try{const d=await FN_EVENTS_API.getSavedEvents();await Promise.all(d.events.map(e=>FN_EVENTS_API.toggleSave(e._id)));fnSetSaved([]);renderSaved([]);showToast('🗑 All cleared');}
    catch(err){showToast('Failed: '+err.message,'error');}
  });
}

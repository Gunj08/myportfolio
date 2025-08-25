const $ = (sel, parent=document) => parent.querySelector(sel);
const $$ = (sel, parent=document) => [...parent.querySelectorAll(sel)];
$('#year').textContent = new Date().getFullYear();
const toTop = $('#toTop'); toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
const io = new IntersectionObserver((entries)=>{ entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target);} });},{threshold:.2});
$$('.reveal').forEach(el => io.observe(el));

const grid = $('#grid'); const chips = $$('.chip'); const search = $('#search'); const sort = $('#sort');
let currentFilter = 'all';
function applyFilters(){
  const q = search.value.trim().toLowerCase();
  const cards = $$('.card', grid);
  cards.forEach(card => {
    const cats = (card.dataset.category || '').split(/\s+/);
    const title = (card.dataset.title || '').toLowerCase();
    const tags = (card.dataset.tags || '').toLowerCase();
    const passFilter = currentFilter === 'all' || cats.includes(currentFilter);
    const passSearch = !q || title.includes(q) || tags.includes(q);
    card.style.display = (passFilter && passSearch) ? '' : 'none';
  });
  const sorted = cards.filter(c => c.style.display !== 'none').sort((a,b)=>{
    const av = a.dataset.title.toLowerCase();
    const bv = b.dataset.title.toLowerCase();
    const ad = new Date(a.dataset.date||0).getTime();
    const bd = new Date(b.dataset.date||0).getTime();
    switch(sort.value){
      case 'oldest': return ad - bd;
      case 'az': return av.localeCompare(bv);
      case 'za': return bv.localeCompare(av);
      default: return bd - ad;
    }
  });
  sorted.forEach(el => grid.appendChild(el));
}
chips.forEach(btn=>{ btn.addEventListener('click', ()=>{ chips.forEach(c => c.classList.remove('active')); btn.classList.add('active'); currentFilter = btn.dataset.filter; applyFilters(); });});
search.addEventListener('input', applyFilters); sort.addEventListener('change', applyFilters); applyFilters();

const lightbox = $('#lightbox'); const lbImg = $('#lbImage'); const lbVid = $('#lbVideo'); const lbMuteBtn = $('#lbMute');
function openImage(src, alt=''){ lbVid.pause(); lbVid.removeAttribute('src'); lbVid.load(); lbImg.src = src; lbImg.alt = alt; lbImg.style.display = 'block'; lbVid.style.display = 'none'; lbMuteBtn.style.display = 'none'; showLB(); }
function openVideo(src){ lbImg.removeAttribute('src'); lbImg.style.display = 'none'; lbVid.src = src; lbVid.style.display = 'block'; lbMuteBtn.style.display = 'inline-block'; lbVid.play().catch(()=>{}); showLB(); }
function showLB(){ lightbox.classList.add('active'); lightbox.setAttribute('aria-hidden','false'); }
function closeLB(){ lightbox.classList.remove('active'); lightbox.setAttribute('aria-hidden','true'); lbVid.pause(); lbVid.removeAttribute('src'); lbVid.load(); }
$('.close', lightbox).addEventListener('click', closeLB);
lbMuteBtn.addEventListener('click', ()=>{ lbVid.muted = !lbVid.muted; lbMuteBtn.textContent = lbVid.muted ? 'Unmute' : 'Mute'; });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ closeLB(); closeGame(); } });

$$('.card').forEach(card=>{
  const type = card.dataset.type; const media = $('.media', card);
  if(type === 'image'){ media.addEventListener('click', ()=>{ const img = $('img', media); openImage(img.currentSrc || img.src, card.dataset.title); }); }
  else if(type === 'video'){ media.addEventListener('click', ()=>{ const src = $('source', media.querySelector('video')).src; openVideo(src); }); }
  else if(type === 'game'){ media.addEventListener('click', openGame); }
});

$('#contactForm').addEventListener('submit', (e)=>{ e.preventDefault(); const form = e.currentTarget;
  if(form.checkValidity()){ $('.form-msg').textContent = 'Thanks! We will get back to you shortly.'; form.reset(); }
  else { $('.form-msg').textContent = 'Please fill all fields correctly.'; }
});

// ===== Mini Game =====
const gamebox = $('#gamebox'); const gClose = $('.close', gamebox); const canvas = $('#game'); const ctx = canvas.getContext('2d');
const startBtn = $('#gameStart'); const scoreEl = $('#score');
let running = false, frame, player, foes, score, last;
function openGame(){ gamebox.classList.add('active'); gamebox.setAttribute('aria-hidden','false'); resetGame(); }
function closeGame(){ gamebox.classList.remove('active'); gamebox.setAttribute('aria-hidden','true'); stopGame(); }
gClose.addEventListener('click', closeGame);
function resetGame(){ player = {x:40, y:canvas.height/2, r:10, vy:0}; foes = []; score = 0; last = performance.now(); scoreEl.textContent = 'Score: 0'; }
function startGame(){ if(!running){ running = true; frame = requestAnimationFrame(loop);} }
function stopGame(){ running = false; cancelAnimationFrame(frame); }
startBtn.addEventListener('click', ()=>{ resetGame(); startGame(); startBtn.textContent = 'Restart'; });
window.addEventListener('keydown', e=>{ if(gamebox.classList.contains('active')){ if(e.key === 'ArrowUp') player.vy = -4; if(e.key === 'ArrowDown') player.vy = 4; }});
window.addEventListener('keyup', e=>{ if(e.key === 'ArrowUp' || e.key === 'ArrowDown') player.vy = 0; });
function loop(ts){ const dt = Math.min(32, ts - last); last = ts; update(dt/16); draw(); if(running) frame = requestAnimationFrame(loop); }
function update(dt){
  if(Math.random() < 0.04) foes.push({x:canvas.width+20, y:20+Math.random()*(canvas.height-40), r:8+Math.random()*14, vx:2+Math.random()*3});
  player.y += player.vy; player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
  foes.forEach(f => f.x -= f.vx); foes = foes.filter(f => f.x > -20);
  for(const f of foes){ const dx = f.x - player.x, dy = f.y - player.y; if(Math.hypot(dx,dy) < f.r + player.r){ stopGame(); startBtn.textContent='Play Again'; } }
  score += dt; scoreEl.textContent = 'Score: ' + Math.floor(score);
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.globalAlpha = .18; ctx.strokeStyle = '#8aa1b4'; ctx.beginPath();
  for(let x=0;x<canvas.width;x+=26){ ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
  for(let y=0;y<canvas.height;y+=26){ ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
  ctx.stroke(); ctx.globalAlpha = 1;
  const grad = ctx.createRadialGradient(player.x-4, player.y-4, 2, player.x, player.y, 16);
  grad.addColorStop(0,'#fff'); grad.addColorStop(1,'#e63946');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill();
  foes.forEach(f=>{ ctx.fillStyle='#2de2e6'; ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill(); });
}
// Close overlays by background click
[ $('#lightbox'), $('#gamebox') ].forEach(box=>{
  box.addEventListener('click',(e)=>{ if(e.target === box){ box.classList.remove('active'); $('#lbVideo').pause(); }});
});
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) $$('article[data-type="video"] video').forEach(v=>v.pause()); });

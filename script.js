// 🐍 بازی مار پرو - HTML/CSS/JS - بدون هیچ وابستگی خارجی
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const GRID = 20;
const CELL = canvas.width / GRID;

let snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
let dir = {x:1,y:0};
let nextDir = {x:1,y:0};
let food = {x:15,y:10,type:'normal'};
let bonus = null;
let bonusTimer = null;
let score = 0, eaten = 0, totalEaten = parseInt(localStorage.getItem('snake_total')||'0');
let best = parseInt(localStorage.getItem('snake_best')||'0');
let games = parseInt(localStorage.getItem('snake_games')||'0');
let level = 1, currentDiff = 'easy', currentSkin = 'classic';
let speedMap = {easy:160, medium:120, hard:85, insane:60};
let speed = speedMap.easy;
let running = false, paused = false, gameOver = false;
let loopId = null, particles = [], shake = 0;
let soundOn = true, fxOn = true, wallDeadly = false;
let eatenInLevel = 0;
let touchStartX=0, touchStartY=0;

const SKINS = {
  classic:{head:'#16a34a',body:['#22c55e','#4ade80','#86efac'],bg:'#0b1220',grid:'rgba(255,255,255,0.04)',food:'#ef4444',name:'کلاسیک سبز',preview:['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0']},
  neon:{head:'#a855f7',body:['#22d3ee','#a855f7','#ec4899'],bg:'#050510',grid:'rgba(34,211,238,0.08)',food:'#f472b6',name:'نئون',preview:['#22d3ee','#a855f7','#ec4899','#22d3ee','#a855f7']},
  fire:{head:'#ef4444',body:['#f97316','#facc15','#ef4444'],bg:'#1a0a00',grid:'rgba(249,115,22,0.08)',food:'#fde68a',name:'آتش 🔥',preview:['#ef4444','#f97316','#facc15','#fb923c','#fde68a']},
  ice:{head:'#2563eb',body:['#38bdf8','#a5f3fc','#e0f2fe'],bg:'#02111f',grid:'rgba(56,189,248,0.08)',food:'#f43f5e',name:'یخ ❄️',preview:['#2563eb','#38bdf8','#a5f3fc','#bae6fd','#e0f2fe']},
  rainbow:{head:'#ef4444',body:['#ef4444','#f97316','#facc15','#22c55e','#3b82f6','#a855f7'],bg:'#111827',grid:'rgba(255,255,255,0.05)',food:'#ffffff',name:'رنگین‌کمان 🌈',preview:['#ef4444','#facc15','#22c55e','#3b82f6','#a855f7']},
  galaxy:{head:'#c026d3',body:['#6366f1','#a855f7','#ec4899'],bg:'#0a0620',grid:'rgba(168,85,247,0.08)',food:'#fde047',name:'کهکشان ✨',preview:['#6366f1','#a855f7','#ec4899','#818cf8','#c084fc']},
};

const LEVELS = {
  1:{name:'چمن آرام • بدون مانع', obstacles:[]},
  2:{name:'دیوارهای پنهان • موانع گوشه', obstacles:[{x:5,y:5},{x:6,y:5},{x:14,y:5},{x:13,y:5},{x:5,y:14},{x:6,y:14},{x:14,y:14},{x:13,y:14}]},
  3:{name:'تونل وسط • مانع مرکزی', obstacles:[{x:10,y:8},{x:10,y:9},{x:10,y:10},{x:10,y:11},{x:9,y:10},{x:11,y:10}]},
  4:{name:'هزارتو • موانع زیاد', obstacles:[{x:4,y:4},{x:5,y:4},{x:6,y:4},{x:13,y:4},{x:14,y:4},{x:15,y:4},{x:4,y:15},{x:5,y:15},{x:6,y:15},{x:13,y:15},{x:14,y:15},{x:15,y:15},{x:10,y:5},{x:10,y:6},{x:10,y:13},{x:10,y:14}]},
  5:{name:'جهنم مار 🥵 • موانع + سرعت', obstacles:[{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:14,y:3},{x:15,y:3},{x:16,y:3},{x:3,y:16},{x:4,y:16},{x:5,y:16},{x:14,y:16},{x:15,y:16},{x:16,y:16},{x:10,y:7},{x:10,y:8},{x:10,y:11},{x:10,y:12},{x:7,y:10},{x:8,y:10},{x:11,y:10},{x:12,y:10}]},
};

// ---------- صدا با Web Audio API (بدون فایل خارجی) ----------
let audioCtx=null;
function tone(freq,dur=0.12,type='sine',vol=0.18,slide=0){
  if(!soundOn) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,audioCtx.currentTime);
    if(slide) o.frequency.exponentialRampToValueAtTime(slide,audioCtx.currentTime+dur);
    g.gain.setValueAtTime(vol,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+dur);
  }catch(e){}
}
const sfx = {
  eat(){ tone(520,0.1,'sine',0.2,880); setTimeout(()=>tone(880,0.1,'sine',0.15,1200),60); },
  bonus(){ tone(880,0.12,'triangle',0.22,1400); setTimeout(()=>tone(1200,0.15,'triangle',0.2,1800),90); },
  over(){ tone(300,0.25,'sawtooth',0.15,80); setTimeout(()=>tone(180,0.35,'sawtooth',0.15,50),180); },
  level(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.14,'triangle',0.18),i*90)); },
  click(){ tone(700,0.06,'sine',0.12); },
  turn(){ tone(300,0.04,'sine',0.06); },
  start(){ [392,523,659].forEach((f,i)=>setTimeout(()=>tone(f,0.12,'sine',0.18),i*80)); }
};
function showToast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),2200); }

// ---------- منطق بازی ----------
function randomFood(){
  let p;
  do{ p={x:Math.floor(Math.random()*GRID), y:Math.floor(Math.random()*GRID), type:'normal'}; }
  while(snake.some(s=>s.x===p.x&&s.y===p.y) || LEVELS[level].obstacles.some(o=>o.x===p.x&&o.y===p.y) || (bonus && bonus.x===p.x&&bonus.y===p.y));
  return p;
}
function spawnBonus(){
  bonus = {x:Math.floor(Math.random()*GRID), y:Math.floor(Math.random()*GRID)};
  const tag=document.getElementById('bonusTag'); tag.classList.remove('hidden');
  clearTimeout(bonusTimer);
  bonusTimer=setTimeout(()=>{ bonus=null; tag.classList.add('hidden'); },6000);
}
function updateUI(){
  document.getElementById('score').textContent = score.toLocaleString('fa-IR');
  document.getElementById('best').textContent = best.toLocaleString('fa-IR');
  document.getElementById('best2').textContent = best.toLocaleString('fa-IR');
  document.getElementById('eaten').textContent = eaten.toLocaleString('fa-IR');
  document.getElementById('levelNow').textContent = level.toLocaleString('fa-IR');
  document.getElementById('games').textContent = games.toLocaleString('fa-IR');
  document.getElementById('totalEaten').textContent = totalEaten.toLocaleString('fa-IR');
  document.getElementById('progressText').textContent = `${eatenInLevel} / 5`;
  document.getElementById('progressFill').style.width = (eatenInLevel/5*100)+'%';
}
function draw(){
  const skin = SKINS[currentSkin];
  ctx.fillStyle = skin.bg; ctx.fillRect(0,0,canvas.width,canvas.height);
  // شبکه
  ctx.fillStyle = skin.grid;
  for(let i=0;i<GRID;i++) for(let j=0;j<GRID;j++) if((i+j)%2===0) ctx.fillRect(i*CELL,j*CELL,CELL,CELL);
  // موانع
  ctx.fillStyle='#475569';
  LEVELS[level].obstacles.forEach(o=>{
    ctx.beginPath(); ctx.roundRect(o.x*CELL+2,o.y*CELL+2,CELL-4,CELL-4,8); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(o.x*CELL+6,o.y*CELL+6,8,4);
    ctx.fillStyle='#475569';
  });
  // ذرات
  if(fxOn) particles = particles.filter(p=>p.life>0);
  particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life--; ctx.globalAlpha=p.life/20; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); });
  ctx.globalAlpha=1;
  // غذا
  const pulse = 1 + Math.sin(Date.now()/180)*0.12;
  const fx = food.x*CELL+CELL/2, fy = food.y*CELL+CELL/2, r = CELL*0.32*pulse;
  ctx.shadowColor = skin.food; ctx.shadowBlur = 18;
  ctx.fillStyle = skin.food; ctx.beginPath(); ctx.arc(fx,fy,r,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0; ctx.fillStyle='#166534'; ctx.fillRect(fx-1,fy-r-6,2,7);
  // غذای طلایی
  if(bonus){
    const bx=bonus.x*CELL+CELL/2, by=bonus.y*CELL+CELL/2;
    ctx.shadowColor='#facc15'; ctx.shadowBlur=22; ctx.fillStyle='#facc15';
    ctx.beginPath(); ctx.arc(bx,by,CELL*0.36,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='#422006'; ctx.font='bold 16px Tahoma'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('★',bx,by+1);
  }
  // مار
  snake.forEach((s,i)=>{
    const x=s.x*CELL, y=s.y*CELL;
    let col = i===0 ? skin.head : skin.body[i % skin.body.length];
    ctx.shadowColor = col; ctx.shadowBlur = i===0?16:8;
    ctx.fillStyle=col;
    ctx.beginPath(); ctx.roundRect(x+2,y+2,CELL-4,CELL-4, i===0?12:9); ctx.fill();
    ctx.shadowBlur=0;
    if(i===0){
      ctx.fillStyle='#fff';
      const ex = dir.x, ey = dir.y;
      const eye1 = {x: x+CELL/2 + (ey!==0? -7:0) + ex*4, y: y+CELL/2 + (ex!==0? -7:0) + ey*4};
      const eye2 = {x: x+CELL/2 + (ey!==0? 7:0) + ex*4, y: y+CELL/2 + (ex!==0? 7:0) + ey*4};
      [eye1,eye2].forEach(e=>{ ctx.beginPath(); ctx.arc(e.x,e.y,4.5,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(e.x+ex*1.5,e.y+ey*1.5,2.2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; });
    }
  });
  if(shake>0){ shake--; canvas.style.transform=`translate(${Math.random()*4-2}px,${Math.random()*4-2}px)`; if(shake===0) canvas.style.transform=''; }
}
function burst(x,y,color){
  if(!fxOn) return;
  for(let i=0;i<14;i++){ particles.push({x:x*CELL+CELL/2,y:y*CELL+CELL/2,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6,life:18+Math.random()*10,size:2+Math.random()*3,color}); }
}
function step(){
  if(!running || paused || gameOver) return;
  dir = nextDir;
  let head = {x: snake[0].x+dir.x, y: snake[0].y+dir.y};
  if(wallDeadly){
    if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID){ endGame(); return; }
  } else {
    if(head.x<0) head.x=GRID-1; if(head.x>=GRID) head.x=0; if(head.y<0) head.y=GRID-1; if(head.y>=GRID) head.y=0;
  }
  if(snake.some(s=>s.x===head.x&&s.y===head.y) || LEVELS[level].obstacles.some(o=>o.x===head.x&&o.y===head.y)){ endGame(); return; }
  snake.unshift(head);
  if(bonus && head.x===bonus.x && head.y===bonus.y){
    score+=50; eaten++; totalEaten++; burst(head.x,head.y,'#facc15'); sfx.bonus(); showToast('🌟 آفرین! +50 امتیاز طلایی!');
    bonus=null; document.getElementById('bonusTag').classList.add('hidden'); clearTimeout(bonusTimer);
  } else if(head.x===food.x && head.y===food.y){
    score+=10; eaten++; eatenInLevel++; totalEaten++; burst(head.x,head.y,SKINS[currentSkin].food); sfx.eat();
    food = randomFood();
    if(eaten%5===0) spawnBonus();
    if(eatenInLevel>=5){
      if(level<5){ level++; eatenInLevel=0; sfx.level(); showToast(`🎉 مرحله ${level} — ${LEVELS[level].name}`); document.getElementById('levelHint').textContent=`مرحله ${level} - ${LEVELS[level].name}`; document.querySelectorAll('#levels .seg-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.level)===level)); }
      else { eatenInLevel=0; sfx.level(); showToast('🏆 همه مراحل رو رد کردی! سرعت بیشتر شد!'); speed=Math.max(40,speed-10); }
    }
  } else { snake.pop(); }
  if(score>best){ best=score; localStorage.setItem('snake_best',best); }
  localStorage.setItem('snake_total',totalEaten);
  updateUI(); draw();
}
function startGame(){
  snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}]; dir={x:1,y:0}; nextDir={x:1,y:0};
  score=0; eaten=0; eatenInLevel=0; food=randomFood(); bonus=null; gameOver=false; paused=false; running=true; games++; localStorage.setItem('snake_games',games);
  clearInterval(loopId); loopId=setInterval(step,speed);
  document.getElementById('overlay').classList.add('hidden'); sfx.start(); updateUI(); draw();
}
function endGame(){
  running=false; gameOver=true; clearInterval(loopId); shake=12; sfx.over();
  document.getElementById('overlayEmoji').textContent='💀';
  document.getElementById('overlayTitle').textContent='بازی تموم شد!';
  document.getElementById('overlayText').textContent=`امتیازت: ${score} | بهترین: ${best} | سیب: ${eaten} — دوباره تلاش کن، می‌تونی بهتر شی!`;
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('overlayStart').textContent='🔄 دوباره بازی کن';
}
function togglePause(){
  if(!running || gameOver) return;
  paused=!paused; document.getElementById('pauseBtn').textContent = paused?'▶️ ادامه':'⏸️ توقف';
  showToast(paused?'⏸️ بازی متوقف شد':'▶️ ادامه بازی');
}
function setDir(x,y){
  if((x===-dir.x && y===-dir.y) || (x===nextDir.x && y===nextDir.y)) return;
  // جلوگیری از برگشت ناگهانی به داخل بدن
  if(snake.length>1 && snake[1].x===snake[0].x+x && snake[1].y===snake[0].y+y) return;
  nextDir={x,y}; sfx.turn();
}
// رویدادها
document.getElementById('startBtn').onclick=()=>{sfx.click(); startGame();};
document.getElementById('overlayStart').onclick=()=>{sfx.click(); startGame();};
document.getElementById('restartBtn').onclick=()=>{sfx.click(); startGame();};
document.getElementById('pauseBtn').onclick=togglePause;
document.getElementById('soundBtn').onclick=function(){ soundOn=!soundOn; this.textContent=soundOn?'🔊':'🔇'; document.getElementById('soundToggle').checked=soundOn; };
document.getElementById('soundToggle').onchange=function(){ soundOn=this.checked; document.getElementById('soundBtn').textContent=soundOn?'🔊':'🔇'; };
document.getElementById('fxToggle').onchange=function(){ fxOn=this.checked; };
document.getElementById('wallToggle').onchange=function(){ wallDeadly=this.checked; showToast(wallDeadly?'🧱 برخورد به دیوار = باخت فعال شد':'🧱 عبور از دیوار فعال شد'); };
document.getElementById('helpBtn').onclick=()=>{ showToast('⌨️ جهت‌ها / WASD • Space توقف • در موبایل سوایپ کن'); };

document.querySelectorAll('#skins .skin-btn').forEach(btn=>{
  btn.onclick=()=>{ document.querySelectorAll('#skins .skin-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); currentSkin=btn.dataset.skin; document.getElementById('skinName').textContent=SKINS[currentSkin].name; const pv=document.querySelectorAll('#snakePreview i'); SKINS[currentSkin].preview.forEach((c,i)=>{ if(pv[i]) pv[i].style.background=c; }); sfx.click(); draw(); };
});
document.querySelectorAll('#difficulty .seg-btn').forEach(btn=>{
  btn.onclick=()=>{ document.querySelectorAll('#difficulty .seg-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); currentDiff=btn.dataset.diff; speed=speedMap[currentDiff];
    const hints={easy:'سرعت: کند • برخورد به دیوار: عبور از دیوار',medium:'سرعت: متوسط • مناسب برای همه',hard:'سرعت: سریع • برای حرفه‌ای‌ها',insane:'سرعت: دیوانه‌وار 🤯 • فقط برای افسانه‌ها!'};
    document.getElementById('diffHint').textContent=hints[currentDiff]; if(running && !gameOver){ clearInterval(loopId); loopId=setInterval(step,speed); } sfx.click(); };
});
document.querySelectorAll('#levels .seg-btn').forEach(btn=>{
  btn.onclick=()=>{ document.querySelectorAll('#levels .seg-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); level=parseInt(btn.dataset.level); eatenInLevel=0; document.getElementById('levelHint').textContent=`مرحله ${level} - ${LEVELS[level].name}`; updateUI(); sfx.click(); draw(); };
});
document.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='arrowup'||k==='w') {e.preventDefault(); setDir(0,-1);}
  else if(k==='arrowdown'||k==='s') {e.preventDefault(); setDir(0,1);}
  else if(k==='arrowleft'||k==='a') {e.preventDefault(); setDir(-1,0);}
  else if(k==='arrowright'||k==='d') {e.preventDefault(); setDir(1,0);}
  else if(k===' ') {e.preventDefault(); togglePause();}
  else if(k==='enter') { if(!running||gameOver) startGame(); }
});
document.querySelectorAll('.dpad-btn').forEach(b=>{
  b.addEventListener('touchstart',e=>{ e.preventDefault(); const d=b.dataset.dir; if(d==='up') setDir(0,-1); if(d==='down') setDir(0,1); if(d==='left') setDir(-1,0); if(d==='right') setDir(1,0); },{passive:false});
  b.addEventListener('click',()=>{ const d=b.dataset.dir; if(d==='up') setDir(0,-1); if(d==='down') setDir(0,1); if(d==='left') setDir(-1,0); if(d==='right') setDir(1,0); });
});
// سوایپ
canvas.addEventListener('touchstart',e=>{ touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY; },{passive:true});
canvas.addEventListener('touchmove',e=>{ e.preventDefault(); },{passive:false});
canvas.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-touchStartX, dy=e.changedTouches[0].clientY-touchStartY;
  if(Math.abs(dx)<24 && Math.abs(dy)<24) return;
  if(Math.abs(dx)>Math.abs(dy)) setDir(dx>0?1:-1,0); else setDir(0,dy>0?1:-1);
});
updateUI(); draw();

import {characters,pets,petById,initScene,setTeams,setEnemy,setBattleMode,attack,petThumb,heroThumb} from './scene.js';
import {STAGES,shuffle,makeSession,grade,scoreFor,stageOutcome} from './game-core.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS='ABCD';
const TEAM_COLORS=['#f2ce70','#82c9ad','#f08d85','#a9b6f5'];
const TEAM_NAMES=['第一隊','第二隊','第三隊','第四隊'];
const STORE_KEY='prompt-arena-teams-v2';

/* ---------- 本機存檔（localStorage） ---------- */
function defaultTeam(i){return{name:TEAM_NAMES[i],members:'',character:[0,3,4,1][i],score:0,pets:[],activePet:'',stars:{}}}
function defaultStore(){return{audience:'kids',teamCount:4,count:5,timer:0,teams:[0,1,2,3].map(defaultTeam)}}
function loadStore(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
    if(!raw||!Array.isArray(raw.teams))return defaultStore();
    const base=defaultStore();
    return{...base,...raw,teams:base.teams.map((t,i)=>({...t,...(raw.teams[i]||{})}))};
  }catch{return defaultStore()}
}
let store=loadStore();
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(store))}catch{}}
const activeTeams=()=>store.teams.slice(0,store.teamCount);
const petOf=t=>t.activePet&&t.pets.includes(t.activePet)?t.activePet:(t.pets.at(-1)||'egg');
const starKey=stage=>store.audience+'-'+stage;

/* ---------- 執行狀態 ---------- */
const state={bank:[],screen:'teams',stage:1,session:[],index:0,answers:{},revealed:false,displayOptions:[],
  streaks:[],correct:[],enemyHp:100,timerLeft:0,timerId:null,unlockQueue:[],sound:false};
let audio,toastTimer;

/* ---------- 聲音 ---------- */
function tone(notes,gap=.09){if(!state.sound)return;try{audio??=new AudioContext();audio.resume();notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t0=audio.currentTime+i*gap;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.06,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+.2);o.connect(g).connect(audio.destination);o.start(t0);o.stop(t0+.22)})}catch{}}
const sfx={good:()=>tone([523,659,784]),bad:()=>tone([262,220,196]),fanfare:()=>tone([523,659,784,1047,784,1047],.12)};

/* ---------- 共用 ---------- */
function petImg(id,cls='pet-img'){const p=petById(id),src=petThumb(id);return src?`<img class="${cls}" src="${src}" alt="${esc(p.name)}">`:`<span class="${cls} emoji" role="img" aria-label="${esc(p.name)}">${p.emoji}</span>`}
function syncScene(){setTeams(activeTeams().map((t,i)=>({character:t.character,color:TEAM_COLORS[i],pet:petOf(t)})))}
function toast(text){$('battleToast').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('battleToast').textContent='',1700)}
const stageOf=id=>STAGES.find(s=>s.id===Number(id));
const stageLabel=id=>{const s=stageOf(id);return s.id===7?'魔王關・'+s.enemy:`第 ${s.id} 關・${s.name}`};
function go(screen){
  if(state.screen==='play'&&screen!=='play')stopTimer();
  state.screen=screen;
  for(const s of ['teams','map','play','end'])$('screen-'+s).hidden=s!==screen;
  document.querySelectorAll('.nav-btn[data-go]').forEach(b=>b.classList.toggle('current',b.dataset.go===screen));
  const inBattle=screen==='play'||screen==='end';
  $('enemyHud').hidden=!inBattle;
  setBattleMode(inBattle?'play':'setup');
  if(screen==='teams'){renderTeams();$('location').textContent='曙光競技場'}
  if(screen==='map'){renderMap();setEnemy(state.stage);$('location').textContent=stageLabel(state.stage)}
  renderScoreboard();
}

/* ---------- 計分板（左下，永遠可見） ---------- */
function renderScoreboard(){
  const inPlay=state.screen==='play',inStage=inPlay||state.screen==='end';
  $('scoreboard').style.setProperty('--cols',store.teamCount);
  $('scoreboard').innerHTML=activeTeams().map((t,i)=>{
    const streak=inStage?state.streaks[i]||0:0;
    let status='';
    if(inPlay&&!state.revealed)status=state.answers[i]?'<span class="sb-status ready">已作答</span>':'<span class="sb-status">思考中</span>';
    if(inPlay&&state.revealed&&state.answers[i])status=grade(state.session[state.index],state.answers[i])?'<span class="sb-status hit">答對</span>':'<span class="sb-status miss">答錯</span>';
    return `<div class="sb-card" style="--team:${TEAM_COLORS[i]}">
      <div class="sb-pet">${petImg(petOf(t))}</div>
      <div class="sb-info"><b>${esc(t.name)}</b><span class="sb-score">${t.score}</span>
      <span class="sb-meta">${status||`寵物 ${t.pets.length}/${pets.length}`}${streak>=2?` <span class="sb-streak">連對 ${streak}</span>`:''}</span></div></div>`}).join('');
}

/* ---------- 隊伍設定 ---------- */
function renderTeams(){
  $('teamCountSeg').innerHTML=[1,2,3,4].map(n=>`<button data-count="${n}" aria-pressed="${n===store.teamCount}">${n} 隊</button>`).join('');
  document.querySelectorAll('#audienceSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.audience===store.audience));
  $('teamCards').style.setProperty('--cols',store.teamCount===1?1:2);
  $('teamCards').innerHTML=activeTeams().map((t,i)=>{
    const c=characters[t.character],hs=heroThumb(t.character);
    return `<article class="team-card" style="--team:${TEAM_COLORS[i]}" data-team="${i}">
      <div class="tc-hero">
        <button class="arrow" data-hero="-1" aria-label="上一個角色">‹</button>
        <div class="hero-pic">${hs?`<img src="${hs}" alt="">`:''}<small>${esc(c.name)}</small></div>
        <button class="arrow" data-hero="1" aria-label="下一個角色">›</button>
      </div>
      <div class="tc-fields">
        <label>隊名<input data-field="name" value="${esc(t.name)}" maxlength="12"></label>
        <label>組員（選填）<input data-field="members" value="${esc(t.members)}" maxlength="60" placeholder="例如：小安、阿哲、小美"></label>
        <div class="tc-pets" aria-label="寵物圖鑑，點選設為出戰夥伴">
          ${pets.map(p=>t.pets.includes(p.id)
            ?`<button class="pet-slot ${petOf(t)===p.id?'on':''}" data-pet="${p.id}" title="${esc(p.name)}（點選出戰）">${petImg(p.id)}</button>`
            :`<span class="pet-slot locked" title="${STAGES.find(s=>s.pet===p.id).id===7?'魔王關':'第 '+STAGES.find(s=>s.pet===p.id).id+' 關'}過關解鎖">?</span>`).join('')}
        </div>
        <span class="tc-score">累積 ${t.score} 分</span>
      </div></article>`}).join('');
}
$('teamCountSeg').addEventListener('click',e=>{const b=e.target.closest('[data-count]');if(!b)return;store.teamCount=Number(b.dataset.count);save();syncScene();renderTeams();renderScoreboard()});
$('audienceSeg').addEventListener('click',e=>{const b=e.target.closest('[data-audience]');if(!b)return;store.audience=b.dataset.audience;save();renderTeams()});
$('teamCards').addEventListener('input',e=>{const f=e.target.dataset.field;if(!f)return;const i=Number(e.target.closest('[data-team]').dataset.team);store.teams[i][f]=e.target.value.trim()||(f==='name'?TEAM_NAMES[i]:'');save();renderScoreboard()});
$('teamCards').addEventListener('click',e=>{
  const card=e.target.closest('[data-team]');if(!card)return;const t=store.teams[Number(card.dataset.team)];
  const h=e.target.closest('[data-hero]');if(h){t.character=(t.character+Number(h.dataset.hero)+characters.length)%characters.length;save();syncScene();renderTeams();return}
  const p=e.target.closest('[data-pet]');if(p){t.activePet=p.dataset.pet;save();syncScene();renderTeams();renderScoreboard()}
});
$('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='prompt-arena-隊伍紀錄.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
$('importInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.teams))throw 0;localStorage.setItem(STORE_KEY,JSON.stringify(data));store=loadStore();syncScene();renderTeams();renderScoreboard();toast('紀錄已匯入')}catch{alert('這個檔案不是 Prompt Arena 的隊伍紀錄。')}e.target.value=''});
$('resetBtn').addEventListener('click',()=>{if(!confirm('要清除所有隊伍的分數、星星和寵物嗎？隊名和組員會保留。'))return;store.teams.forEach(t=>{t.score=0;t.pets=[];t.activePet='';t.stars={}});save();syncScene();renderTeams();renderScoreboard()});

/* ---------- 關卡地圖 ---------- */
function renderMap(){
  $('countSelect').value=String(store.count);$('timerSelect').value=String(store.timer);
  $('stageGrid').innerHTML=STAGES.map(s=>{
    const n=state.bank.filter(q=>q.audience===store.audience&&Number(q.stage)===s.id).length;
    const anyone=activeTeams().some(t=>t.pets.includes(s.pet));
    const dots=activeTeams().map((t,i)=>{const st=t.stars[starKey(s.id)]||0;return `<span class="dot" style="--team:${TEAM_COLORS[i]}" title="${esc(t.name)}：${st} 星">${'★'.repeat(st)}${'☆'.repeat(3-st)}</span>`}).join('');
    return `<button class="stage-tile ${s.id===7?'boss':''} ${s.id===state.stage?'active':''}" data-stage="${s.id}" aria-pressed="${s.id===state.stage}">
      <span class="st-letter">${s.letter}</span>
      <span class="st-text"><small>${s.id===7?'最終關':'第 '+s.id+' 關'} · ${n} 題</small><b>${s.name}</b></span>
      <span class="st-reward ${anyone?'':'dim'}">${petImg(s.pet,'st-pet')}<small>過關得<br>${petById(s.pet).name}</small></span>
      <span class="st-dots">${dots}</span></button>`}).join('');
  const s=stageOf(state.stage);
  $('stageTip').innerHTML=`<b>${s.id===7?'魔王關':'第 '+s.id+' 關 · '+s.letter+' '+s.skill}</b>　${esc(s.tip)}<br><small>過關獎勵：${esc(petById(s.pet).name)}（答對六成就過關）</small>`;
  if(state.bank.length){$('startBtn').disabled=false;$('startBtn').textContent=s.id===7?'挑戰魔王':'開始第 '+s.id+' 關'}
}
$('stageGrid').addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(!b)return;state.stage=Number(b.dataset.stage);setEnemy(state.stage);$('location').textContent=stageLabel(state.stage);renderMap()});
$('countSelect').addEventListener('change',e=>{store.count=Number(e.target.value);save()});
$('timerSelect').addEventListener('change',e=>{store.timer=Number(e.target.value);save()});

/* ---------- 作答 ---------- */
function startStage(){
  try{state.session=makeSession(state.bank,{audience:store.audience,stage:state.stage,count:store.count})}catch(err){$('stageTip').textContent=err.message;return}
  state.index=0;state.streaks=activeTeams().map(()=>0);state.correct=activeTeams().map(()=>0);state.enemyHp=100;
  const s=stageOf(state.stage);$('enemyName').textContent=s.enemy;$('location').textContent=stageLabel(s.id);
  $('stageBadge').textContent=s.id===7?'魔王關 · 綜合挑戰':`第 ${s.id} 關 · ${s.letter} ${s.name}`;
  setEnemy(s.id);syncScene();go('play');showQuestion();
}
function showQuestion(){
  const q=state.session[state.index],solo=store.teamCount===1;
  state.answers={};state.revealed=false;state.displayOptions=shuffle(q.options);
  $('scenario').textContent=q.scenario;$('question').textContent=q.question;
  $('progress').textContent=`第 ${state.index+1} / ${state.session.length} 題`;
  $('options').innerHTML=state.displayOptions.map((o,i)=>`<button class="option" data-option="${o.id}" ${solo?'':'tabindex="-1"'}><span class="letter">${LETTERS[i]}</span><span class="opt-text">${esc(o.text)}</span></button>`).join('');
  $('options').classList.toggle('pickable',solo);
  renderAnswerPad();
  $('answerPad').hidden=solo;$('feedback').hidden=true;$('hintText').hidden=true;
  $('hintBtn').disabled=false;$('skipBtn').hidden=false;$('revealBtn').hidden=solo;$('revealBtn').disabled=true;$('nextBtn').hidden=true;
  updateEnemy();renderScoreboard();startTimer();
  $('question').focus({preventScroll:true});
}
function renderAnswerPad(){
  $('answerPad').style.setProperty('--cols',store.teamCount);
  $('answerPad').innerHTML=activeTeams().map((t,i)=>`<div class="pad-team" style="--team:${TEAM_COLORS[i]}"><b>${esc(t.name)}</b><div class="pad-btns">${LETTERS.split('').map((L,k)=>`<button data-team="${i}" data-pick="${state.displayOptions[k].id}" aria-pressed="${state.answers[i]===state.displayOptions[k].id}" aria-label="${esc(t.name)} 選 ${L}">${L}</button>`).join('')}</div></div>`).join('');
}
$('answerPad').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b||state.revealed)return;const i=Number(b.dataset.team);if(state.answers[i]===b.dataset.pick)delete state.answers[i];else state.answers[i]=b.dataset.pick;renderAnswerPad();renderScoreboard();$('revealBtn').disabled=!Object.keys(state.answers).length});
$('options').addEventListener('click',e=>{const b=e.target.closest('[data-option]');if(!b||state.revealed||store.teamCount!==1)return;state.answers={0:b.dataset.option};reveal()});

function reveal(){
  if(state.revealed||!Object.keys(state.answers).length)return;
  stopTimer();state.revealed=true;
  const q=state.session[state.index],teams=activeTeams(),winners=[],lines=[];let bonus=false;
  teams.forEach((t,i)=>{
    const pick=state.answers[i];
    if(!pick){state.streaks[i]=0;lines.push(`<span class="res none" style="--team:${TEAM_COLORS[i]}">${esc(t.name)}　未作答</span>`);return}
    const ok=grade(q,pick);state.streaks[i]=ok?state.streaks[i]+1:0;
    const pts=scoreFor(ok,state.streaks[i]);t.score+=pts;if(ok){winners.push(i);state.correct[i]++}if(pts>100)bonus=true;
    lines.push(`<span class="res ${ok?'hit':'miss'}" style="--team:${TEAM_COLORS[i]}">${esc(t.name)}　${ok?'+'+pts+(pts>100?'（連對加碼）':''):'答錯'}</span>`);
  });
  save();
  document.querySelectorAll('.option').forEach(b=>{b.disabled=true;if(b.dataset.option===q.answer)b.classList.add('correct');else if(Object.values(state.answers).includes(b.dataset.option))b.classList.add('picked')});
  const L=LETTERS[state.displayOptions.findIndex(o=>o.id===q.answer)];
  $('feedback').innerHTML=`<p class="fb-answer"><span class="fb-letter">正解 ${L}</span>${esc(q.explanation)}</p><div class="fb-results">${lines.join('')}</div>`;
  $('feedback').hidden=false;$('answerPad').hidden=true;$('hintText').hidden=true;
  $('revealBtn').hidden=true;$('skipBtn').hidden=true;$('hintBtn').disabled=true;
  $('nextBtn').hidden=false;$('nextBtn').textContent=state.index===state.session.length-1?'看關卡結算':'下一題';
  state.enemyHp=Math.max(0,state.enemyHp-Math.round(winners.length/teams.length*100/state.session.length));
  if(state.index===state.session.length-1&&state.enemyHp<8&&winners.length)state.enemyHp=0;
  updateEnemy();attack(winners);
  if(winners.length===teams.length&&teams.length>1)toast('全員命中！');
  else if(bonus)toast('連對 3 題！+50');
  else toast(winners.length?'命中！':'被反擊了，下一題扳回來');
  (winners.length?sfx.good:sfx.bad)();
  renderScoreboard();$('nextBtn').focus({preventScroll:true});
}
function next(){if(!state.revealed)return;if(state.index+1>=state.session.length){finishStage();return}state.index++;showQuestion()}
function skip(){if(state.revealed)return;stopTimer();state.revealed=true;next()}
function updateEnemy(){$('enemyHp').value=state.enemyHp;$('enemyHpText').textContent=state.enemyHp}

/* ---------- 計時 ---------- */
function startTimer(){stopTimer();const el=$('timer');if(!store.timer){el.hidden=true;return}state.timerLeft=store.timer;el.hidden=false;el.classList.remove('up','low');el.textContent=state.timerLeft+' 秒';state.timerId=setInterval(()=>{state.timerLeft--;if(state.timerLeft<=0){stopTimer();el.textContent='時間到';el.classList.add('up');tone([392,392]);return}el.textContent=state.timerLeft+' 秒';el.classList.toggle('low',state.timerLeft<=5)},1000)}
function stopTimer(){clearInterval(state.timerId);state.timerId=null}

/* ---------- 結算與寵物 ---------- */
function finishStage(){
  const s=stageOf(state.stage),total=state.session.length,need=Math.ceil(total*.6);state.unlockQueue=[];
  const rows=activeTeams().map((t,i)=>{
    const {stars,cleared}=stageOutcome(state.correct[i],total);
    const key=starKey(s.id);t.stars[key]=Math.max(t.stars[key]||0,stars);
    let reward=`<span class="end-reward muted">再答對 ${need-state.correct[i]} 題就能帶走夥伴</span>`;
    if(cleared&&!t.pets.includes(s.pet)){t.pets.push(s.pet);t.activePet=s.pet;state.unlockQueue.push({team:i,pet:s.pet,stars});reward=`<span class="end-reward new">${petImg(s.pet)}獲得${esc(petById(s.pet).name)}！</span>`}
    else if(cleared)reward=`<span class="end-reward">${petImg(s.pet)}已擁有${esc(petById(s.pet).name)}</span>`;
    return{t,i,stars,cleared,reward};
  });
  save();syncScene();
  const best=Math.max(...rows.map(r=>state.correct[r.i]));
  $('endTitle').textContent=(s.id===7?'魔王關':'第 '+s.id+' 關')+' 結算';
  $('endSummary').textContent=rows.some(r=>r.cleared)?`${s.enemy}被擊退了！答對 ${need} 題以上的隊伍帶走了${petById(s.pet).name}。`:`這次${s.enemy}比較強。答對 ${need} 題就能過關，再來一次！`;
  $('endRows').innerHTML=rows.map(r=>`<div class="end-row ${r.cleared?'cleared':''}" style="--team:${TEAM_COLORS[r.i]}">
    <b class="end-name">${esc(r.t.name)}${rows.length>1&&state.correct[r.i]===best&&best>0?'<span class="mvp">本關最佳</span>':''}</b>
    <span class="end-score">答對 ${state.correct[r.i]} / ${total}</span>
    <span class="end-stars" aria-label="${r.stars} 顆星">${'★'.repeat(r.stars)}<span>${'☆'.repeat(3-r.stars)}</span></span>
    ${r.reward}</div>`).join('');
  go('end');
  if(state.unlockQueue.length)setTimeout(showUnlock,600);
}
function showUnlock(){
  const u=state.unlockQueue.shift();if(!u){$('unlock').hidden=true;return}
  const t=store.teams[u.team],p=petById(u.pet),src=petThumb(u.pet);
  $('unlock').style.setProperty('--team',TEAM_COLORS[u.team]);
  $('unlockTeam').textContent=t.name+' 過關！';
  $('unlockImg').hidden=!src;if(src)$('unlockImg').src=src;$('unlockImg').alt=p.name;
  $('unlockEmoji').hidden=!!src;$('unlockEmoji').textContent=p.emoji;
  $('unlockName').textContent=`新夥伴：${p.name}`;$('unlockStars').textContent='★'.repeat(u.stars)+'☆'.repeat(3-u.stars);
  $('unlockBtn').textContent=state.unlockQueue.length?'收下，換下一隊':'收下夥伴';
  const c=document.querySelector('.confetti');c.innerHTML=Array.from({length:40},(_,k)=>`<i style="--x:${(Math.random()*100).toFixed(1)}%;--d:${(Math.random()*1.2+.2).toFixed(2)}s;--c:${['#f2ce70','#82c9ad','#f08d85','#a9b6f5','#ffffff'][k%5]};--r:${Math.floor(Math.random()*360)}deg"></i>`).join('');
  $('unlock').hidden=false;$('unlockBtn').focus();sfx.fanfare();
}
$('unlockBtn').addEventListener('click',showUnlock);

/* ---------- 事件 ---------- */
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{if(state.screen==='play'&&state.index>0&&!state.revealed&&!confirm('離開後這一關不會結算（已得分數會保留）。確定離開？'))return;go(b.dataset.go)}));
$('startBtn').addEventListener('click',startStage);
$('retryBtn').addEventListener('click',startStage);
$('exitBtn').addEventListener('click',()=>{if(state.index>0&&!confirm('離開後這一關不會結算（已得分數會保留）。確定回地圖？'))return;go('map')});
$('revealBtn').addEventListener('click',reveal);
$('nextBtn').addEventListener('click',next);
$('skipBtn').addEventListener('click',skip);
$('hintBtn').addEventListener('click',()=>{if(state.revealed)return;$('hintText').textContent='提示：'+state.session[state.index].hint;$('hintText').hidden=false;$('hintBtn').disabled=true});
$('guideBtn').addEventListener('click',()=>$('guide').showModal());
$('closeGuide').addEventListener('click',()=>$('guide').close());
$('guide').addEventListener('click',e=>{if(e.target===$('guide'))$('guide').close()});
$('soundBtn').addEventListener('click',()=>{state.sound=!state.sound;$('soundBtn').setAttribute('aria-pressed',state.sound);$('soundBtn').setAttribute('aria-label',state.sound?'關閉音效':'開啟音效');if(state.sound)sfx.good()});
$('fullBtn').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>{})});
document.addEventListener('keydown',e=>{
  if($('guide').open||e.target.matches('input,select,textarea'))return;
  if(!$('unlock').hidden){if(e.key==='Enter'){e.preventDefault();showUnlock()}return}
  if(state.screen!=='play')return;
  if(/^[1-4]$/.test(e.key)&&store.teamCount===1&&!state.revealed){state.answers={0:state.displayOptions[Number(e.key)-1].id};reveal()}
  if(e.key==='Enter'&&!e.target.matches('button')){e.preventDefault();state.revealed?next():reveal()}
});

/* ---------- 啟動 ---------- */
initScene();syncScene();go('teams');
fetch('/questions.json').then(r=>{if(!r.ok)throw Error('題庫讀取失敗');return r.json()}).then(bank=>{
  if(!Array.isArray(bank)||!bank.length)throw Error('題庫沒有題目');
  state.bank=bank;renderMap();
}).catch(err=>{$('startBtn').textContent='題庫尚未就緒';$('stageTip').textContent=err.message+'，請重新整理再試一次。'});

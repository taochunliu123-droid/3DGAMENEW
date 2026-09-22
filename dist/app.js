import {characters,pets,petById,initScene,setTeams,setEnemy,setBattleMode,attack,playFinale,petThumb,heroThumb} from './scene.js';
import {STAGES,shuffle,makeSession,grade,scoreFor,stageOutcome,suggestStage} from './game-core.js';
import {DICT,GUIDE} from './i18n.js';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LETTERS='ABCD';
const TEAM_COLORS=['#f2ce70','#82c9ad','#f08d85','#a9b6f5'];
const OLD_DEFAULT_NAMES=['第一隊','第二隊','第三隊','第四隊'];
const STORE_KEY='prompt-arena-teams-v2';

/* ---------- 本機存檔（localStorage） ---------- */
function defaultTeam(i){return{name:'',members:'',character:[0,3,4,1][i],score:0,pets:[],activePet:'',stars:{}}}
function defaultStore(){return{lang:'zh',audience:'kids',teamCount:4,count:5,timer:0,teams:[0,1,2,3].map(defaultTeam)}}
function loadStore(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
    if(!raw||!Array.isArray(raw.teams))return defaultStore();
    const base=defaultStore();
    const s={...base,...raw,teams:base.teams.map((t,i)=>({...t,...(raw.teams[i]||{})}))};
    s.teams.forEach((t,i)=>{if(t.name===OLD_DEFAULT_NAMES[i])t.name=''});
    if(!['zh','en','both'].includes(s.lang))s.lang='zh';
    return s;
  }catch{return defaultStore()}
}
let store=loadStore();
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(store))}catch{}}
const activeTeams=()=>store.teams.slice(0,store.teamCount);
const petOf=t=>t.activePet&&t.pets.includes(t.activePet)?t.activePet:(t.pets.at(-1)||'egg');
const starKey=stage=>store.audience+'-'+stage;
/** 已有隊伍過關（拿到該關寵物）的關卡 */
const clearedStages=()=>STAGES.filter(s=>activeTeams().some(t=>t.pets.includes(s.pet))).map(s=>s.id);

/* ---------- 語言 ----------
   雙語值一律用 {zh,en}。tx() 給純文字（按鈕提示、確認視窗），th() 給 HTML（中文在上、英文小字在下）。 */
const res=(a,en)=>a&&typeof a==='object'&&'zh' in a?(en?a.en:a.zh):a;
function halves(key,args){const v=DICT[key];const f=(x,en)=>typeof x==='function'?x(...args.map(a=>res(a,en))):x;return[f(v[0],false),f(v[1],true)]}
function tx(key,...args){const[z,e]=halves(key,args);return store.lang==='zh'?z:store.lang==='en'?e:(z===e?z:`${z} / ${e}`)}
function th(key,...args){const[z,e]=halves(key,args);return store.lang==='zh'?z:store.lang==='en'?e:(z===e?z:`${z}<span class="sub">${e}</span>`)}
/** 題目內容等 {zh,en}：先跳脫再組合 */
function bi(o){const z=esc(o.zh),e=esc(o.en??o.zh);return store.lang==='zh'?z:store.lang==='en'?e:(z===e?z:`${z}<span class="sub">${e}</span>`)}
/** 空間很小的地方用：雙語模式只顯示中文 */
function short(o){return store.lang==='en'?(o.en??o.zh):o.zh}
function ts(key,...args){const[z,e]=halves(key,args);return store.lang==='en'?e:z}
function biText(o){return store.lang==='zh'?o.zh:store.lang==='en'?(o.en??o.zh):(o.zh===o.en?o.zh:`${o.zh} ${o.en}`)}
const nm=o=>({zh:o.name,en:o.en||o.name});
const escBi=o=>({zh:esc(o.zh),en:esc(o.en)});
const teamName=i=>{const t=store.teams[i];return t.name?{zh:t.name,en:t.name}:{zh:DICT.defaultTeam[0](i),en:DICT.defaultTeam[1](i)}};
const stageOf=id=>STAGES.find(s=>s.id===Number(id));
const stageName=s=>({zh:s.name,en:s.nameEn});
const enemyName=s=>({zh:s.enemy,en:s.enemyEn});
const petName=id=>nm(petById(id));
function stageLabel(id){const s=stageOf(id);return s.id===7?ts('boss')+' · '+short(enemyName(s)):ts('location',s.id,stageName(s))}

function applyStatic(){
  document.documentElement.lang=store.lang==='en'?'en':'zh-Hant';
  document.body.dataset.lang=store.lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>el.innerHTML=th(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-short]').forEach(el=>el.textContent=ts(el.dataset.i18nShort));
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>{const t=tx(el.dataset.i18nAria);el.setAttribute('aria-label',t);el.title=t});
  document.querySelectorAll('#langSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===store.lang));
  $('countSelect').innerHTML=[5,8].map(n=>`<option value="${n}">${tx('qs',n)}</option>`).join('');
  $('timerSelect').innerHTML=`<option value="0">${tx('timerOff')}</option>`+[20,30,45].map(n=>`<option value="${n}">${tx('sec',n)}</option>`).join('');
  $('guideBody').innerHTML=store.lang==='en'?GUIDE[1]:store.lang==='zh'?GUIDE[0]:GUIDE[0]+'<hr>'+GUIDE[1];
}
$('langSeg').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(!b)return;store.lang=b.dataset.lang;save();applyStatic();refresh()});
/** 語言切換後重畫目前畫面，不影響作答狀態 */
function refresh(){
  renderScoreboard();
  if(state.screen==='teams'){renderTeams();$('location').textContent=tx('home')}
  if(state.screen==='map'){renderMap();$('location').textContent=stageLabel(state.stage)}
  if(state.screen==='play'){paintQuestion();if(state.revealed)paintFeedback()}
  if(state.screen==='end')paintEnd();
  if(state.bank.length===0)$('startBtn').textContent=tx('loading');
  if(state.screen==='play'||state.screen==='end'){const s=stageOf(state.stage);$('enemyName').textContent=short(enemyName(s));$('location').textContent=stageLabel(s.id);paintBadge()}
}

/* ---------- 執行狀態 ---------- */
const state={bank:[],screen:'teams',stage:1,session:[],index:0,answers:{},revealed:false,displayOptions:[],hintShown:false,
  streaks:[],correct:[],lastResults:[],endRows:[],enemyHp:100,timerLeft:0,timerId:null,unlockQueue:[],sound:false};
let audio,toastTimer;

/* ---------- 聲音 ---------- */
function tone(notes,gap=.09){if(!state.sound)return;try{audio??=new AudioContext();audio.resume();notes.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t0=audio.currentTime+i*gap;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.06,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+.2);o.connect(g).connect(audio.destination);o.start(t0);o.stop(t0+.22)})}catch{}}
const sfx={good:()=>tone([523,659,784]),bad:()=>tone([262,220,196]),fanfare:()=>tone([523,659,784,1047,784,1047],.12)};

/* ---------- 共用 ---------- */
function petImg(id,cls='pet-img'){const p=petById(id),src=petThumb(id),alt=esc(biText(nm(p)));return src?`<img class="${cls}" src="${src}" alt="${alt}">`:`<span class="${cls} emoji" role="img" aria-label="${alt}">${p.emoji}</span>`}
function syncScene(){setTeams(activeTeams().map((t,i)=>({character:t.character,color:TEAM_COLORS[i],pet:petOf(t)})))}
function toast(text){$('battleToast').innerHTML=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('battleToast').textContent='',1800)}
function go(screen){
  if(state.screen==='play'&&screen!=='play')stopTimer();
  state.screen=screen;
  for(const s of ['teams','map','play','end'])$('screen-'+s).hidden=s!==screen;
  document.querySelectorAll('.nav-btn[data-go]').forEach(b=>b.classList.toggle('current',b.dataset.go===screen));
  const inBattle=screen==='play'||screen==='end';
  $('enemyHud').hidden=!inBattle;
  setBattleMode(inBattle?'play':'setup');
  if(screen==='teams'){renderTeams();$('location').textContent=tx('home')}
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
    if(inPlay&&!state.revealed)status=state.answers[i]?`<span class="sb-status ready">${ts('ready')}</span>`:`<span class="sb-status">${ts('thinking')}</span>`;
    if(inPlay&&state.revealed&&state.answers[i])status=grade(state.session[state.index],state.answers[i])?`<span class="sb-status hit">${ts('correct')}</span>`:`<span class="sb-status miss">${ts('wrong')}</span>`;
    return `<div class="sb-card" style="--team:${TEAM_COLORS[i]}">
      <div class="sb-pet">${petImg(petOf(t))}</div>
      <div class="sb-info"><b>${esc(short(teamName(i)))}</b><span class="sb-score">${t.score}</span>
      <span class="sb-meta">${status||`${ts('pets')} ${t.pets.length}/${pets.length}`}${streak>=2?` <span class="sb-streak" title="${esc(tx('streak'))} ${streak}">🔥${streak}</span>`:''}</span></div></div>`}).join('');
}

/* ---------- 隊伍設定 ---------- */
function renderTeams(){
  $('teamCountSeg').innerHTML=[1,2,3,4].map(n=>`<button data-count="${n}" aria-pressed="${n===store.teamCount}">${ts('teamCount',n)}</button>`).join('');
  document.querySelectorAll('#audienceSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.audience===store.audience));
  $('teamCards').style.setProperty('--cols',store.teamCount===1?1:2);
  $('teamCards').innerHTML=activeTeams().map((t,i)=>{
    const c=characters[t.character],hs=heroThumb(t.character);
    return `<article class="team-card" style="--team:${TEAM_COLORS[i]}" data-team="${i}">
      <div class="tc-hero">
        <button class="arrow" data-hero="-1" aria-label="${esc(tx('prevHero'))}">‹</button>
        <div class="hero-pic">${hs?`<img src="${hs}" alt="">`:''}<small>${esc(short(nm(c)))}</small></div>
        <button class="arrow" data-hero="1" aria-label="${esc(tx('nextHero'))}">›</button>
      </div>
      <div class="tc-fields">
        <label><span>${ts('teamName')}</span><input data-field="name" value="${esc(t.name)}" placeholder="${esc(short(teamName(i)))}" maxlength="16"></label>
        <label><span>${ts('members')}</span><input data-field="members" value="${esc(t.members)}" maxlength="60" placeholder="${esc(ts('membersPh'))}"></label>
        <div class="tc-pets">
          ${pets.map(p=>t.pets.includes(p.id)
            ?`<button class="pet-slot ${petOf(t)===p.id?'on':''}" data-pet="${p.id}" title="${esc(tx('petPick',nm(p)))}">${petImg(p.id)}</button>`
            :`<span class="pet-slot locked" title="${esc(tx('unlockAt',STAGES.find(s=>s.pet===p.id).id))}">?</span>`).join('')}
        </div>
        <span class="tc-score">${ts('total',t.score)}</span>
      </div></article>`}).join('');
}
$('teamCountSeg').addEventListener('click',e=>{const b=e.target.closest('[data-count]');if(!b)return;store.teamCount=Number(b.dataset.count);save();syncScene();renderTeams();renderScoreboard()});
$('audienceSeg').addEventListener('click',e=>{const b=e.target.closest('[data-audience]');if(!b)return;store.audience=b.dataset.audience;save();renderTeams()});
$('teamCards').addEventListener('input',e=>{const f=e.target.dataset.field;if(!f)return;const i=Number(e.target.closest('[data-team]').dataset.team);store.teams[i][f]=e.target.value.trim();save();renderScoreboard()});
$('teamCards').addEventListener('click',e=>{
  const card=e.target.closest('[data-team]');if(!card)return;const t=store.teams[Number(card.dataset.team)];
  const h=e.target.closest('[data-hero]');if(h){t.character=(t.character+Number(h.dataset.hero)+characters.length)%characters.length;save();syncScene();renderTeams();return}
  const p=e.target.closest('[data-pet]');if(p){t.activePet=p.dataset.pet;save();syncScene();renderTeams();renderScoreboard()}
});
$('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='prompt-arena-teams.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
$('importInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.teams))throw 0;localStorage.setItem(STORE_KEY,JSON.stringify(data));store=loadStore();applyStatic();syncScene();renderTeams();renderScoreboard();toast(th('imported'))}catch{alert(tx('badFile'))}e.target.value=''});
$('resetBtn').addEventListener('click',()=>{if(!confirm(tx('resetConfirm')))return;store.teams.forEach(t=>{t.score=0;t.pets=[];t.activePet='';t.stars={}});save();syncScene();renderTeams();renderScoreboard()});

/* ---------- 關卡地圖 ---------- */
function renderMap(){
  $('countSelect').value=String(store.count);$('timerSelect').value=String(store.timer);
  $('stageGrid').innerHTML=STAGES.map(s=>{
    const n=state.bank.filter(q=>q.audience===store.audience&&Number(q.stage)===s.id).length;
    const anyone=activeTeams().some(t=>t.pets.includes(s.pet));
    const dots=activeTeams().map((t,i)=>{const st=t.stars[starKey(s.id)]||0;return `<span class="dot" style="--team:${TEAM_COLORS[i]}" title="${esc(tx('stars',teamName(i),st))}">${'★'.repeat(st)}${'☆'.repeat(3-st)}</span>`}).join('');
    return `<button class="stage-tile ${s.id===7?'boss':''} ${s.id===state.stage?'active':''}" data-stage="${s.id}" aria-pressed="${s.id===state.stage}">
      <span class="st-letter">${s.letter}</span>
      <span class="st-text"><small>${ts('stageN',s.id)} · ${ts('qs',n)}</small><b>${bi(stageName(s))}</b></span>
      <span class="st-reward ${anyone?'':'dim'}">${petImg(s.pet,'st-pet')}<small>${ts('reward',escBi(petName(s.pet)))}</small></span>
      <span class="st-dots">${dots}</span></button>`}).join('');
  const s=stageOf(state.stage);
  const head=s.id===7?ts('boss'):`${ts('stageN',s.id)} · ${s.letter} ${s.skill}`;
  $('stageTip').innerHTML=`<b>${esc(head)}</b>　${bi({zh:s.tip,en:s.tipEn})}<br><small>${ts('tipReward',escBi(petName(s.pet)))}</small>`;
  if(state.bank.length){$('startBtn').disabled=false;$('startBtn').innerHTML=th('start',s.id)}
}
$('stageGrid').addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(!b)return;state.stage=Number(b.dataset.stage);setEnemy(state.stage);$('location').textContent=stageLabel(state.stage);renderMap()});
$('countSelect').addEventListener('change',e=>{store.count=Number(e.target.value);save()});
$('timerSelect').addEventListener('change',e=>{store.timer=Number(e.target.value);save()});

/* ---------- 作答 ---------- */
function paintBadge(){const s=stageOf(state.stage);$('stageBadge').innerHTML=s.id===7?th('bossBadge'):th('stageBadge',s.id,s.letter,escBi(stageName(s)))}
function startStage(){
  try{state.session=makeSession(state.bank,{audience:store.audience,stage:state.stage,count:store.count})}catch{$('stageTip').innerHTML=th('noQuestions');return}
  state.index=0;state.asked=0;state.finishing=false;state.streaks=activeTeams().map(()=>0);state.correct=activeTeams().map(()=>0);state.enemyHp=100;
  const s=stageOf(state.stage);$('enemyName').textContent=short(enemyName(s));$('location').textContent=stageLabel(s.id);paintBadge();
  setEnemy(s.id);syncScene();go('play');showQuestion();
}
function showQuestion(){
  const solo=store.teamCount===1;
  state.answers={};state.revealed=false;state.hintShown=false;state.displayOptions=shuffle(state.session[state.index].options);
  paintQuestion();
  $('answerPad').hidden=solo;$('feedback').hidden=true;
  $('hintBtn').disabled=false;$('skipBtn').hidden=false;$('revealBtn').hidden=solo;$('revealBtn').disabled=true;$('nextBtn').hidden=true;
  updateEnemy();renderScoreboard();startTimer();
  $('question').focus({preventScroll:true});
}
/** 題目、選項、作答板：語言切換時也會呼叫 */
function paintQuestion(){
  const q=state.session[state.index],solo=store.teamCount===1;
  $('scenario').innerHTML=bi(q.scenario);$('question').innerHTML=bi(q.question);
  $('progress').textContent=tx('progress',state.index+1,state.session.length);
  $('options').innerHTML=state.displayOptions.map((o,i)=>{
    let cls='option';if(state.revealed){if(o.id===q.answer)cls+=' correct';else if(Object.values(state.answers).includes(o.id))cls+=' picked'}
    return `<button class="${cls}" data-option="${o.id}" ${solo?'':'tabindex="-1"'} ${state.revealed?'disabled':''}><span class="letter">${LETTERS[i]}</span><span class="opt-text">${bi(o.text)}</span></button>`}).join('');
  $('options').classList.toggle('pickable',solo);
  $('hintText').hidden=!state.hintShown||state.revealed;
  if(state.hintShown)$('hintText').innerHTML=th('hintLine',escBi(q.hint));
  renderAnswerPad();
  $('nextBtn').innerHTML=state.index===state.session.length-1?th('results'):th('next');
}
function renderAnswerPad(){
  $('answerPad').style.setProperty('--cols',store.teamCount);
  $('answerPad').innerHTML=activeTeams().map((t,i)=>`<div class="pad-team" style="--team:${TEAM_COLORS[i]}"><b>${esc(biText(teamName(i)))}</b><div class="pad-btns">${LETTERS.split('').map((L,k)=>`<button data-team="${i}" data-pick="${state.displayOptions[k].id}" aria-pressed="${state.answers[i]===state.displayOptions[k].id}" aria-label="${esc(tx('picks',teamName(i),L))}">${L}</button>`).join('')}</div></div>`).join('');
}
$('answerPad').addEventListener('click',e=>{const b=e.target.closest('[data-pick]');if(!b||state.revealed)return;const i=Number(b.dataset.team);if(state.answers[i]===b.dataset.pick)delete state.answers[i];else state.answers[i]=b.dataset.pick;renderAnswerPad();renderScoreboard();$('revealBtn').disabled=!Object.keys(state.answers).length});
$('options').addEventListener('click',e=>{const b=e.target.closest('[data-option]');if(!b||state.revealed||store.teamCount!==1)return;state.answers={0:b.dataset.option};reveal()});

function reveal(){
  if(state.revealed||!Object.keys(state.answers).length)return;
  stopTimer();state.revealed=true;state.asked++;
  const q=state.session[state.index],teams=activeTeams(),winners=[];let bonus=false;
  state.lastResults=teams.map((t,i)=>{
    const pick=state.answers[i];
    if(!pick){state.streaks[i]=0;return{i,kind:'none',pts:0}}
    const ok=grade(q,pick);state.streaks[i]=ok?state.streaks[i]+1:0;
    const pts=scoreFor(ok,state.streaks[i]);t.score+=pts;if(ok){winners.push(i);state.correct[i]++}if(pts>100)bonus=true;
    return{i,kind:ok?'hit':'miss',pts};
  });
  save();
  paintQuestion();paintFeedback();
  $('feedback').hidden=false;$('answerPad').hidden=true;
  $('revealBtn').hidden=true;$('skipBtn').hidden=true;$('hintBtn').disabled=true;$('nextBtn').hidden=false;
  state.enemyHp=Math.max(0,state.enemyHp-Math.round(winners.length/teams.length*100/state.session.length));
  if(state.index===state.session.length-1&&state.enemyHp<8&&winners.length)state.enemyHp=0;
  updateEnemy();attack(winners);
  if(winners.length===teams.length&&teams.length>1)toast(th('allHit'));
  else if(bonus)toast(th('streak3'));
  else toast(winners.length?th('hit'):th('counter'));
  (winners.length?sfx.good:sfx.bad)();
  renderScoreboard();$('nextBtn').focus({preventScroll:true});
}
function paintFeedback(){
  const q=state.session[state.index];
  const L=LETTERS[state.displayOptions.findIndex(o=>o.id===q.answer)];
  const chips=state.lastResults.map(r=>{const n=esc(short(teamName(r.i)));
    const txt=r.kind==='none'?ts('noAnswer'):r.kind==='miss'?ts('wrong'):'+'+r.pts+(r.pts>100?ts('streakBonus'):'');
    return `<span class="res ${r.kind}" style="--team:${TEAM_COLORS[r.i]}">${n}　${esc(txt)}</span>`}).join('');
  $('feedback').innerHTML=`<p class="fb-answer"><span class="fb-letter">${esc(tx('answer',L))}</span>${bi(q.explanation)}</p><div class="fb-results">${chips}</div>`;
}
function next(){if(!state.revealed||state.finishing)return;if(state.index+1>=state.session.length){finishStage();return}state.index++;showQuestion()}
function skip(){if(state.revealed)return;stopTimer();state.revealed=true;next()}
function updateEnemy(){$('enemyHp').value=state.enemyHp;$('enemyHpText').textContent=state.enemyHp}

/* ---------- 計時 ---------- */
function paintTimer(){const el=$('timer');el.textContent=state.timerLeft>0?tx('sec',state.timerLeft):tx('timeUp')}
function startTimer(){stopTimer();const el=$('timer');if(!store.timer){el.hidden=true;return}state.timerLeft=store.timer;el.hidden=false;el.classList.remove('up','low');paintTimer();state.timerId=setInterval(()=>{state.timerLeft--;paintTimer();if(state.timerLeft<=0){stopTimer();el.classList.add('up');tone([392,392]);return}el.classList.toggle('low',state.timerLeft<=5)},1000)}
function stopTimer(){clearInterval(state.timerId);state.timerId=null}

/* ---------- 結算與寵物 ---------- */
function finishStage(){
  const s=stageOf(state.stage),total=state.asked;state.unlockQueue=[];state.finishing=true;stopTimer();
  state.endRows=activeTeams().map((t,i)=>{
    const {stars,cleared,wrong}=stageOutcome(state.correct[i],total);
    const key=starKey(s.id);t.stars[key]=Math.max(t.stars[key]||0,stars);
    let reward='miss';
    if(cleared&&!t.pets.includes(s.pet)){t.pets.push(s.pet);t.activePet=s.pet;state.unlockQueue.push({team:i,pet:s.pet,stars});reward='new'}
    else if(cleared)reward='owned';
    return{i,stars,cleared,wrong,reward,correct:state.correct[i],total};
  });
  save();
  const win=state.endRows.some(r=>r.cleared);
  state.endWin=win;
  if(win){state.enemyHp=0;updateEnemy()}
  $('nextBtn').disabled=true;
  const played=playFinale(win);
  showBanner(win);
  (win?sfx.fanfare:sfx.bad)();
  const wait=played&&!matchMedia('(prefers-reduced-motion: reduce)').matches?2900:1200;
  setTimeout(()=>{
    $('finaleBanner').hidden=true;$('nextBtn').disabled=false;state.finishing=false;
    syncPetsSoon=true;go('end');paintEnd();
    if(state.unlockQueue.length)setTimeout(showUnlock,350);
  },wait);
}
let syncPetsSoon=false;
function showBanner(win){
  const s=stageOf(state.stage),e=escBi(enemyName(s)),b=$('finaleBanner');
  b.className='finale-banner '+(win?'win':'lose');
  b.innerHTML=`<div class="fb-rays"></div><strong>${th(win?'victory':'lost')}</strong><span>${th(win?'defeated':'enemyWins',e)}</span>`;
  b.hidden=false;
}
function paintEnd(){
  const s=stageOf(state.stage),rows=state.endRows;if(!rows.length)return;
  if(syncPetsSoon){syncPetsSoon=false;syncScene()}
  $('retryBtn').className=state.endWin?'quiet':'primary';const nb=$('nextStageBtn');nb.hidden=!(state.endWin&&s.id<7);if(!nb.hidden)nb.innerHTML=th('nextStage',s.id+1);
  const total=rows[0].total,best=Math.max(...rows.map(r=>r.correct)),pet=escBi(petName(s.pet)),enemy=escBi(enemyName(s));
  $('endTitle').innerHTML=th('endTitle',s.id);
  $('endSummary').innerHTML=rows.some(r=>r.cleared)?th('endWin',enemy,pet):th('endLose',enemy);
  $('endRows').innerHTML=rows.map(r=>{
    const reward=r.reward==='new'?`<span class="end-reward new">${petImg(s.pet)}<span>${th('won',pet)}</span></span>`
      :r.reward==='owned'?`<span class="end-reward">${petImg(s.pet)}<span>${th('owned',pet)}</span></span>`
      :`<span class="end-reward muted">${th('moreToWin',r.wrong)}</span>`;
    return `<div class="end-row ${r.cleared?'cleared':''}" style="--team:${TEAM_COLORS[r.i]}">
    <b class="end-name">${esc(biText(teamName(r.i)))}${rows.length>1&&r.correct===best&&best>0?`<span class="mvp">${tx('mvp')}</span>`:''}</b>
    <span class="end-score">${tx('scoreLine',r.correct,total)}</span>
    <span class="end-stars" aria-label="${r.stars}/3">${'★'.repeat(r.stars)}<span>${'☆'.repeat(3-r.stars)}</span></span>
    ${reward}</div>`}).join('');
}
function showUnlock(){
  const u=state.unlockQueue.shift();if(!u){$('unlock').hidden=true;return}
  const p=petById(u.pet),src=petThumb(u.pet);
  $('unlock').style.setProperty('--team',TEAM_COLORS[u.team]);
  $('unlockTeam').innerHTML=th('cleared',escBi(teamName(u.team)));
  $('unlockImg').hidden=!src;if(src)$('unlockImg').src=src;$('unlockImg').alt=biText(nm(p));
  $('unlockEmoji').hidden=!!src;$('unlockEmoji').textContent=p.emoji;
  $('unlockName').innerHTML=th('buddyName',escBi(nm(p)));$('unlockStars').textContent='★'.repeat(u.stars)+'☆'.repeat(3-u.stars);
  $('unlockBtn').innerHTML=state.unlockQueue.length?th('takeNext'):th('take');
  const c=document.querySelector('.confetti');c.innerHTML=Array.from({length:40},(_,k)=>`<i style="--x:${(Math.random()*100).toFixed(1)}%;--d:${(Math.random()*1.2+.2).toFixed(2)}s;--c:${['#f2ce70','#82c9ad','#f08d85','#a9b6f5','#ffffff'][k%5]};--r:${Math.floor(Math.random()*360)}deg"></i>`).join('');
  $('unlock').hidden=false;$('unlockBtn').focus();sfx.fanfare();
}
$('unlockBtn').addEventListener('click',showUnlock);

/* ---------- 事件 ---------- */
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{if(state.screen==='play'&&state.index>0&&!state.revealed&&!confirm(tx('leaveConfirm')))return;go(b.dataset.go)}));
$('startBtn').addEventListener('click',startStage);
$('retryBtn').addEventListener('click',startStage);
$('nextStageBtn').addEventListener('click',()=>{state.stage=Math.min(7,state.stage+1);startStage()});
document.querySelector('#screen-end [data-go="map"]').addEventListener('click',()=>{if(state.endWin&&state.stage<7){state.stage++;setEnemy(state.stage);renderMap();$('location').textContent=stageLabel(state.stage)}},{capture:true});
$('exitBtn').addEventListener('click',()=>{if(state.index>0&&!confirm(tx('leaveConfirm')))return;go('map')});
$('revealBtn').addEventListener('click',reveal);
$('nextBtn').addEventListener('click',next);
$('skipBtn').addEventListener('click',skip);
$('hintBtn').addEventListener('click',()=>{if(state.revealed)return;state.hintShown=true;$('hintText').innerHTML=th('hintLine',escBi(state.session[state.index].hint));$('hintText').hidden=false;$('hintBtn').disabled=true});
$('guideBtn').addEventListener('click',()=>$('guide').showModal());
$('closeGuide').addEventListener('click',()=>$('guide').close());
$('guide').addEventListener('click',e=>{if(e.target===$('guide'))$('guide').close()});
$('soundBtn').addEventListener('click',()=>{state.sound=!state.sound;$('soundBtn').setAttribute('aria-pressed',state.sound);if(state.sound)sfx.good()});
$('fullBtn').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>{})});
document.addEventListener('keydown',e=>{
  if($('guide').open||e.target.matches('input,select,textarea'))return;
  if(!$('unlock').hidden){if(e.key==='Enter'){e.preventDefault();showUnlock()}return}
  if(state.screen!=='play')return;
  if(/^[1-4]$/.test(e.key)&&store.teamCount===1&&!state.revealed){state.answers={0:state.displayOptions[Number(e.key)-1].id};reveal()}
  if(e.key==='Enter'&&!e.target.matches('button')){e.preventDefault();state.revealed?next():reveal()}
});

/* ---------- 自動縮放：確保一個畫面放得下，不用捲動 ---------- */
let fitQueued=false;
function fitPanel(){
  if(fitQueued)return;fitQueued=true;
  requestAnimationFrame(()=>{fitQueued=false;
    const panel=document.querySelector('.panel'),scr=$('screen-'+state.screen);if(!scr)return;
    if(matchMedia('(max-width:900px)').matches){scr.style.zoom='';return}
    let z=1;scr.style.zoom='1';
    for(let k=0;k<12;k++){
      const over=panel.scrollHeight-panel.clientHeight,overW=panel.scrollWidth-panel.clientWidth;
      if(over<=1&&overW<=1)break;
      z=Math.max(.72,Math.min(z-.02,z*Math.min(panel.clientHeight/panel.scrollHeight,panel.clientWidth/panel.scrollWidth)));
      scr.style.zoom=String(z.toFixed(3));if(z<=.72)break;
    }
  });
}
new ResizeObserver(fitPanel).observe(document.querySelector('.panel'));
new MutationObserver(fitPanel).observe(document.querySelector('.panel'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});

/* ---------- 啟動 ---------- */
state.stage=suggestStage(clearedStages());
applyStatic();initScene();syncScene();go('teams');$('startBtn').textContent=tx('loading');
fetch('/questions.json').then(r=>{if(!r.ok)throw 0;return r.json()}).then(bank=>{
  if(!Array.isArray(bank)||!bank.length)throw 0;
  state.bank=bank;renderMap();
}).catch(()=>{$('startBtn').textContent=tx('notReady');$('stageTip').innerHTML=th('loadFail')});

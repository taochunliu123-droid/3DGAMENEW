// 純邏輯（無 DOM），供 app.js 與測試共用
export const STAGES=[
  {id:1,letter:'A',skill:'Act',name:'演誰',tip:'先指定 AI 扮演誰：資深客服、面試官、導覽員……',pet:'dog',enemy:'迷霧小妖',nameEn:'Cast the Role',tipEn:"Tell AI who to play: a support lead, an interviewer, a guide…",enemyEn:'Fog Imp'},
  {id:2,letter:'C',skill:'Content',name:'給足背景',tip:'提供背景、資料與情境：發生什麼事、手上有哪些資料。',pet:'cat',enemy:'空白幽靈',nameEn:'Give Context',tipEn:"Give background, data and the situation: what happened and what you have.",enemyEn:'Blank Ghost'},
  {id:3,letter:'T',skill:'Style',name:'指定風格',tip:'指定語氣、風格與呈現格式：條列、表格、口語……',pet:'rabbit',enemy:'雜亂石像',nameEn:'Set the Style',tipEn:"Name the tone and format: bullets, a table, simple words…",enemyEn:'Messy Golem'},
  {id:4,letter:'O',skill:'Goal',name:'講明目標',tip:'說明目的，以及怎樣才算做好。',pet:'fox',enemy:'迷路巨人',nameEn:'State the Goal',tipEn:"Say what you want to achieve and what 'done well' looks like.",enemyEn:'Lost Giant'},
  {id:5,letter:'R',skill:'Refer',name:'參考與限制',tip:'提供參考、例子、限制與比較基準。',pet:'bird',enemy:'亂編精靈',nameEn:'Refer & Limit',tipEn:"Give references, examples, limits and a benchmark.",enemyEn:'Fib Sprite'},
  {id:6,letter:'S',skill:'Steps',name:'分好步驟',tip:'安排步驟、流程與檢查點。',pet:'dragon',enemy:'混亂法師',nameEn:'Plan the Steps',tipEn:"Plan the steps, the flow and the checkpoints.",enemyEn:'Chaos Mage'},
  {id:7,letter:'★',skill:'Boss',name:'魔王關',tip:'綜合 ACTORS：分辨每一句屬於哪個字母、找出缺的那一塊。',pet:'golden',enemy:'矛盾大魔王',nameEn:'Boss Stage',tipEn:"Mix all of ACTORS: label each line and find the missing piece.",enemyEn:'Paradox Overlord'}
];
export const POINTS={correct:100,streakBonus:50,streakEvery:3};

export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

export function makeSession(bank,{audience,stage,count=5,random=Math.random}){
  const pool=bank.filter(q=>q.audience===audience&&Number(q.stage)===Number(stage));
  if(!pool.length)throw Error('NO_QUESTIONS');
  return shuffle(pool,random).slice(0,count);
}

export function grade(question,optionId){return optionId===question.answer}

/** 一題的得分：答對 100，第 3、6、9… 連對再加 50 */
export function scoreFor(correct,streakAfter){
  if(!correct)return 0;
  return POINTS.correct+(streakAfter>0&&streakAfter%POINTS.streakEvery===0?POINTS.streakBonus:0);
}

/** 過關規則：最多錯幾題還能帶走寵物 */
export const MAX_WRONG=1;
/** 關卡結算：全對 3 星、錯 1 題 2 星（過關）、錯 2 題 1 星（不過關、拿不到寵物）。跳過的題目不算。 */
export function stageOutcome(correct,total){
  if(!total)return{stars:0,cleared:false,wrong:0};
  const wrong=total-correct;const stars=wrong<=0?3:wrong===1?2:wrong===2?1:0;
  return{stars,cleared:wrong<=MAX_WRONG,wrong};
}

/** 建議下一關：已過關的最高關卡的下一關（最多到魔王關） */
export function suggestStage(clearedStages){const top=Math.max(0,...clearedStages);return Math.min(7,top+1)}

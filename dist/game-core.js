// 純邏輯（無 DOM），供 app.js 與測試共用
export const STAGES=[
  {id:1,letter:'A',skill:'Action',name:'說清楚任務',tip:'先說要 AI 做什麼：寫、整理、翻譯、列出……',pet:'dog',enemy:'迷霧小妖',nameEn:'Clear Task',tipEn:"Say what AI should do: write, sort, translate, list…",enemyEn:'Fog Imp'},
  {id:2,letter:'C',skill:'Content',name:'給足背景',tip:'告訴 AI 你是誰、發生什麼事、有什麼條件。',pet:'cat',enemy:'空白幽靈',nameEn:'Give Context',tipEn:"Tell AI who you are, what happened, and any conditions.",enemyEn:'Blank Ghost'},
  {id:3,letter:'T',skill:'Style',name:'指定風格',tip:'說出語氣和格式：條列、表格、簡單的話……',pet:'rabbit',enemy:'雜亂石像',nameEn:'Set the Style',tipEn:"Name the tone and format: bullets, a table, simple words…",enemyEn:'Messy Golem'},
  {id:4,letter:'O',skill:'Goal',name:'講明目標',tip:'說出想達成什麼、怎樣才算做好。',pet:'fox',enemy:'迷路巨人',nameEn:'State the Goal',tipEn:"Say what you want to achieve and what 'done well' looks like.",enemyEn:'Lost Giant'},
  {id:5,letter:'R',skill:'Refer',name:'參考與限制',tip:'給例子、限定資料來源、說出不能做的事。',pet:'bird',enemy:'亂編精靈',nameEn:'Refer & Limit',tipEn:"Give examples, limit the sources, and say what not to do.",enemyEn:'Fib Sprite'},
  {id:6,letter:'S',skill:'Steps',name:'分好步驟',tip:'請 AI 照順序一步一步來，最後自己檢查。',pet:'dragon',enemy:'混亂法師',nameEn:'Plan the Steps',tipEn:"Ask AI to go step by step, then check its own work.",enemyEn:'Chaos Mage'},
  {id:7,letter:'★',skill:'Boss',name:'魔王關',tip:'綜合運用，並學會查證、修正 AI 的回答。',pet:'golden',enemy:'矛盾大魔王',nameEn:'Boss Stage',tipEn:"Combine everything, and learn to verify and fix AI answers.",enemyEn:'Paradox Overlord'}
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

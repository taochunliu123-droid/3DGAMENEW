// 純邏輯（無 DOM），供 app.js 與測試共用
export const STAGES=[
  {id:1,letter:'A',skill:'Action',name:'說清楚任務',tip:'先說要 AI 做什麼：寫、整理、翻譯、列出……',pet:'dog',enemy:'迷霧小妖'},
  {id:2,letter:'C',skill:'Content',name:'給足背景',tip:'告訴 AI 你是誰、發生什麼事、有什麼條件。',pet:'cat',enemy:'空白幽靈'},
  {id:3,letter:'T',skill:'Style',name:'指定風格',tip:'說出語氣和格式：條列、表格、簡單的話……',pet:'rabbit',enemy:'雜亂石像'},
  {id:4,letter:'O',skill:'Goal',name:'講明目標',tip:'說出想達成什麼、怎樣才算做好。',pet:'fox',enemy:'迷路巨人'},
  {id:5,letter:'R',skill:'Refer',name:'參考與限制',tip:'給例子、限定資料來源、說出不能做的事。',pet:'bird',enemy:'亂編精靈'},
  {id:6,letter:'S',skill:'Steps',name:'分好步驟',tip:'請 AI 照順序一步一步來，最後自己檢查。',pet:'dragon',enemy:'混亂法師'},
  {id:7,letter:'★',skill:'Boss',name:'魔王關',tip:'綜合運用，並學會查證、修正 AI 的回答。',pet:'golden',enemy:'矛盾大魔王'}
];
export const POINTS={correct:100,streakBonus:50,streakEvery:3};

export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

export function makeSession(bank,{audience,stage,count=5,random=Math.random}){
  const pool=bank.filter(q=>q.audience===audience&&Number(q.stage)===Number(stage));
  if(!pool.length)throw Error('這一關還沒有題目。');
  return shuffle(pool,random).slice(0,count);
}

export function grade(question,optionId){return optionId===question.answer}

/** 一題的得分：答對 100，第 3、6、9… 連對再加 50 */
export function scoreFor(correct,streakAfter){
  if(!correct)return 0;
  return POINTS.correct+(streakAfter>0&&streakAfter%POINTS.streakEvery===0?POINTS.streakBonus:0);
}

/** 關卡結算：答對 60% 以上過關，80% 兩星，全對三星 */
export function stageOutcome(correct,total){
  if(!total)return{stars:0,cleared:false};
  const r=correct/total;const stars=r>=1?3:r>=.8?2:r>=.6?1:0;
  return{stars,cleared:stars>0};
}

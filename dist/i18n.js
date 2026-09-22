// 介面文字（中文 / English）。值可以是字串或函式。
export const DICT={
  brandSub:['PM Mayors · ACTORS 小隊闖關','PM Mayors · ACTORS Team Quest'],
  navTeams:['隊伍設定','Teams'],navMap:['關卡地圖','Stage Map'],navGuide:['玩法說明','How to Play'],
  fullscreen:['全螢幕','Full screen'],sound:['音效','Sound'],close:['關閉','Close'],arena:['3D 戰鬥場景','3D battle scene'],
  webgl:['你的瀏覽器暫時無法開啟 3D。請開啟硬體加速，或換用支援 WebGL 2 的瀏覽器後重新整理。題目與計分不受影響。','3D can’t start in this browser. Turn on hardware acceleration or use a WebGL 2 browser, then reload. Questions and scoring still work.'],
  home:['曙光競技場','Dawn Arena'],
  teamsTitle:['隊伍設定','Team Setup'],teamCount:[n=>`${n} 隊`,n=>n===1?'1 team':`${n} teams`],
  bank:['題庫','Questions'],kids:['學生版','Kids'],adults:['成人版','Adults'],saveNote:['資料只存在這台電腦的瀏覽器','Saved only in this browser'],
  export:['匯出紀錄','Export'],import:['匯入紀錄','Import'],reset:['清除分數與寵物','Reset scores & pets'],toMap:['前往關卡地圖','Go to Stage Map'],
  teamName:['隊名','Team'],members:['組員（選填）','Members (optional)'],membersPh:['例如：小安、阿哲、小美','e.g. Amy, Ben, Chloe'],
  defaultTeam:[i=>['第一隊','第二隊','第三隊','第四隊'][i],i=>`Team ${i+1}`],
  total:[n=>`累積 ${n} 分`,n=>`${n} pts total`],prevHero:['上一個角色','Previous character'],nextHero:['下一個角色','Next character'],
  petPick:[p=>`${p}（點選出戰）`,p=>`${p} (click to use)`],
  unlockAt:[s=>s===7?'魔王關過關解鎖':`第 ${s} 關過關解鎖`,s=>s===7?'Unlock by beating the Boss':`Unlock by clearing Stage ${s}`],
  mapTitle:['關卡地圖','Stage Map'],perStage:['每關題數','Questions'],timerLabel:['每題計時','Timer'],
  qs:[n=>`${n} 題`,n=>`${n} Qs`],timerOff:['不計時','Off'],sec:[n=>`${n} 秒`,n=>`${n} s`],
  stageN:[s=>s===7?'最終關':`第 ${s} 關`,s=>s===7?'Final':`Stage ${s}`],
  reward:[p=>`過關得<br>${p}`,p=>`Reward:<br>${p}`],
  stars:[(t,n)=>`${t}：${n} 星`,(t,n)=>`${t}: ${n} stars`],
  tipReward:[p=>`過關獎勵：${p}（答對六成就過關）`,p=>`Reward: ${p} (clear with 60% correct)`],
  start:[s=>s===7?'挑戰魔王':`開始第 ${s} 關`,s=>s===7?'Fight the Boss':`Start Stage ${s}`],
  loading:['題庫載入中…','Loading questions…'],notReady:['題庫尚未就緒','Questions not ready'],
  loadFail:['題庫讀取失敗，請重新整理再試一次。','Couldn’t load questions. Please reload.'],noQuestions:['這一關還沒有題目。','This stage has no questions yet.'],
  exit:['回地圖','Map'],progress:[(i,n)=>`第 ${i} / ${n} 題`,(i,n)=>`Q ${i} / ${n}`],
  hint:['夥伴提示','Hint'],hintLine:[h=>`提示：${h}`,h=>`Hint: ${h}`],skip:['跳過這題','Skip'],reveal:['揭曉答案','Reveal'],next:['下一題','Next'],results:['看關卡結算','See Results'],
  timeUp:['時間到','Time’s up'],picks:[(t,l)=>`${t} 選 ${l}`,(t,l)=>`${t} picks ${l}`],
  answer:[l=>`正解 ${l}`,l=>`Answer ${l}`],noAnswer:['未作答','No answer'],wrong:['答錯','Wrong'],streakBonus:['（連對加碼）',' (streak bonus)'],
  pets:['寵物','Pets'],streak:['連對','Streak'],ready:['已作答','Ready'],thinking:['思考中','Thinking'],correct:['答對','Correct'],
  allHit:['全員命中！','Everyone hit!'],streak3:['連對 3 題！+50','3 in a row! +50'],hit:['命中！','Hit!'],counter:['被反擊了，下一題扳回來','Counterattack! Win the next one'],
  imported:['紀錄已匯入','Records imported'],badFile:['這個檔案不是 Prompt Arena 的隊伍紀錄。','This file isn’t a Prompt Arena team record.'],
  resetConfirm:['要清除所有隊伍的分數、星星和寵物嗎？隊名和組員會保留。','Clear all teams’ scores, stars and pets? Team names and members are kept.'],
  leaveConfirm:['離開後這一關不會結算（已得分數會保留）。確定離開？','Leaving won’t finish this stage (points earned are kept). Leave?'],
  endTitle:[s=>s===7?'魔王關 結算':`第 ${s} 關 結算`,s=>s===7?'Boss Stage Results':`Stage ${s} Results`],
  endWin:[(e,n,p)=>`${e}被擊退了！答對 ${n} 題以上的隊伍帶走了${p}。`,(e,n,p)=>`${e} was defeated! Teams with ${n}+ correct won the ${p}.`],
  endLose:[(e,n)=>`這次${e}比較強。答對 ${n} 題就能過關，再來一次！`,(e,n)=>`${e} was too strong this time. Get ${n} right to clear it. Try again!`],
  scoreLine:[(c,n)=>`答對 ${c} / ${n}`,(c,n)=>`${c} / ${n} correct`],mvp:['本關最佳','Stage MVP'],
  moreToWin:[k=>`再答對 ${k} 題就能帶走夥伴`,k=>`${k} more correct to win the buddy`],
  won:[p=>`獲得${p}！`,p=>`Won the ${p}!`],owned:[p=>`已擁有${p}`,p=>`Already has the ${p}`],
  retry:['再玩一次這關','Replay stage'],backMap:['回關卡地圖','Back to Map'],
  cleared:[t=>`${t} 過關！`,t=>`${t} cleared it!`],newBuddy:['獲得新夥伴！','New Buddy!'],buddyName:[p=>`新夥伴：${p}`,p=>`New buddy: ${p}`],
  take:['收下夥伴','Take buddy'],takeNext:['收下，換下一隊','Next team'],
  boss:['魔王關','Boss Stage'],bossBadge:['魔王關 · 綜合挑戰','Boss Stage · Final Challenge'],
  stageBadge:[(s,l,n)=>`第 ${s} 關 · ${l} ${n}`,(s,l,n)=>`Stage ${s} · ${l} ${n}`],
  location:[(s,n)=>`第 ${s} 關・${n}`,(s,n)=>`Stage ${s} · ${n}`],
};
export const GUIDE=[
`<p><b>怎麼玩：</b>每題各隊討論後舉牌（A／B／C／D），老師在「各隊作答」點下每隊的選擇，再按「揭曉答案」。只有一隊時，直接點選項就會揭曉。</p>
<p><b>計分：</b>答對 +100；連續答對 3 題再加 50。一關答對 60% 就過關，並得到這一關的寵物夥伴。80% 兩顆星，全對三顆星。</p>
<dl><dt>第 1 關 · A</dt><dd>Action：說清楚要 AI 做什麼。</dd><dt>第 2 關 · C</dt><dd>Content：給背景、資料和條件。</dd><dt>第 3 關 · T</dt><dd>Style：指定語氣和格式。</dd><dt>第 4 關 · O</dt><dd>Goal：說出目的和完成標準。</dd><dt>第 5 關 · R</dt><dd>Refer：給例子、參考和限制。</dd><dt>第 6 關 · S</dt><dd>Steps：安排步驟和檢查點。</dd><dt>魔王關</dt><dd>綜合運用，並練習查證、修正 AI 的回答。</dd></dl>
<p><b>語言：</b>右上角可切換「中／EN／中+EN」。雙語模式會在中文下方顯示英文。</p>
<p><b>快捷鍵：</b>Enter 揭曉／下一題；只有一隊時可按 1–4 作答。</p>
<p>隊名、分數與寵物只存在這台電腦的瀏覽器。換電腦前可先「匯出紀錄」。</p>`,
`<p><b>How to play:</b> Teams discuss each question and hold up A/B/C/D. The host taps each team’s choice under the answer pad, then presses “Reveal”. With one team, tapping an option reveals the answer right away.</p>
<p><b>Scoring:</b> +100 per correct answer, +50 more on every 3-in-a-row. Get 60% right to clear a stage and win its pet buddy. 80% earns two stars, a perfect run three.</p>
<dl><dt>Stage 1 · A</dt><dd>Action: say what AI should do.</dd><dt>Stage 2 · C</dt><dd>Content: give background, data and conditions.</dd><dt>Stage 3 · T</dt><dd>Style: set the tone and format.</dd><dt>Stage 4 · O</dt><dd>Goal: state the purpose and what “done” means.</dd><dt>Stage 5 · R</dt><dd>Refer: give examples, references and limits.</dd><dt>Stage 6 · S</dt><dd>Steps: plan the steps and checkpoints.</dd><dt>Boss Stage</dt><dd>Combine everything, and practice verifying and fixing AI answers.</dd></dl>
<p><b>Language:</b> switch between 中 / EN / 中+EN at the top right. Bilingual mode shows English under the Chinese.</p>
<p><b>Shortcuts:</b> Enter to reveal / go next. With one team, press 1–4 to answer.</p>
<p>Team names, scores and pets are saved only in this browser. Use “Export” before switching computers.</p>`];

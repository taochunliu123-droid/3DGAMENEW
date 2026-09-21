import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {STAGES,makeSession,shuffle,grade,scoreFor,stageOutcome} from '../dist/game-core.js';
const bank=JSON.parse(fs.readFileSync(new URL('../dist/questions.json',import.meta.url)));
test('每個對象的每一關至少 5 題',()=>{for(const a of ['kids','adults'])for(const s of STAGES)assert.ok(bank.filter(q=>q.audience===a&&q.stage===s.id).length>=5,a+' 第'+s.id+'關')});
test('同一場不重複、只抽該關',()=>{for(const a of ['kids','adults'])for(const s of STAGES){const qs=makeSession(bank,{audience:a,stage:s.id,count:5});assert.equal(qs.length,5);assert.equal(new Set(qs.map(q=>q.id)).size,5);assert.ok(qs.every(q=>q.audience===a&&q.stage===s.id))}});
test('打亂選項仍以 ID 判分',()=>{for(const q of bank){const o=shuffle(q.options);assert.equal(o.filter(x=>grade(q,x.id)).length,1)}});
test('連對第 3 題加碼',()=>{assert.equal(scoreFor(true,1),100);assert.equal(scoreFor(true,3),150);assert.equal(scoreFor(true,6),150);assert.equal(scoreFor(false,0),0)});
test('過關與星等',()=>{assert.deepEqual(stageOutcome(2,5),{stars:0,cleared:false});assert.deepEqual(stageOutcome(3,5),{stars:1,cleared:true});assert.deepEqual(stageOutcome(4,5),{stars:2,cleared:true});assert.deepEqual(stageOutcome(5,5),{stars:3,cleared:true});assert.equal(stageOutcome(0,0).cleared,false)});
test('每一關都有不同的寵物獎勵',()=>{assert.equal(new Set(STAGES.map(s=>s.pet)).size,STAGES.length)});

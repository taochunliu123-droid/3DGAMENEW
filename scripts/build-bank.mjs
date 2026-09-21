// 讀取 content/questions/**/*.md（一個檔案一關、多題），檢查格式後輸出 dist/questions.json
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),base=path.join(root,'content/questions');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.md')?[path.join(d,e.name)]:[]);
const REQUIRED=['情境','問題','A','B','C','D','解析','提示'];
const seen=new Set(),bank=[];let errors=0;
const fail=(where,msg)=>{console.error(where+'：'+msg);errors++};
for(const file of walk(base).sort()){
  const rel=path.relative(root,file);
  const raw=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n').replace(/<!--[\s\S]*?-->/g,'');
  const front=raw.match(/^---\n([\s\S]*?)\n---\n/);
  if(!front){fail(rel,'檔案開頭缺少 --- audience / stage --- 區塊');continue}
  const meta=Object.fromEntries(front[1].split('\n').filter(Boolean).map(l=>{const i=l.indexOf(':');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}));
  const audience=meta.audience,stage=Number(meta.stage);
  if(!['kids','adults'].includes(audience)){fail(rel,'audience 需為 kids 或 adults');continue}
  if(!Number.isInteger(stage)||stage<1||stage>7){fail(rel,'stage 需為 1 到 7');continue}
  const blocks=raw.slice(front[0].length).split(/^# /m).slice(1);
  if(!blocks.length){fail(rel,'沒有任何題目（每題以「# 標題」開頭）');continue}
  blocks.forEach((block,n)=>{
    const title=block.split('\n')[0].trim(),where=`${rel} 第 ${n+1} 題「${title}」`;
    const ans=block.match(/^答案[：:]\s*([A-Da-d])\s*$/m);
    if(!ans)return fail(where,'缺少「答案：A」這一行（A、B、C、D 擇一）');
    const sections={};let dup='';
    for(const m of block.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)){const k=m[1].trim();if(sections[k])dup=k;sections[k]=m[2].trim()}
    if(dup)return fail(where,'重複章節 ## '+dup);
    const miss=REQUIRED.find(k=>!sections[k]);if(miss)return fail(where,'缺少章節 ## '+miss);
    if(new Set(['A','B','C','D'].map(k=>sections[k])).size!==4)return fail(where,'四個選項不可重複');
    const sig=audience+'\n'+sections['情境']+'\n'+sections['問題'];if(seen.has(sig))return fail(where,'與其他題目的情境和問題完全相同');seen.add(sig);
    bank.push({id:`${audience}-s${stage}-${String(n+1).padStart(2,'0')}`,audience,stage,answer:ans[1].toLowerCase(),title,
      scenario:sections['情境'],question:sections['問題'],
      options:['a','b','c','d'].map(id=>({id,text:sections[id.toUpperCase()],feedback:sections['解析 '+id.toUpperCase()]||''})),
      explanation:sections['解析'],hint:sections['提示']});
  });
}
const ids=bank.map(q=>q.id);if(new Set(ids).size!==ids.length)fail('題庫','同一對象的同一關出現在兩個檔案裡，請合併成一個檔案');
if(!bank.length)fail('題庫','不可為空');
if(errors)process.exit(1);
fs.writeFileSync(path.join(root,'dist/questions.json'),JSON.stringify(bank));
console.log('題庫檢查成功：'+bank.length+' 題');
for(const a of ['kids','adults'])console.log(a+'：'+[1,2,3,4,5,6,7].map(s=>'第'+s+'關 '+bank.filter(q=>q.audience===a&&q.stage===s).length).join(' / '));

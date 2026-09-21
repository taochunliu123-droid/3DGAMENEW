# Prompt Arena 3D — PM Mayors（小隊闖關版）

用 ACTORS 練習更好的 Prompt。最多四隊同場競賽，過關收集 3D 寵物夥伴。Three.js 即時 3D，不需 API 金鑰。

## 玩法
- **隊伍設定**：1～4 隊，可改隊名、組員（選填）、3D 角色。選學生版或成人版題庫。
- **關卡地圖**：7 關，依 ACTORS 排序（A 任務、C 背景、T 風格、O 目標、R 參考與限制、S 步驟、魔王關）。每場 5 或 8 題，可設定每題倒數 20／30／45 秒。
- **作答**：各隊舉牌，老師在「各隊作答」點下每隊選項，再按「揭曉答案」。只有一隊時直接點選項（或按鍵盤 1–4）。Enter 揭曉／下一題。
- **計分**：答對 +100，連對第 3、6、9 題再 +50。
- **過關與寵物**：答對 60% 過關並得到該關寵物；80% 兩星、全對三星。寵物：小柴犬、小貓咪、小白兔、小狐狸、機器鳥、小飛龍、黃金神龍。還沒有寵物的隊伍帶著「神秘蛋」。在隊伍卡片點選已擁有的寵物，可換出戰夥伴。

## 資料存在哪裡
隊名、組員、分數、星星和寵物都存在這台電腦瀏覽器的 localStorage（`prompt-arena-teams-v2`），不會上傳。換電腦前按「匯出紀錄」存成 JSON，到新電腦按「匯入紀錄」。「清除分數與寵物」會保留隊名和組員。

## 在 GitHub 新增或修改題目
題庫一關一個檔案，共 14 個：

```
content/questions/kids/stage-1.md … stage-7.md     學生版
content/questions/adults/stage-1.md … stage-7.md   成人版
```

每個檔案開頭的 `audience`、`stage` 不用動。檔案裡每題以「# 標題」開頭，下一行寫「答案：A」（A–D 擇一），接著是 ## 情境、## 問題、## A～D、## 解析、## 提示。

- **新增題目**：複製 `docs/QUESTION-TEMPLATE.md` 裡的那一段，貼到該關檔案最後面再修改。
- **刪除題目**：從「# 標題」刪到下一個「# 標題」之前。
- 在 GitHub 點檔案 → 鉛筆圖示編輯 → Commit changes，Vercel 會自動檢查並部署。格式錯誤時，建置訊息會寫出是哪個檔案的第幾題。

每關至少要 5 題（每場抽 5 題）；選「每關 8 題」時，會抽出該關全部題目，最多 8 題。畫面上的選項順序會打亂，不影響判分。

小提醒：簡單版的正解通常比較完整，也常是最長的選項。想加難度時，可以把錯誤選項寫得一樣長、但少一個關鍵條件。

## Vercel 部署
Framework Preset 選 Other；Build Command：`node scripts/build-bank.mjs`；Output Directory：`dist`；Node.js 22+。`vercel.json` 已含相同設定。

## 本地執行
```bash
node scripts/build-bank.mjs
node --test scripts/game.test.mjs
python -m http.server 8000 --directory dist
```
開啟 http://localhost:8000（不能直接雙擊 HTML）。

## 瀏覽器
需要 WebGL 2 與硬體加速。3D 無法啟動時會顯示提示，題目與計分照常運作。Three.js 為 MIT 授權，見 `dist/vendor/LICENSE-three.txt`。

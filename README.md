# 週考成績平台 (Weekly Exam Analytics & Learning Incentive System)

> **補習班內生式學力推演與行政整合系統**  
> 專為親師生打造的專業學力數據分析看板與 30 秒遊戲化激勵回放系統。  
> 核心哲學：**80% 專業學力數據分析（親師溝通） + 20% 內生式遊戲化推演（學生動機激勵）**。  
> 基於 **Next.js 14 (App Router)**、**TypeScript**、**Tailwind CSS**、**Prisma ORM**、**Turso (LibSQL)** 與 **Recharts** 打造。

---

## 📌 目錄 (Table of Contents)
1. [專案核心理念與定位](#-專案核心理念與定位)
2. [系統功能架構與頁面導覽](#-系統功能架構與頁面導覽)
3. [核心機制設計 (學力與戰力轉換)](#-核心機制設計-學力與戰力轉換)
4. [雙軌戰術晶片系統 (Tactical Chips)](#-雙軌戰術晶片系統-tactical-chips)
5. [30 秒學力推演回放引擎 (Battle Arena)](#-30-秒學力推演回放引擎-battle-arena)
6. [資料庫模型架構 (Prisma Schema)](#-資料庫模型架構-prisma-schema)
7. [後台行政管理模組 (Admin Portal)](#-後台行政管理模組-admin-portal)
8. [安裝、環境設定與啟動指南](#-安裝環境設定與啟動指南)

---

## 🎯 專案核心理念與定位

傳統教育評量工具多偏向單調的成績表格，容易引發學生焦慮且缺乏自主修正動機；而純遊戲化軟體往往過度注重手動換裝、隨機抽卡與長時間掛機，招致家長對於沉迷與浪費時間的疑慮。

本系統建立**「學力即戰力、作業即護盾、練習即突破」**的客觀閉環：
* **極簡防沉迷**：
  * 無即時連線對戰、無抽卡換裝、無長時間掛機。
  * 學生每週僅需 2~3 分鐘完成「自主修練翻書練習」與「裝備 1 枚戰術晶片」。
  * 對戰為**「30 秒純被動推演成果回放（附 Skip 跳過鍵）」**，勝負完全由客觀學力、作業紀律與自主練習決定。
* **高信任度親師透明度**：
  * 家長進入系統第一眼看見的是**國英數三科成績趨勢折線圖**與**近 5 週作業繳交歷程**。
  * 對戰結果附帶**「客觀學力勝負因果分析報告」**（例：因數學差距領先、作業準時啟用護盾減傷、自主練習解鎖暴擊晶片）。

---

## 📱 系統功能架構與頁面導覽

```
/ (首頁登入)
├── 極簡居中卡片，單一標語「查看歷史成績，考高分增強本週戰力」
├── 學號輸入框 (例如 S101)，快速體驗按鈕 (S101, S102, S104, S109)
└── 右上角「老師入口」

/portal/[studentNumber] (學生整合門戶)
├── 【頂部常駐】：學生個人卡片 (像素Sprite、姓名、學號、本週均分、勝率、作業護盾標籤)
├── 【三大核心功能按鈕】(不預設塞滿成績曲線，避免資訊轟炸)：
│    ├── 按鈕 1：📊 歷次學力分析 (展開折線圖與 5 週繳交歷程)
│    ├── 按鈕 2：🎯 挑戰與晶片備戰室 (自主練習 + 戰術晶片庫同頁整合)
│    └── 按鈕 3：⚔️ 本週推演結算 (置於最右側，下方附帶 30 秒推演成果觀看按鈕)
│
├── 【區塊 1 - 歷次學力分析】：
│    ├── Recharts 動態折線圖 (支援三科總分 vs 全班總分、個別單科 vs 班級平均)
│    └── 近 5 週作業繳交狀態時間軸 (✔ 準時 / ⚠️ 待訂正 / ✕ 缺交)
│
├── 【區塊 2 - 挑戰與晶片備戰室】：
│    ├── 4 大自主修練道場 (數學精熟、國文語感、英文句型、小六單字快閃，開卷翻書挑戰)
│    └── 6 大戰術晶片庫 (自帶數值差額百分比進度條，樂觀更新零延遲裝備)
│
└── 【區塊 3 - 本週推演結算】：
     ├── 本週對陣雙方選手資訊卡片 (血量、作業護盾、裝備晶片)
     ├── 本週學力與戰力因果結構三格圖解 (卷面分 ➔ HP、作業 ➔ 護盾、修練 ➔ 大招)
     └── 【最下方按鈕】：▶ 觀看本週 30 秒學力推演結果 (展開現代深色科技競技場播放器)

/admin/* (行政後台管理系統)
├── /admin/login     : 管理員身分驗證
├── /admin/weeks     : 學期週次管理與切換
├── /admin/homework  : 全班作業繳交登記 (準時 / 缺漏待補 / 缺交)
├── /admin/quests    : 每週自主修練錯題庫與單字庫管理
└── /admin/settle    : 週考三科成績 Excel/CSV 匯入、批次對戰匹配推演結算
```

---

## ⚡ 核心機制設計 (學力與戰力轉換)

系統的所有數值皆由現實學科表現透明映射，杜絕任何黑箱數值：

| 遊戲化元素 | 現實學力對應來源 | 影響推演機制 |
| :--- | :--- | :--- |
| **基礎血量 (HP)** | 當週國、英、數**三科平均成績** | 基礎生命值，成績愈高生存力愈強（例如均分 85 即為 85 HP）。 |
| **防禦護盾 (Shield)** | 當週**作業繳交狀態** (`COMPLETED`) | 作業準時繳交者，在 Round 2 自動啟用金色防護罩，**減免 15% 傷害**；缺交者承受全額傷害。 |
| **先手優勢** | 當週**數學科成績**較高者 | 數學思維快者取得推演 Round 1 先攻揮砍權。 |
| **奧義大招 (Super Move)** | **核心戰術晶片**裝備 | Round 3 引爆專屬晶片機制（穿透傷害、吸血回血、逆境超量暴擊等）。 |

---

## 🛡️ 雙軌戰術晶片系統 (Tactical Chips)

學生每週限裝備 **1 枚**核心戰術晶片，晶片分為「學科精熟軌道」與「勤勉突破軌道」，並在介面中提供**精確數值差額進度條 (Progress Bar)**：

### 軌道一：【學科精熟軌道】（靠單科成績 $\ge 85$ 解鎖，學霸多選一）
1. **`MATH_VOID`【幾何湮滅陣】**
   * **解鎖門檻**：當週數學科 $\ge 85$ 分。
   * **進度計算**：`Math.min(100, Math.round((mathScore / 85) * 100))`，顯示「還差 $X$ 分達標」。
   * **戰鬥機制**：穿透傷害，無視對手 30% 防禦。
   * **動畫演出**：藍白幾何晶體矩陣升起，釋放高亮度穿透聚焦射線。
2. **`CHINESE_INK`【千字筆墨斬】**
   * **解鎖門檻**：當週國文科 $\ge 85$ 分。
   * **進度計算**：`Math.min(100, Math.round((chineseScore / 85) * 100))`，顯示「還差 $X$ 分達標」。
   * **戰鬥機制**：造成真實傷害；若自身血量落後，吸取傷害的 30% 轉換為自身生命值。
   * **動畫演出**：書法水墨殘影拖尾，「斬、墨、破」繁體字高動態打擊。
3. **`ENGLISH_STORM`【律動疾風矢】**
   * **解鎖門檻**：當週英文科 $\ge 85$ 分。
   * **進度計算**：`Math.min(100, Math.round((englishScore / 85) * 100))`，顯示「還差 $X$ 分達標」。
   * **戰鬥機制**：3 連段疾速多重光矢，並削減對手 20% 攻擊力。
   * **動畫演出**：背後浮現金色風暴羽翼，漫天流星光矢貫穿全場。

### 軌道二：【勤勉突破軌道】（靠作業與自主練習解鎖，後段生逆襲利器）
4. **`ADVERSITY_SHATTER`【逆境破甲焰】（弱者翻盤核心）**
   * **解鎖門檻**：完成當週「自主修練道場」任意 1 項任務（開卷翻書答對率達 60%）。
   * **進度計算**：完成即 $100\%$ 解鎖。
   * **戰鬥機制**：若自身週考平均分低於對手，全場造成的所有傷害**大幅提升 35% 超量暴擊**！
   * **動畫演出**：雙拳燃起赤紅破甲烈焰，震碎地面衝擊波。
5. **`GUARDIAN_BASTION`【守護壁壘】（勤勉鐵壁）**
   * **解鎖門檻**：當週作業按時完成繳交 (`COMPLETED`)。
   * **進度計算**：準時繳交即 $100\%$ 解鎖。
   * **戰鬥機制**：第二回合減傷效果由 15% 激增至 50%，並反彈 20% 傷害給對手。
   * **動畫演出**：深綠色巨型玄武幾何結界籠罩全場。
6. **`SELF_TRANSCENDENCE`【自我超越】（超越昨日之我）**
   * **解鎖門檻**：本週平均分數高於個人過去平均成績（進步 $\ge 1$ 分）。
   * **進度計算**：`本週均分 - 歷史均分`，顯示「還差 $X$ 分超越上週紀錄」。
   * **戰鬥機制**：第三回合大招發動時，必定觸發 1.5 倍爆發暴擊。
   * **動畫演出**：全身升起璀璨金色冠軍光環。

---

## 🎬 30 秒學力推演回放引擎 (Battle Arena)

回放播放器嵌入於學生看板最下方，採用科技體育館設計（深色漸層 `bg-slate-900 / indigo-950`、科技網格底紋），攻防節奏清晰有序：

```
[00s ~ 08s] Round 1：試探普攻
            ├── P1 踏步前衝、揮出藍色光刃劍氣飛向 P2
            ├── P2 受到普攻傷害 (閃紅跳字)，解說停留 2.5 秒
            ├── P2 穩住陣腳反擊、揮出赤紅光刃劍氣飛向 P1
            └── P1 受到反擊傷害 (閃紅跳字)，第一回合試探結束

[08s ~ 18s] Round 2：作業護盾檢驗
            ├── 檢驗雙方本週作業完成度
            ├── 作業準時繳交者：周身浮現金色/碧綠能量護盾，抵擋揮砍並吸收 15% 傷害
            └── 作業缺漏者：無護盾加成，承受全額揮砍傷害

[18s ~ 26s] Round 3：晶片大招奧義
            ├── 全場進入 0.6 秒全黑蓄力「SUPER FLASH」
            ├── 頂部彈出晶片專屬金色橫幅（招式名稱與機制解說）
            ├── 觸發專屬晶片動畫（幾何晶體矩陣、水墨書法、赤紅破甲火焰等）
            └── 造成大額數值爆發，決定勝負走向

[26s ~ 30s] Round 4：推演結算與因果報告
            ├── 獲勝方呈現 Victory 動畫，惜敗方抱拳致意
            └── 彈出「推演勝負因果分析報告」（客觀闡明成績差距、護盾抵擋與晶片逆轉因子）
```

---

## 🗄️ 資料庫模型架構 (Prisma Schema)

```prisma
// 學生基本資料
model Student {
  id            String   @id @default(cuid())
  studentNumber String   @unique // S101, S102...
  name          String
  gender        String   @default("BOY") // "BOY" | "GIRL"
  className     String   @default("六年級精英班")
  createdAt     DateTime @default(now())

  examScores      ExamScore[]
  homeworkRecords HomeworkRecord[]
  questLogs       StudentWeeklyQuestLog[]
  loadouts        WeeklyStudentLoadout[]
}

// 學期週次
model AcademicWeek {
  id         String   @id @default(cuid())
  weekNumber Int      @unique // 1, 2, 3...
  title      String   // 第 1 週：幾何圖形與代數初步
  isSettled  Boolean  @default(false)
  createdAt  DateTime @default(now())
}

// 週考成績 (國英數三科完整支援)
model ExamScore {
  id              String   @id @default(cuid())
  studentId       String
  weekId          String
  chineseScore    Float    @default(0)
  englishScore    Float    @default(0)
  mathScore       Float    @default(0)
  averageScore    Float    @default(0)
  previousAverage Float    @default(0)

  @@unique([studentId, weekId])
}

// 作業繳交紀錄
model HomeworkRecord {
  id           String   @id @default(cuid())
  studentId    String
  weekId       String
  status       String   @default("COMPLETED") // COMPLETED | PARTIAL | MISSING
  missingScope String?

  @@unique([studentId, weekId])
}

// 自主修練挑戰題庫
model WeeklyQuizQuestion {
  id            String   @id @default(cuid())
  weekId        String
  category      String   // MATH | CHINESE | ENGLISH | VOCAB
  questionText  String
  options       String   // JSON 字串 ["A", "B", "C", "D"]
  correctAnswer String
  explanation   String?
}

// 學生每週自主修練通過狀態
model StudentWeeklyQuestLog {
  id               String   @id @default(cuid())
  studentId        String
  weekId           String
  completedMath    Boolean  @default(false)
  completedChinese Boolean  @default(false)
  completedEnglish Boolean  @default(false)
  completedVocab   Boolean  @default(false)
  hasUnlockedChip  Boolean  @default(false)

  @@unique([studentId, weekId])
}

// 學生當週裝備的戰術晶片 (1/1)
model WeeklyStudentLoadout {
  id           String   @id @default(cuid())
  studentId    String
  weekId       String
  equippedChip String   @default("ADVERSITY_SHATTER")

  @@unique([studentId, weekId])
}

// 30 秒推演配對與回放日誌
model BattleMatch {
  id         String   @id @default(cuid())
  weekId     String
  player1Id  String
  player2Id  String
  winnerId   String?
  isDraw     Boolean  @default(false)
  battleLog  String   // JSON 格式 (包含 4 回合數值與因果分析)
}
```

---

## 🛠️ 安裝、環境設定與啟動指南

### 1. 環境需求
* **Node.js**: `v18.17.0` 或以上版本
* **套件管理工具**: `npm`

### 2. 環境變數設定 (`.env`)
專案預設連接至 Turso (LibSQL)：
```env
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
```

### 3. 安裝依賴與產生 Prisma 客戶端
```bash
npm install
npx prisma generate
```

### 4. 注入 30 名學生與第 1 週推演種子資料
```bash
npx tsx scripts/seed-prd.ts
```

### 5. 本地開發模式啟動
```bash
npm run dev
```
瀏覽器造訪：`http://localhost:3000`

### 6. 生產環境建置與運行
```bash
npm run build
npm run start
```

---

## 📊 快速體驗帳號

進入首頁 `http://localhost:3000` 後，可點擊快速體驗或手動輸入以下學號：
* `S101`：**王小明**（男同學，均衡型，三科均分 85，作業準時）
* `S102`：**李依婷**（女同學，高分學霸型，均分 90，解鎖多張學科晶片）
* `S104`：**陳品睿**（男同學，數學優異型，解鎖幾何湮滅陣）
* `S109`：**林均浩**（男同學，逆境突破型，透過自主挑戰觸發逆境破甲焰）

---

*文檔版本：v2.0 (PRD-Complete)*  
*更新日期：2026 年 10 月*

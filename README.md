# ITM games - 清大科管所賽事系統

> **國立清華大學 科技管理研究所 27屆製作**  
> 清大科管所賽事系統，次世代日系動漫電競風格賽事排程與比分管理系統，全面支援電子競技、球類運動、桌上卡牌、棋類智力等多賽制管理。  
> 基於 **Next.js 14 (App Router)**、**Tailwind CSS**、**Prisma ORM** 與 **SQLite** 打造。

---

## 🌟 核心功能規格

### 1. 帳號與權限系統 (Auth & Roles)
- **學號唯一識別**：註冊必填學號（Student ID，系統唯一約束）、真實姓名、競賽暱稱、密碼。
- **首位自動晉升**：系統首位註冊者自動賦予 `admin`（最高管理員）權限；後續註冊者預設為 `player`（參賽選手）。
- **權限分流管理**：
  - **一般選手 (`player`)**：查看即時賽程與晉級樹、瀏覽積分榜、登記個人場次比分、修改個人競賽暱稱。
  - **系統管理員 (`admin`)**：建立各類賽制比賽、一鍵排程開賽、推進瑞士制輪次、強制覆寫爭議比分、啟動 Top N 淘汰複賽、在後台指派/拔除其他成員管理員權限（內建防止拔除最後一位管理員安全機制）。
- **安全性設計**：密碼採用 `bcryptjs` 單向加鹽雜湊，身分驗證基於現代 `jose` JWT 並以 `HttpOnly` Cookie 儲存，徹底阻絕 XSS 攻擊。

---

### 2. 賽制排程引擎 (Tournament Engine)
內建三大賽制核心演算法模組（位於 `src/lib/tournament/`）：
1. **瑞士制 (Swiss-System)**：
   - **積分相近優先**：每輪自動依照當前累計積分由高至低分層配對。
   - **防重複交手**：歷史對局查重，保證同一賽事內對手不重複碰頭。
   - **回溯搜尋 (DFS Backtracking)**：在遇到同分段不可匹配時自動跨層回溯（Down-float），確保全局無死結。
   - **奇數輪空 (BYE)**：人數為奇數時，自動挑選尚未輪空過且積分最低的選手給予輪空勝（自動記 1.0 分）。
2. **小組賽單循環 (Round Robin)**：
   - **蛇形平衡分組 (Snake Seeding)**：依種子序號自動平衡各組實力分配（如 Group A: 1, 4, 5, 8；Group B: 2, 3, 6, 7）。
   - **圓盤輪轉演算法 (Polygon Method)**：無衝突生成全組完整輪次對戰，並自動輪替黑白棋順序。
3. **直接單淘汰賽 (Single Elimination Bracket)**：
   - **對稱種子排位**：標準 $2^k$ 晉級樹（`[1 vs 8]`, `[4 vs 5]`, `[2 vs 7]`, `[3 vs 6]`），保證種子 1 與 2 僅能在決賽碰頭。
   - **勝者槽位自動推導**：對局勝負揭曉時，系統自動將勝者移入下一輪對應樹狀節點（`player1` / `player2`）。
4. **複賽機制 (Playoff Cut to Bracket)**：
   - 瑞士制或小組賽初賽完賽後，管理者可一鍵依積分榜自動擷取前 N 名（如 Top 4 / Top 8），系統自動重新種子排位並產生單敗淘汰 Bracket。

---

### 3. 對局比分雙向同步 (Match Reporting)
- **雙向自動推導**：
  - 白方（或黑方）回報「我方勝利」，系統自動標記對方為「敗北」。
  - 一方回報「雙方和局」，另一方自動連動為「和局」。
  - 輪空場次（BYE）自動判定白方勝出。
- **狀態防呆鎖定**：比分登記後對局立即轉為 `finished` 並鎖定，選手無法惡意竄改。
- **管理員爭議覆寫 (Admin Override)**：若發生選手誤報或違規判罰，管理員具備專屬強制覆寫權限，隨時修正比分。
- **全場積分等冪重算**：每次比分變動時，系統自動根據全部已完賽場次即時重新校準所有選手積分（勝 1.0 / 和 0.5 / 負 0.0），杜絕累積誤差。

---

### 4. UI/UX 動漫電競風格 (Anime Gaming Theme)
- **視覺基底**：深曜黑（Void Black: `#050609`）搭配戰鬥科技表面（`#101626`）。
- **強烈對比強調色**：Persona 緋紅（`#ff204e`）與蔚藍電競青（`#00f0ff`）、冠軍金（`#f59e0b`）。
- **幾何切角與微光質感**：自訂 `.cyber-cut-corner`、`.cyber-cut-br` 多邊形按鈕與卡片、`.shadow-neon-red` 霓虹發光。
- **全響應式支援 (Responsive Design)**：
  - **手機端**：固定於底部的深色玻璃擬態導航欄 (`MobileNav`)、卡片式比分登記彈窗。
  - **電腦端**：寬版對局清單、多輪次過濾欄、標準樹狀淘汰晉級圖 (`BracketView`)、金銀銅勳章排行榜。

---

## 🛠 技術架構

| 項目 | 技術選型 |
| :--- | :--- |
| **全端框架** | **Next.js 14.2 (App Router)** |
| **程式語言** | **TypeScript 5.6** |
| **樣式與圖標** | **Tailwind CSS 3.4 + Lucide React** |
| **資料庫 & ORM** | **Prisma 5.22 + SQLite** (單檔 `dev.db`，開箱即用、零外部依賴) |
| **安全與驗證** | **Jose (JWT) + bcryptjs (密碼雜湊) + HttpOnly Cookie** |

---

## 📂 專案目錄結構

```text
比賽網站/
├── prisma/
│   ├── schema.prisma              # 資料庫模型定義 (User, Tournament, Participant, Match)
│   └── dev.db                     # SQLite 本機資料庫
├── scripts/
│   ├── seed.ts                    # 測試賽事與示範帳號填充腳本
│   ├── test-db.ts                 # 資料庫連線測試
│   ├── test-engine.ts             # 賽制演算法單元測試 (5大測試全過)
│   ├── test-auth.ts               # 註冊/登入/首位Admin測試 (7大測試全過)
│   └── test-reporting.ts          # 雙向比分同步與覆寫測試 (5大測試全過)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/users/       # 後台選手名單與權限切換 API
│   │   │   ├── auth/              # 註冊、登入、登出、當前用戶 API
│   │   │   ├── matches/[id]/      # 對局詳情、比分登記、管理員覆寫 API
│   │   │   ├── tournaments/       # 賽事增刪查改、開賽、下一輪、啟動複賽 API
│   │   │   └── users/profile/     # 選手修改暱稱 API
│   │   ├── admin/users/           # 管理者後台名單頁面
│   │   ├── tournaments/           # 賽事大廳頁面
│   │   │   └── [id]/              # 賽事實時戰情室 (對局清單 / 積分榜 / 晉級樹)
│   │   ├── login/                 # 登入頁面
│   │   ├── register/              # 註冊頁面 (首位自動 Admin)
│   │   ├── profile/               # 選手個人中心 (暱稱修改)
│   │   ├── layout.tsx             # 全域動漫電競主題框架 + MobileNav
│   │   ├── page.tsx               # 官方首頁 Hero 面板
│   │   └── globals.css            # 多邊形切角、霓虹發光、科技背景 Utility
│   ├── components/
│   │   ├── layout/                # Navbar (動態導航列), MobileNav (手機底欄)
│   │   └── tournament/            # MatchCard (對戰卡), StandingsTable (積分榜),
│   │                              # BracketView (晉級樹), QuickReportModal (比分彈窗)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma Client 單例
│   │   ├── auth.ts                # Session 簽發、解析與權限輔助函數
│   │   ├── utils.ts               # Tailwind 類名合併函數
│   │   └── tournament/            # 瑞士制、小組賽、淘汰賽、晉級演算法引擎
│   └── types/
│       └── index.ts               # 全域 TypeScript 型別定義
├── tailwind.config.ts             # 動漫電競色票、動畫與陰影配置
├── package.json
└── README.md
```

---

## 🚀 快速開始指南

### 1. 環境需求
- **Node.js**: v18.17.0 以上（本機環境已配有 Node.js LTS v24）
- **npm**: 10.x 或 11.x

### 2. 安裝依賴
```bash
npm install
```

### 3. 初始化資料庫與產生 Prisma Client
```bash
# 同步 schema 到 SQLite 資料庫
npm run db:push
```

### 4. 填充測試賽事與預設帳號（可選）
```bash
# 執行展示資料填充腳本
npx tsx scripts/seed.ts
```

### 5. 啟動本機開發伺服器
```bash
npm run dev
```
啟動後打開瀏覽器訪問：**[http://localhost:3000](http://localhost:3000)**

---

## 👤 預設示範帳號名單

執行 `scripts/seed.ts` 後，已預先建立以下帳號供直接測試：

| 帳號類型 | 學號 (Student ID) | 預設密碼 | 競賽暱稱 | 權限角色 | 說明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **系統管理員** | `A11200001` | `password123` | **AlphaMaster** | `admin` | 可建立比賽、一鍵開賽、推進輪次、覆寫爭議比分、指派管理員 |
| **參賽選手 1** | `B11200002` | `password123` | **ShadowKnight** | `player` | 已完賽場次選手 |
| **參賽選手 2** | `B11200003` | `password123` | **QueenGambit** | `player` | 和局場次選手 |
| **參賽選手 3** | `B11200004` | `password123` | **BishopStorm** | `player` | 和局場次選手 |
| **參賽選手 4** | `B11200005` | `password123` | **RookMaster** | `player` | **第 1 輪對局進行中，可用此帳號登入體驗登記比分！** |
| **參賽選手 5** | `B11200006` | `password123` | **PawnPusher** | `player` | 第 1 輪進行中黑方選手 |

---

## 🎯 測試情境與功能驗收路徑

### 情境 A：選手登記比分與雙向自動同步
1. 前往 [`/login`](http://localhost:3000/login)，輸入學號 `B11200005` / 密碼 `password123` 登入。
2. 進入「賽事專區」➔ 點選「2026 第一屆校際盃西洋棋春季錦標賽」。
3. 找到第 3 場對局（白方 `RookMaster` vs 黑方 `PawnPusher`，狀態為進行中）。
4. 點擊「**登記比分**」➔ 選擇【**我方勝利**】。
5. **觀察結果**：
   - 該場對局立即轉為「已確認完賽」，狀態鎖定，選手無法再次修改。
   - 白方成績標記為勝利（1.0 分），黑方自動連動標記為敗北（0.0 分）。
   - 切換至「即時積分排行榜」，`RookMaster` 積分即時更新為 1.0 分。

### 情境 B：管理員推進輪次與啟動單淘汰複賽
1. 前往 [`/login`](http://localhost:3000/login)，輸入學號 `A11200001` / 密碼 `password123` 登入。
2. 進入上述比賽頁面，此時頂部將出現專屬 **Admin 控制列**。
3. 點擊「**推進下一輪**」：系統驗證當前輪次已全部完賽，自動計算最新積分並依照防重複原則生成第 2 輪全新對戰！
4. 點擊「**啟動複賽 (Top 4)**」：系統自動擷取前 4 名選手進入單淘汰複賽，切換至「單淘汰晉級樹狀圖」即可看見標準 Bracket 對戰圖。

### 情境 C：管理員強制覆寫爭議比分
1. 管理員於任意場次點擊右下角的盾牌圖示（管理員覆寫）。
2. 可直接切換為「管理員模式」，任意強制指定白方與黑方成績（如改成雙方和局）。
3. 提交後系統自動更正場次並重新連鎖計算兩位選手的積分排行榜！

### 情境 D：後台角色權限指派
1. 管理員點擊頂部導航列的「**管理後台**」（或造訪 [`/admin/users`](http://localhost:3000/admin/users)）。
2. 可查看全校註冊選手名單，點擊「提升為 Admin」可將選手晉升為管理員；點擊「拔除 Admin」可將管理員降為選手。

---

## 🧪 自動化測試套件

專案內建完整的單元測試與端對端邏輯檢驗，可隨時執行驗證：

```bash
# 1. 測試資料庫連線與基本操作
npx tsx scripts/test-db.ts

# 2. 測試瑞士制、小組循環、單淘汰樹狀圖與複賽切取演算法
npx tsx scripts/test-engine.ts

# 3. 測試註冊唯一性、密碼雜湊、首位 Admin 晉升與角色修改
npx tsx scripts/test-auth.ts

# 4. 測試雙向比分同步推導、積分重算、爭議覆寫與勝者自動晉級
npx tsx scripts/test-reporting.ts
```

---

## 📜 專案技術規格總結

- **支援賽制**：瑞士制 (Swiss-System)、小組單循環 (Round Robin)、單淘汰賽 (Single Elimination)、初賽轉複賽 (Playoff Top Cut)。
- **後端架構**：Next.js App Router Route Handlers + Prisma 事務交易處理 (`$transaction`)。
- **前端風格**：動漫電競幾何斜角、霓虹暗色調、手機專屬 Drawer 與底欄導航。
- **數據完整性**：外鍵級聯保護、等冪式積分重算、狀態機防呆鎖定。

© 2026 CHESS ARENA. All Rights Reserved.


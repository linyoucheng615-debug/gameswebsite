import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { recalculateTournamentScores } from "../src/lib/tournament/matchService";

const prisma = new PrismaClient();

async function seedCompleted() {
  console.log("== Seeding Multi-Discipline Showcase Tournaments ==");

  // Clean existing matches and tournaments for fresh pristine showcase
  await prisma.match.deleteMany({});
  await prisma.tournamentParticipant.deleteMany({});
  await prisma.tournament.deleteMany({});
  console.log("✔ Cleaned previous tournaments and matches");

  const pwd = await hashPassword("password123");

  // Ensure 8 users exist with competitive nicknames
  const userDefs = [
    { studentId: "A11200001", name: "林管理員", nickname: "AlphaMaster", role: "admin" },
    { studentId: "B11200002", name: "王小明", nickname: "ShadowKnight", role: "player" },
    { studentId: "B11200003", name: "陳美美", nickname: "QueenGambit", role: "player" },
    { studentId: "B11200004", name: "李大同", nickname: "BishopStorm", role: "player" },
    { studentId: "B11200005", name: "張阿華", nickname: "RookMaster", role: "player" },
    { studentId: "B11200006", name: "黃冠宇", nickname: "PawnPusher", role: "player" },
    { studentId: "B11200007", name: "林思齊", nickname: "KnightRider", role: "player" },
    { studentId: "B11200008", name: "周天豪", nickname: "CastleKing", role: "player" },
  ];

  const users: Record<string, any> = {};
  for (const def of userDefs) {
    const u = await prisma.user.upsert({
      where: { studentId: def.studentId },
      update: { nickname: def.nickname, name: def.name, role: def.role },
      create: {
        studentId: def.studentId,
        name: def.name,
        nickname: def.nickname,
        role: def.role,
        passwordHash: pwd,
      },
    });
    users[def.nickname] = u;
  }

  const admin = users["AlphaMaster"];

  // =========================================================================
  // Tournament 1: 🎮 2026 VALORANT 校際特戰先鋒公開賽 (瑞士制 + 4強單淘汰 - 已完賽)
  // =========================================================================
  console.log("\n[1/4] Generating Esports: VALORANT Swiss + Playoff Tournament...");
  const t1 = await prisma.tournament.create({
    data: {
      name: "2026 VALORANT 校際特戰先鋒大師賽",
      description: "本屆特戰先鋒冬季邀請賽共計 3 輪瑞士初賽，前 4 強戰隊晉級單淘汰準決賽與冠軍爭霸！AlphaMaster 勇奪冠軍！",
      category: "esports",
      format: "swiss",
      status: "completed",
      currentRound: 3,
      totalRounds: 3,
      topCut: 4,
      createdBy: admin.id,
      participants: {
        create: [
          { userId: users["AlphaMaster"].id, seed: 1, currentScore: 5.0 },
          { userId: users["QueenGambit"].id, seed: 2, currentScore: 3.0 },
          { userId: users["BishopStorm"].id, seed: 3, currentScore: 2.0 },
          { userId: users["RookMaster"].id, seed: 4, currentScore: 1.5 },
          { userId: users["ShadowKnight"].id, seed: 5, currentScore: 1.0 },
          { userId: users["PawnPusher"].id, seed: 6, currentScore: 0.5 },
        ],
      },
    },
  });

  // Swiss Preliminary Matches
  await prisma.match.createMany({
    data: [
      // Round 1
      { tournamentId: t1.id, round: 1, stage: "preliminary", player1Id: users["AlphaMaster"].id, player2Id: users["ShadowKnight"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t1.id, round: 1, stage: "preliminary", player1Id: users["QueenGambit"].id, player2Id: users["BishopStorm"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t1.id, round: 1, stage: "preliminary", player1Id: users["RookMaster"].id, player2Id: users["PawnPusher"].id, player1Result: "draw", player2Result: "draw", status: "finished" },
      // Round 2
      { tournamentId: t1.id, round: 2, stage: "preliminary", player1Id: users["AlphaMaster"].id, player2Id: users["QueenGambit"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t1.id, round: 2, stage: "preliminary", player1Id: users["BishopStorm"].id, player2Id: users["RookMaster"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t1.id, round: 2, stage: "preliminary", player1Id: users["ShadowKnight"].id, player2Id: users["PawnPusher"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      // Round 3
      { tournamentId: t1.id, round: 3, stage: "preliminary", player1Id: users["AlphaMaster"].id, player2Id: users["BishopStorm"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t1.id, round: 3, stage: "preliminary", player1Id: users["QueenGambit"].id, player2Id: users["ShadowKnight"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t1.id, round: 3, stage: "preliminary", player1Id: users["RookMaster"].id, player2Id: users["PawnPusher"].id, player1Result: "win", player2Result: "loss", status: "finished" },
    ],
  });

  // Playoff Matches (Top 4)
  await prisma.match.createMany({
    data: [
      // Semifinals
      { tournamentId: t1.id, round: 1, stage: "playoff", bracketPosition: 1, player1Id: users["AlphaMaster"].id, player2Id: users["RookMaster"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t1.id, round: 1, stage: "playoff", bracketPosition: 2, player1Id: users["QueenGambit"].id, player2Id: users["BishopStorm"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      // Grand Finals
      { tournamentId: t1.id, round: 2, stage: "playoff", bracketPosition: 1, player1Id: users["AlphaMaster"].id, player2Id: users["QueenGambit"].id, player1Result: "win", player2Result: "loss", status: "finished" },
    ],
  });

  await recalculateTournamentScores(t1.id);
  console.log("✔ Created Tournament 1 (Esports: VALORANT Swiss + Playoff Completed)");

  // =========================================================================
  // Tournament 2: 🏓 2026 全國大專盃羽球雙打單循環公開賽 (分組循環賽 - 已完賽)
  // =========================================================================
  console.log("\n[2/4] Generating Sports: Badminton Group Stage Round Robin Tournament...");
  const t2 = await prisma.tournament.create({
    data: {
      name: "2026 全國大專盃羽球雙打單循環公開賽",
      description: "分為 Group A 與 Group B 展開單循環排程激戰，主客場自動輪轉，QueenGambit 與 ShadowKnight 分奪組別冠軍！",
      category: "sports",
      format: "round_robin",
      status: "completed",
      currentRound: 3,
      totalRounds: 3,
      topCut: 4,
      createdBy: admin.id,
      participants: {
        create: [
          // Group A
          { userId: users["QueenGambit"].id, groupName: "Group A", seed: 1, currentScore: 3.0 },
          { userId: users["AlphaMaster"].id, groupName: "Group A", seed: 3, currentScore: 2.0 },
          { userId: users["KnightRider"].id, groupName: "Group A", seed: 5, currentScore: 1.0 },
          { userId: users["CastleKing"].id, groupName: "Group A", seed: 7, currentScore: 0.0 },
          // Group B
          { userId: users["ShadowKnight"].id, groupName: "Group B", seed: 2, currentScore: 2.5 },
          { userId: users["BishopStorm"].id, groupName: "Group B", seed: 4, currentScore: 2.0 },
          { userId: users["RookMaster"].id, groupName: "Group B", seed: 6, currentScore: 1.0 },
          { userId: users["PawnPusher"].id, groupName: "Group B", seed: 8, currentScore: 0.5 },
        ],
      },
    },
  });

  await prisma.match.createMany({
    data: [
      // Group A
      { tournamentId: t2.id, round: 1, stage: "preliminary", groupName: "Group A", player1Id: users["QueenGambit"].id, player2Id: users["CastleKing"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 1, stage: "preliminary", groupName: "Group A", player1Id: users["AlphaMaster"].id, player2Id: users["KnightRider"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 2, stage: "preliminary", groupName: "Group A", player1Id: users["QueenGambit"].id, player2Id: users["KnightRider"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 2, stage: "preliminary", groupName: "Group A", player1Id: users["AlphaMaster"].id, player2Id: users["CastleKing"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 3, stage: "preliminary", groupName: "Group A", player1Id: users["QueenGambit"].id, player2Id: users["AlphaMaster"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 3, stage: "preliminary", groupName: "Group A", player1Id: users["KnightRider"].id, player2Id: users["CastleKing"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      // Group B
      { tournamentId: t2.id, round: 1, stage: "preliminary", groupName: "Group B", player1Id: users["ShadowKnight"].id, player2Id: users["PawnPusher"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 1, stage: "preliminary", groupName: "Group B", player1Id: users["BishopStorm"].id, player2Id: users["RookMaster"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 2, stage: "preliminary", groupName: "Group B", player1Id: users["ShadowKnight"].id, player2Id: users["RookMaster"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 2, stage: "preliminary", groupName: "Group B", player1Id: users["BishopStorm"].id, player2Id: users["PawnPusher"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t2.id, round: 3, stage: "preliminary", groupName: "Group B", player1Id: users["ShadowKnight"].id, player2Id: users["BishopStorm"].id, player1Result: "draw", player2Result: "draw", status: "finished" },
      { tournamentId: t2.id, round: 3, stage: "preliminary", groupName: "Group B", player1Id: users["RookMaster"].id, player2Id: users["PawnPusher"].id, player1Result: "win", player2Result: "loss", status: "finished" },
    ],
  });

  await recalculateTournamentScores(t2.id);
  console.log("✔ Created Tournament 2 (Sports: Badminton Round Robin Completed)");

  // =========================================================================
  // Tournament 3: ♟️ 2026 頂尖棋王西洋棋巔峰錦標賽 (標準8強單淘汰 - 已完賽)
  // =========================================================================
  console.log("\n[3/4] Generating Mind Sports: Chess 8-Player Knockout Tournament...");
  const t3 = await prisma.tournament.create({
    data: {
      name: "2026 頂尖棋王西洋棋巔峰錦標賽",
      description: "集結 8 位頂尖種子棋手進行一戰定生死單敗淘汰賽！全程連環廝殺，ShadowKnight 加冕王座！",
      category: "chess",
      format: "single_elimination",
      status: "completed",
      currentRound: 3,
      totalRounds: 3,
      topCut: 8,
      createdBy: admin.id,
      participants: {
        create: [
          { userId: users["ShadowKnight"].id, seed: 1, currentScore: 3.0 },
          { userId: users["QueenGambit"].id, seed: 2, currentScore: 2.0 },
          { userId: users["AlphaMaster"].id, seed: 3, currentScore: 1.0 },
          { userId: users["BishopStorm"].id, seed: 4, currentScore: 1.0 },
          { userId: users["RookMaster"].id, seed: 5, currentScore: 0.0 },
          { userId: users["KnightRider"].id, seed: 6, currentScore: 0.0 },
          { userId: users["CastleKing"].id, seed: 7, currentScore: 0.0 },
          { userId: users["PawnPusher"].id, seed: 8, currentScore: 0.0 },
        ],
      },
    },
  });

  await prisma.match.createMany({
    data: [
      // Quarterfinals
      { tournamentId: t3.id, round: 1, stage: "preliminary", bracketPosition: 1, player1Id: users["ShadowKnight"].id, player2Id: users["PawnPusher"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t3.id, round: 1, stage: "preliminary", bracketPosition: 2, player1Id: users["BishopStorm"].id, player2Id: users["RookMaster"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t3.id, round: 1, stage: "preliminary", bracketPosition: 3, player1Id: users["AlphaMaster"].id, player2Id: users["CastleKing"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t3.id, round: 1, stage: "preliminary", bracketPosition: 4, player1Id: users["QueenGambit"].id, player2Id: users["KnightRider"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      // Semifinals
      { tournamentId: t3.id, round: 2, stage: "preliminary", bracketPosition: 1, player1Id: users["ShadowKnight"].id, player2Id: users["BishopStorm"].id, player1Result: "win", player2Result: "loss", status: "finished" },
      { tournamentId: t3.id, round: 2, stage: "preliminary", bracketPosition: 2, player1Id: users["AlphaMaster"].id, player2Id: users["QueenGambit"].id, player1Result: "loss", player2Result: "win", status: "finished" },
      // Grand Finals
      { tournamentId: t3.id, round: 3, stage: "preliminary", bracketPosition: 1, player1Id: users["ShadowKnight"].id, player2Id: users["QueenGambit"].id, player1Result: "win", player2Result: "loss", status: "finished" },
    ],
  });

  await recalculateTournamentScores(t3.id);
  console.log("✔ Created Tournament 3 (Chess: 8-Player Knockout Completed)");

  // =========================================================================
  // Tournament 4: 🃏 2026 寶可夢卡牌 (PTCG) 全國積分春季賽 (瑞士制 - 進行中)
  // =========================================================================
  console.log("\n[4/4] Generating TCG: Pokemon PTCG Swiss Ongoing Tournament...");
  const t4 = await prisma.tournament.create({
    data: {
      name: "2026 寶可夢卡牌 (PTCG) 全國積分春季賽",
      description: "全台訓練家同台競技！目前進入第 2 輪瑞士制對局，選手可即時登記藍方/紅方比分戰績！",
      category: "tcg",
      format: "swiss",
      status: "ongoing",
      currentRound: 2,
      totalRounds: 3,
      topCut: 4,
      createdBy: admin.id,
      participants: {
        create: [
          { userId: users["AlphaMaster"].id, seed: 1, currentScore: 1.0 },
          { userId: users["ShadowKnight"].id, seed: 2, currentScore: 1.0 },
          { userId: users["QueenGambit"].id, seed: 3, currentScore: 1.0 },
          { userId: users["BishopStorm"].id, seed: 4, currentScore: 0.0 },
          { userId: users["RookMaster"].id, seed: 5, currentScore: 0.0 },
          { userId: users["KnightRider"].id, seed: 6, currentScore: 0.0 },
        ],
      },
    },
  });

  // Round 1 finished
  await prisma.match.createMany({
    data: [
      { tournamentId: t4.id, round: 1, stage: "preliminary", player1Id: users["AlphaMaster"].id, player2Id: users["BishopStorm"].id, player1Result: "win", player2Result: "loss", status: "finished", reportedBy: admin.id, reportedAt: new Date() },
      { tournamentId: t4.id, round: 1, stage: "preliminary", player1Id: users["ShadowKnight"].id, player2Id: users["RookMaster"].id, player1Result: "win", player2Result: "loss", status: "finished", reportedBy: admin.id, reportedAt: new Date() },
      { tournamentId: t4.id, round: 1, stage: "preliminary", player1Id: users["QueenGambit"].id, player2Id: users["KnightRider"].id, player1Result: "win", player2Result: "loss", status: "finished", reportedBy: admin.id, reportedAt: new Date() },
      // Round 2 pending (interactive for testing!)
      { tournamentId: t4.id, round: 2, stage: "preliminary", player1Id: users["AlphaMaster"].id, player2Id: users["ShadowKnight"].id, player1Result: null, player2Result: null, status: "pending" },
      { tournamentId: t4.id, round: 2, stage: "preliminary", player1Id: users["QueenGambit"].id, player2Id: users["BishopStorm"].id, player1Result: null, player2Result: null, status: "pending" },
      { tournamentId: t4.id, round: 2, stage: "preliminary", player1Id: users["RookMaster"].id, player2Id: users["KnightRider"].id, player1Result: null, player2Result: null, status: "pending" },
    ],
  });

  await recalculateTournamentScores(t4.id);
  console.log("✔ Created Tournament 4 (TCG: Pokemon PTCG Swiss Ongoing)");

  console.log("\n==================================================");
  console.log("🎉 ALL 4 DIVERSE MULTI-DISCIPLINE TOURNAMENTS SEEDED!");
  console.log("==================================================");
}

seedCompleted()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

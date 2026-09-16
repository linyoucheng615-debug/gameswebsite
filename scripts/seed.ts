import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";
import { recalculateTournamentScores } from "../src/lib/tournament/matchService";

const prisma = new PrismaClient();

async function seed() {
  console.log("== Seeding Demonstration Data ==");

  // Clean existing data
  await prisma.match.deleteMany({});
  await prisma.tournamentParticipant.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});

  const pwd = await hashPassword("password123");

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      studentId: "A11200001",
      name: "林管理員",
      nickname: "AlphaMaster",
      role: "admin",
      passwordHash: pwd,
    },
  });

  const players = [];
  const playerInfos = [
    { studentId: "B11200002", name: "王小明", nickname: "ShadowKnight" },
    { studentId: "B11200003", name: "陳美美", nickname: "QueenGambit" },
    { studentId: "B11200004", name: "李大同", nickname: "BishopStorm" },
    { studentId: "B11200005", name: "張阿華", nickname: "RookMaster" },
    { studentId: "B11200006", name: "黃冠宇", nickname: "PawnPusher" },
  ];

  for (const info of playerInfos) {
    const p = await prisma.user.create({
      data: {
        studentId: info.studentId,
        name: info.name,
        nickname: info.nickname,
        role: "player",
        passwordHash: pwd,
      },
    });
    players.push(p);
  }

  console.log("✔ Created 1 Admin and 5 Players (Password: password123)");

  // 2. Create Tournament 1: Swiss Ongoing
  const swissTourney = await prisma.tournament.create({
    data: {
      name: "2026 第一屆校際盃西洋棋春季錦標賽",
      description: "採用標準瑞士積分制，初賽共 3 輪。前 4 名選手將自動晉級單敗淘汰複賽爭奪冠軍！",
      format: "swiss",
      status: "ongoing",
      currentRound: 1,
      totalRounds: 3,
      topCut: 4,
      createdBy: admin.id,
      participants: {
        create: [
          { userId: admin.id, seed: 1, currentScore: 0 },
          { userId: players[0].id, seed: 2, currentScore: 0 },
          { userId: players[1].id, seed: 3, currentScore: 0 },
          { userId: players[2].id, seed: 4, currentScore: 0 },
          { userId: players[3].id, seed: 5, currentScore: 0 },
          { userId: players[4].id, seed: 6, currentScore: 0 },
        ],
      },
    },
  });

  // Create Round 1 matches for Swiss
  // Match 1: AlphaMaster vs ShadowKnight -> Finished, AlphaMaster win
  await prisma.match.create({
    data: {
      tournamentId: swissTourney.id,
      round: 1,
      stage: "preliminary",
      player1Id: admin.id,
      player2Id: players[0].id,
      player1Result: "win",
      player2Result: "loss",
      status: "finished",
      reportedBy: admin.id,
      reportedAt: new Date(),
    },
  });

  // Match 2: QueenGambit vs BishopStorm -> Finished, Draw
  await prisma.match.create({
    data: {
      tournamentId: swissTourney.id,
      round: 1,
      stage: "preliminary",
      player1Id: players[1].id,
      player2Id: players[2].id,
      player1Result: "draw",
      player2Result: "draw",
      status: "finished",
      reportedBy: players[1].id,
      reportedAt: new Date(),
    },
  });

  // Match 3: RookMaster vs PawnPusher -> Pending! (Ready for reporting in UI)
  await prisma.match.create({
    data: {
      tournamentId: swissTourney.id,
      round: 1,
      stage: "preliminary",
      player1Id: players[3].id,
      player2Id: players[4].id,
      status: "pending",
    },
  });

  await recalculateTournamentScores(swissTourney.id);
  console.log("✔ Created Swiss Tournament with Round 1 matches (1 pending ready for reporting)");

  // 3. Create Tournament 2: Open for Join
  await prisma.tournament.create({
    data: {
      name: "秋季校園新手盃分組單循環賽",
      description: "歡迎各系所西洋棋同好報名，分組循環切磋棋藝，取各組前 2 名晉級四強決賽。",
      format: "round_robin",
      status: "pending",
      currentRound: 0,
      totalRounds: 3,
      topCut: 4,
      createdBy: admin.id,
      participants: {
        create: [
          { userId: players[0].id, seed: 1, currentScore: 0 },
          { userId: players[1].id, seed: 2, currentScore: 0 },
        ],
      },
    },
  });
  console.log("✔ Created pending tournament open for join");

  console.log("🎉 Seed finished successfully!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


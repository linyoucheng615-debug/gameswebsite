import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("== Testing Prisma SQLite Connection ==");
  
  // Clean test records if any
  await prisma.match.deleteMany({});
  await prisma.tournamentParticipant.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create First Admin User
  const admin = await prisma.user.create({
    data: {
      studentId: "A112001",
      name: "管理員一號",
      nickname: "AlphaMaster",
      role: "admin",
      passwordHash: "test_hashed_pwd",
    },
  });
  console.log("✔ Admin User created:", admin.name, "Role:", admin.role);

  // 2. Create Player User
  const player = await prisma.user.create({
    data: {
      studentId: "B112002",
      name: "選手二號",
      nickname: "KnightRider",
      role: "player",
      passwordHash: "test_hashed_pwd",
    },
  });
  console.log("✔ Player User created:", player.name, "Role:", player.role);

  // 3. Create Tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: "2026 第一屆校際盃西洋棋大獎賽",
      format: "swiss",
      status: "pending",
      topCut: 4,
      totalRounds: 3,
      createdBy: admin.id,
      participants: {
        create: [
          { userId: admin.id, seed: 1, currentScore: 0 },
          { userId: player.id, seed: 2, currentScore: 0 },
        ],
      },
    },
    include: {
      participants: {
        include: { user: true },
      },
    },
  });
  console.log("✔ Tournament created:", tournament.name, "Participants count:", tournament.participants.length);

  // 4. Create Match
  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      stage: "preliminary",
      player1Id: admin.id,
      player2Id: player.id,
      status: "pending",
    },
  });
  console.log("✔ Match created: Round", match.round, "Status:", match.status);

  // Clean test records after verification
  await prisma.match.deleteMany({});
  await prisma.tournamentParticipant.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✔ Database schema & Prisma connection test PASSED!");
}

main()
  .catch((e) => {
    console.error("❌ Prisma test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


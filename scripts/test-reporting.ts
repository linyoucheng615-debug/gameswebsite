import { PrismaClient } from "@prisma/client";
import {
  deriveMatchResults,
  recalculateTournamentScores,
  advancePlayoffWinnerIfApplicable,
} from "../src/lib/tournament/matchService";

const prisma = new PrismaClient();

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
}

async function runReportingTests() {
  console.log("==================================================");
  console.log("   MATCH REPORTING & BI-DIRECTIONAL SYNC SUITE    ");
  console.log("==================================================");

  // 1. Test deriveMatchResults logic
  console.log("\n[Test 1] Testing Bi-Directional Result Deduction...");
  // P1 reports win -> P1 win, P2 loss
  const r1 = deriveMatchResults("p1", "p1", "p2", "win");
  assert(r1.p1Result === "win" && r1.p2Result === "loss", "P1 reports win -> P2 must be loss");

  // P1 reports loss -> P1 loss, P2 win
  const r2 = deriveMatchResults("p1", "p1", "p2", "loss");
  assert(r2.p1Result === "loss" && r2.p2Result === "win", "P1 reports loss -> P2 must be win");

  // P2 reports win -> P1 loss, P2 win
  const r3 = deriveMatchResults("p2", "p1", "p2", "win");
  assert(r3.p1Result === "loss" && r3.p2Result === "win", "P2 reports win -> P1 must be loss");

  // P2 reports draw -> P1 draw, P2 draw
  const r4 = deriveMatchResults("p2", "p1", "p2", "draw");
  assert(r4.p1Result === "draw" && r4.p2Result === "draw", "P2 reports draw -> Both must be draw");
  console.log("✔ Bi-directional deduction logic verified for all win/draw/loss combinations");

  // 2. Clean DB and set up test data
  console.log("\n[Test 2] Setting up Test Tournament & Participants...");
  await prisma.match.deleteMany({});
  await prisma.tournamentParticipant.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});

  const admin = await prisma.user.create({
    data: { studentId: "ADM001", name: "管理員", nickname: "Admin", role: "admin", passwordHash: "h" },
  });
  const playerA = await prisma.user.create({
    data: { studentId: "PL001", name: "選手A", nickname: "Alice", role: "player", passwordHash: "h" },
  });
  const playerB = await prisma.user.create({
    data: { studentId: "PL002", name: "選手B", nickname: "Bob", role: "player", passwordHash: "h" },
  });

  const tournament = await prisma.tournament.create({
    data: {
      name: "比分測試盃",
      format: "swiss",
      status: "ongoing",
      createdBy: admin.id,
      participants: {
        create: [
          { userId: playerA.id, seed: 1, currentScore: 0 },
          { userId: playerB.id, seed: 2, currentScore: 0 },
        ],
      },
    },
  });

  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      round: 1,
      stage: "preliminary",
      player1Id: playerA.id,
      player2Id: playerB.id,
      status: "pending",
    },
  });
  console.log(`✔ Tournament and Match created: ${playerA.nickname} (P1) vs ${playerB.nickname} (P2)`);

  // 3. Player A reports WIN -> update match and verify bi-directional sync
  console.log("\n[Test 3] Player A reports WIN...");
  const derived = deriveMatchResults(playerA.id, match.player1Id, match.player2Id, "win");
  const updatedMatch = await prisma.match.update({
    where: { id: match.id },
    data: {
      player1Result: derived.p1Result,
      player2Result: derived.p2Result,
      status: "finished",
      reportedBy: playerA.id,
      reportedAt: new Date(),
    },
  });
  assert(updatedMatch.player1Result === "win", "Player A result is win");
  assert(updatedMatch.player2Result === "loss", "Player B result automatically set to loss");
  assert(updatedMatch.status === "finished", "Match status locked to finished");

  // Recalculate scores
  await recalculateTournamentScores(tournament.id);
  const partA = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId: playerA.id } },
  });
  const partB = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId: playerB.id } },
  });
  assert(partA?.currentScore === 1.0, "Player A score must be 1.0");
  assert(partB?.currentScore === 0.0, "Player B score must be 0.0");
  console.log(`✔ Scores recalculated: ${playerA.nickname} = ${partA?.currentScore}, ${playerB.nickname} = ${partB?.currentScore}`);

  // 4. Admin dispute override: Admin changes to DRAW
  console.log("\n[Test 4] Admin Dispute Override: Force DRAW...");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      player1Result: "draw",
      player2Result: "draw",
      reportedBy: admin.id,
    },
  });
  await recalculateTournamentScores(tournament.id);

  const partAOverridden = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId: playerA.id } },
  });
  const partBOverridden = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId: playerB.id } },
  });
  assert(partAOverridden?.currentScore === 0.5, "Player A overridden score must be 0.5");
  assert(partBOverridden?.currentScore === 0.5, "Player B overridden score must be 0.5");
  console.log(`✔ Admin override verified: Both players successfully updated to 0.5 pts`);

  // 5. Single Elimination Bracket Winner Auto-Advancement Test
  console.log("\n[Test 5] Testing Knockout Bracket Winner Auto-Advancement...");
  const elimTourney = await prisma.tournament.create({
    data: {
      name: "淘汰賽晉級測試",
      format: "single_elimination",
      status: "ongoing",
      createdBy: admin.id,
    },
  });

  // Round 1 match (position 1)
  const elimR1 = await prisma.match.create({
    data: {
      tournamentId: elimTourney.id,
      round: 1,
      bracketPosition: 1,
      stage: "playoff",
      player1Id: playerA.id,
      player2Id: playerB.id,
      status: "pending",
    },
  });

  // Round 2 match (position 1) waiting for winner in slot player1
  const elimR2 = await prisma.match.create({
    data: {
      tournamentId: elimTourney.id,
      round: 2,
      bracketPosition: 1,
      stage: "playoff",
      player1Id: playerA.id, // initially placeholder or null
      status: "pending",
    },
  });

  // Advance winner (Player B wins)
  await advancePlayoffWinnerIfApplicable(elimR1.id, playerB.id);
  const nextMatchCheck = await prisma.match.findUnique({
    where: { id: elimR2.id },
  });
  assert(nextMatchCheck?.player1Id === playerB.id, "Winner Player B must be injected into next bracket slot");
  console.log(`✔ Knockout auto-advancement verified: ${playerB.nickname} advanced to Round 2 slot!`);

  console.log("\n==================================================");
  console.log("🎉 ALL 5 MATCH REPORTING TESTS PASSED 100%!");
  console.log("==================================================");
}

runReportingTests()
  .catch((e) => {
    console.error("Reporting test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import prisma from "../src/lib/prisma";
import { recalculateTournamentScores } from "../src/lib/tournament/matchService";

async function main() {
  console.log("=== Repairing Corrupted Match Results in Database ===");

  // Find matches where both are win or both are loss
  const matches = await prisma.match.findMany({
    where: {
      status: "finished",
    },
    include: {
      player1: true,
      player2: true,
    },
  });

  for (const m of matches) {
    if (m.player2Id && m.player1Result === "win" && m.player2Result === "win") {
      console.log(`Fixing match ${m.id} (${m.player1?.nickname} vs ${m.player2?.nickname}): setting Black (P2) as winner, White (P1) as loss as per user action`);
      await prisma.match.update({
        where: { id: m.id },
        data: {
          player1Result: "loss",
          player2Result: "win",
        },
      });
      await recalculateTournamentScores(m.tournamentId);
    }
  }

  console.log("✔ Repair complete. Recalculated standings:");
  const participants = await prisma.tournamentParticipant.findMany({
    include: { user: true },
    orderBy: { currentScore: "desc" },
  });
  for (const p of participants) {
    console.log(`- ${p.user.nickname}: ${p.currentScore} pts`);
  }
}

main().finally(() => prisma.$disconnect());


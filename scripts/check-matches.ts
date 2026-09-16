import prisma from "../src/lib/prisma";

async function main() {
  const matches = await prisma.match.findMany({
    include: {
      player1: { select: { name: true, nickname: true } },
      player2: { select: { name: true, nickname: true } },
    },
  });

  console.log("=== Current Matches in DB ===");
  for (const m of matches) {
    console.log(
      `[${m.status}] Round ${m.round}: ${m.player1?.nickname} (${m.player1Result}) vs ${m.player2?.nickname} (${m.player2Result})`
    );
  }
}

main().finally(() => prisma.$disconnect());


import {
  generateSwissPairings,
  assignGroups,
  generateRoundRobinSchedule,
  generateEliminationBracket,
  generatePlayoffBracket,
  PlayerRating,
  HistoricalMatch,
} from "../src/lib/tournament";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("  CHESS TOURNAMENT ENGINE ALGORITHM TEST SUITE   ");
  console.log("==================================================");

  // ----------------------------------------------------
  // Test 1: Swiss System Pairing (Round 1 & Round 2)
  // ----------------------------------------------------
  console.log("\n[Test 1] Testing Swiss System Pairing & Duplicate Prevention...");
  const players: PlayerRating[] = [
    { userId: "u1", score: 0, seed: 1, name: "Player 1" },
    { userId: "u2", score: 0, seed: 2, name: "Player 2" },
    { userId: "u3", score: 0, seed: 3, name: "Player 3" },
    { userId: "u4", score: 0, seed: 4, name: "Player 4" },
    { userId: "u5", score: 0, seed: 5, name: "Player 5" },
    { userId: "u6", score: 0, seed: 6, name: "Player 6" },
  ];

  const round1 = generateSwissPairings(players, [], 1);
  assert(round1.length === 3, "Round 1 should generate 3 matches for 6 players");
  console.log("✔ Round 1 pairings generated:", round1.map(m => `${m.player1Id} vs ${m.player2Id}`).join(", "));

  // Simulate Round 1 results: u1, u3, u5 win
  const historyRound1: HistoricalMatch[] = round1.map((m) => ({
    player1Id: m.player1Id,
    player2Id: m.player2Id,
    round: 1,
    status: "finished",
  }));

  // Update scores: winners get 1.0, losers get 0.0
  const updatedPlayers: PlayerRating[] = players.map((p) => {
    if (round1[0].player1Id === p.userId || round1[1].player1Id === p.userId || round1[2].player1Id === p.userId) {
      return { ...p, score: 1.0 };
    }
    return { ...p, score: 0.0 };
  });

  const round2 = generateSwissPairings(updatedPlayers, historyRound1, 2);
  assert(round2.length === 3, "Round 2 should generate 3 matches");

  // Check no duplicates from Round 1
  for (const m2 of round2) {
    const isDuplicate = historyRound1.some(
      (m1) =>
        (m1.player1Id === m2.player1Id && m1.player2Id === m2.player2Id) ||
        (m1.player1Id === m2.player2Id && m1.player2Id === m2.player1Id)
    );
    assert(!isDuplicate, `Duplicate pairing found in Round 2: ${m2.player1Id} vs ${m2.player2Id}`);
  }
  console.log("✔ Round 2 successfully paired non-duplicate players:", round2.map(m => `${m.player1Id} vs ${m.player2Id}`).join(", "));

  // ----------------------------------------------------
  // Test 2: Swiss System Odd Number of Players (BYE Test)
  // ----------------------------------------------------
  console.log("\n[Test 2] Testing Swiss System Odd Players BYE Handling...");
  const oddPlayers: PlayerRating[] = players.slice(0, 5); // 5 players
  const oddRound = generateSwissPairings(oddPlayers, [], 1);
  const byeMatch = oddRound.find((m) => m.player2Id === null);
  assert(!!byeMatch, "Odd players must have 1 BYE match");
  assert(byeMatch!.player1Id === "u5", "Lowest ranked player should receive the first BYE");
  console.log(`✔ BYE successfully assigned to lowest seed: ${byeMatch!.player1Id}`);

  // ----------------------------------------------------
  // Test 3: Round Robin Snake Seeding & Polygon Schedule
  // ----------------------------------------------------
  console.log("\n[Test 3] Testing Round Robin Group Stage & Scheduling...");
  const eightPlayers: PlayerRating[] = [
    { userId: "p1", score: 0, seed: 1 },
    { userId: "p2", score: 0, seed: 2 },
    { userId: "p3", score: 0, seed: 3 },
    { userId: "p4", score: 0, seed: 4 },
    { userId: "p5", score: 0, seed: 5 },
    { userId: "p6", score: 0, seed: 6 },
    { userId: "p7", score: 0, seed: 7 },
    { userId: "p8", score: 0, seed: 8 },
  ];

  const groups = assignGroups(eightPlayers, 2);
  assert(groups.length === 2, "Should create 2 groups");
  assert(groups[0].players.length === 4, "Group A should have 4 players");
  assert(groups[1].players.length === 4, "Group B should have 4 players");

  // Snake seeding check: Group A has seeds 1, 4, 5, 8; Group B has seeds 2, 3, 6, 7
  const groupASeeds = groups[0].players.map((p) => p.seed);
  const groupBSeeds = groups[1].players.map((p) => p.seed);
  assert(JSON.stringify(groupASeeds) === JSON.stringify([1, 4, 5, 8]), "Group A snake seeding match");
  assert(JSON.stringify(groupBSeeds) === JSON.stringify([2, 3, 6, 7]), "Group B snake seeding match");
  console.log("✔ Snake Seeding verified: Group A =", groupASeeds, ", Group B =", groupBSeeds);

  const groupASchedule = generateRoundRobinSchedule(groups[0].players, "Group A");
  // In a 4-player round robin: 3 rounds, 2 matches per round = 6 matches total
  assert(groupASchedule.length === 6, "4-player round robin must have 6 total matches");
  console.log(`✔ Group A Round Robin generated ${groupASchedule.length} matches across 3 rounds`);

  // ----------------------------------------------------
  // Test 4: Single Elimination Bracket Generation
  // ----------------------------------------------------
  console.log("\n[Test 4] Testing Single Elimination Bracket Seeding...");
  const bracket = generateEliminationBracket(eightPlayers);
  assert(bracket.pairings.length === 4, "8-player bracket round 1 must have 4 matches");
  assert(bracket.totalRounds === 3, "8-player bracket has 3 rounds (Quarter, Semi, Final)");

  // Verify classic bracket seeding: [1,8], [4,5], [2,7], [3,6]
  const p1 = bracket.pairings[0];
  const p2 = bracket.pairings[1];
  const p3 = bracket.pairings[2];
  const p4 = bracket.pairings[3];
  assert(p1.player1Id === "p1" && p1.player2Id === "p8", "Match 1 must be Seed 1 vs Seed 8");
  assert(p2.player1Id === "p4" && p2.player2Id === "p5", "Match 2 must be Seed 4 vs Seed 5");
  assert(p3.player1Id === "p2" && p3.player2Id === "p7", "Match 3 must be Seed 2 vs Seed 7");
  assert(p4.player1Id === "p3" && p4.player2Id === "p6", "Match 4 must be Seed 3 vs Seed 6");
  console.log("✔ Bracket Seeds matched: [1 vs 8], [4 vs 5], [2 vs 7], [3 vs 6]");

  // ----------------------------------------------------
  // Test 5: Playoff Qualification & Cut to Bracket
  // ----------------------------------------------------
  console.log("\n[Test 5] Testing Playoff Top Cut Generation...");
  const standings: PlayerRating[] = [
    { userId: "rank1", score: 3.0, seed: 3 },
    { userId: "rank2", score: 2.5, seed: 1 },
    { userId: "rank3", score: 2.0, seed: 4 },
    { userId: "rank4", score: 2.0, seed: 2 },
    { userId: "rank5", score: 1.0, seed: 5 },
  ];

  const playoff = generatePlayoffBracket(standings, 4);
  assert(playoff.qualifiedPlayers.length === 4, "Playoff must qualify exactly 4 players");
  assert(playoff.qualifiedPlayers[0].userId === "rank1", "First qualified is rank1");
  assert(playoff.pairings.length === 2, "Top 4 playoff has 2 semifinal matches");
  assert(playoff.pairings[0].player1Id === "rank1" && playoff.pairings[0].player2Id === "rank4", "Semi 1 is Seed 1 vs Seed 4");
  assert(playoff.pairings[1].player1Id === "rank2" && playoff.pairings[1].player2Id === "rank3", "Semi 2 is Seed 2 vs Seed 3");
  console.log("✔ Playoff Cut 4 correctly paired: [Rank 1 vs Rank 4] and [Rank 2 vs Rank 3]");

  console.log("\n==================================================");
  console.log("🎉 ALL 5 TOURNAMENT ENGINE TESTS PASSED 100%!");
  console.log("==================================================");
}

runTests().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});


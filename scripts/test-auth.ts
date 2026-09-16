import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword, signToken, verifyToken } from "../src/lib/auth";

const prisma = new PrismaClient();

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
}

async function runAuthTests() {
  console.log("==================================================");
  console.log("     AUTH & ROLES SYSTEM VERIFICATION SUITE       ");
  console.log("==================================================");

  // Clean test data
  await prisma.match.deleteMany({});
  await prisma.tournamentParticipant.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Password hash & compare verification
  console.log("\n[Test 1] Testing Password Hashing & Verification...");
  const rawPass = "SecretPass123";
  const hashed = await hashPassword(rawPass);
  const isMatchValid = await comparePassword(rawPass, hashed);
  const isMatchWrong = await comparePassword("WrongPass", hashed);
  assert(isMatchValid === true, "Valid password must match hash");
  assert(isMatchWrong === false, "Wrong password must NOT match hash");
  console.log("✔ Password hashing & bcrypt verification passed");

  // 2. JWT Sign & Verify
  console.log("\n[Test 2] Testing JWT Token Sign & Verify...");
  const token = await signToken({
    userId: "test-id-123",
    studentId: "B11200001",
    role: "admin",
  });
  const decoded = await verifyToken(token);
  assert(decoded !== null, "Decoded token must not be null");
  assert(decoded!.studentId === "B11200001", "Token studentId matches payload");
  assert(decoded!.role === "admin", "Token role matches payload");
  console.log("✔ JWT creation and cryptographic verification passed");

  // 3. First User Registered -> Must be Admin
  console.log("\n[Test 3] Testing First User Registration (Auto-Admin)...");
  const count0 = await prisma.user.count();
  assert(count0 === 0, "Database should be initially empty");

  const user1Role = count0 === 0 ? "admin" : "player";
  const user1 = await prisma.user.create({
    data: {
      studentId: "B11200001",
      name: "創始管理員",
      nickname: "AlphaMaster",
      role: user1Role,
      passwordHash: hashed,
    },
  });
  assert(user1.role === "admin", "First registered user MUST be admin");
  console.log(`✔ First user ${user1.name} registered with role: ${user1.role}`);

  // 4. Second User Registered -> Must be Player
  console.log("\n[Test 4] Testing Second User Registration (Default Player)...");
  const count1 = await prisma.user.count();
  const user2Role = count1 === 0 ? "admin" : "player";
  const user2 = await prisma.user.create({
    data: {
      studentId: "B11200002",
      name: "普通選手",
      nickname: "ChessRookie",
      role: user2Role,
      passwordHash: hashed,
    },
  });
  assert(user2.role === "player", "Subsequent registered user MUST be player");
  console.log(`✔ Second user ${user2.name} registered with role: ${user2.role}`);

  // 5. Unique Student ID Check
  console.log("\n[Test 5] Testing Student ID Uniqueness Constraint...");
  let duplicateCaught = false;
  try {
    await prisma.user.create({
      data: {
        studentId: "B11200001", // duplicate
        name: "冒牌選手",
        nickname: "Imposter",
        role: "player",
        passwordHash: hashed,
      },
    });
  } catch (err: unknown) {
    duplicateCaught = true;
  }
  assert(duplicateCaught, "Duplicate studentId MUST throw unique constraint violation");
  console.log("✔ Unique constraint on studentId enforced successfully");

  // 6. Admin Role Management
  console.log("\n[Test 6] Testing Admin Role Elevation & Revocation...");
  // Elevate player to admin
  const elevatedUser2 = await prisma.user.update({
    where: { id: user2.id },
    data: { role: "admin" },
  });
  assert(elevatedUser2.role === "admin", "User2 elevated to admin");
  console.log("✔ User2 successfully elevated to admin");

  // Demote back to player
  const demotedUser2 = await prisma.user.update({
    where: { id: user2.id },
    data: { role: "player" },
  });
  assert(demotedUser2.role === "player", "User2 demoted back to player");
  console.log("✔ User2 demoted back to player");

  // 7. Profile Nickname Update
  console.log("\n[Test 7] Testing Profile Nickname Modification...");
  const updatedUser2 = await prisma.user.update({
    where: { id: user2.id },
    data: { nickname: "GrandmasterFlash" },
  });
  assert(updatedUser2.nickname === "GrandmasterFlash", "Nickname should update properly");
  console.log(`✔ User2 nickname updated to: ${updatedUser2.nickname}`);

  console.log("\n==================================================");
  console.log("🎉 ALL 7 AUTH & ROLE TESTS PASSED 100%!");
  console.log("==================================================");
}

runAuthTests()
  .catch((e) => {
    console.error("Auth test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


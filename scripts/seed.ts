import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AVATAR_OPTIONS = [
  "pixel-knight",
  "pixel-mage",
  "pixel-ninja",
  "pixel-archer",
  "pixel-paladin",
  "pixel-brawler",
  "pixel-rogue",
  "pixel-valkyrie",
];

const STUDENTS_DATA = [
  { studentNumber: "S101", name: "王小明", phone: "0912-345-101", avatar: "pixel-knight" },
  { studentNumber: "S102", name: "李依婷", phone: "0912-345-102", avatar: "pixel-mage" },
  { studentNumber: "S103", name: "陳俊傑", phone: "0912-345-103", avatar: "pixel-ninja" },
  { studentNumber: "S104", name: "林子晴", phone: "0912-345-104", avatar: "pixel-archer" },
  { studentNumber: "S105", name: "張宇軒", phone: "0912-345-105", avatar: "pixel-paladin" },
  { studentNumber: "S106", name: "郭庭妤", phone: "0912-345-106", avatar: "pixel-valkyrie" },
  { studentNumber: "S107", name: "蔡承恩", phone: "0912-345-107", avatar: "pixel-brawler" },
  { studentNumber: "S108", name: "許家豪", phone: "0912-345-108", avatar: "pixel-rogue" },
  { studentNumber: "S109", name: "楊雅涵", phone: "0912-345-109", avatar: "pixel-mage" },
  { studentNumber: "S110", name: "鄭博文", phone: "0912-345-110", avatar: "pixel-knight" },
  { studentNumber: "S111", name: "謝佩珊", phone: "0912-345-111", avatar: "pixel-archer" },
  { studentNumber: "S112", name: "洪偉哲", phone: "0912-345-112", avatar: "pixel-ninja" },
  { studentNumber: "S113", name: "曾冠廷", phone: "0912-345-113", avatar: "pixel-brawler" },
  { studentNumber: "S114", name: "賴思穎", phone: "0912-345-114", avatar: "pixel-valkyrie" },
  { studentNumber: "S115", name: "邱昱凱", phone: "0912-345-115", avatar: "pixel-paladin" },
  { studentNumber: "S116", name: "周佩欣", phone: "0912-345-116", avatar: "pixel-mage" },
  { studentNumber: "S117", name: "葉信宏", phone: "0912-345-117", avatar: "pixel-knight" },
  { studentNumber: "S118", name: "廖苡彤", phone: "0912-345-118", avatar: "pixel-archer" },
  { studentNumber: "S119", name: "蘇冠宇", phone: "0912-345-119", avatar: "pixel-ninja" },
  { studentNumber: "S120", name: "潘品辰", phone: "0912-345-120", avatar: "pixel-brawler" },
  { studentNumber: "S121", name: "顏少威", phone: "0912-345-121", avatar: "pixel-paladin" },
  { studentNumber: "S122", name: "魏子翔", phone: "0912-345-122", avatar: "pixel-rogue" },
  { studentNumber: "S123", name: "蕭亦宣", phone: "0912-345-123", avatar: "pixel-mage" },
  { studentNumber: "S124", name: "羅敏慈", phone: "0912-345-124", avatar: "pixel-valkyrie" },
  { studentNumber: "S125", name: "莊承翰", phone: "0912-345-125", avatar: "pixel-knight" },
  { studentNumber: "S126", name: "戴羽彤", phone: "0912-345-126", avatar: "pixel-archer" },
  { studentNumber: "S127", name: "簡柏安", phone: "0912-345-127", avatar: "pixel-ninja" },
  { studentNumber: "S128", name: "施詠晴", phone: "0912-345-128", avatar: "pixel-valkyrie" },
  { studentNumber: "S129", name: "柯鈞瀚", phone: "0912-345-129", avatar: "pixel-paladin" },
  { studentNumber: "S130", name: "方千瑜", phone: "0912-345-130", avatar: "pixel-mage" },
];

async function seed() {
  console.log("== 開始重構資料庫種子資料 ==");

  // 清除舊資料
  await prisma.battleMatch.deleteMany({});
  await prisma.examScore.deleteMany({});
  await prisma.homeworkRecord.deleteMany({});
  await prisma.academicWeek.deleteMany({});
  await prisma.student.deleteMany({});

  console.log("✔ 已清理既有資料");

  // 1. 批次建立 30 位小六學生
  const createdStudents = [];
  for (const s of STUDENTS_DATA) {
    const student = await prisma.student.create({
      data: {
        studentNumber: s.studentNumber,
        name: s.name,
        parentPhone: s.phone,
        avatarId: s.avatar,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    });
    createdStudents.push(student);
  }
  console.log(`✔ 成功建立 ${createdStudents.length} 位學生名單 (S101 ~ S130)`);

  // 2. 建立示範週次 (第 1 週)
  const week1 = await prisma.academicWeek.create({
    data: {
      weekNumber: 1,
      title: "小六數學：分數的除法與四則運算",
      deadline: "本週五 18:00 前",
      isSettled: false,
    },
  });
  console.log(`✔ 建立第 1 週：「${week1.title}」`);

  // 3. 建立 30 位學生的作業初始記錄
  // 模擬部分學生缺交或部分完成
  const missingMap: Record<string, { status: "missing" | "partial"; scope: string }> = {
    S104: { status: "missing", scope: "數習 P.24-P.26" },
    S109: { status: "partial", scope: "數習 P.28 第3大題需訂正" },
    S118: { status: "missing", scope: "數練單元一全" },
    S122: { status: "partial", scope: "數習 P.30 應用題兩題" },
    S127: { status: "missing", scope: "數學習作 P.32-P.35" },
  };

  for (const student of createdStudents) {
    const special = missingMap[student.studentNumber];
    if (special) {
      await prisma.homeworkRecord.create({
        data: {
          weekId: week1.id,
          studentId: student.id,
          status: special.status,
          missingScope: special.scope,
          hasBuff: false, // 缺交或部分完成：無護盾加成 (+0)
        },
      });
    } else {
      await prisma.homeworkRecord.create({
        data: {
          weekId: week1.id,
          studentId: student.id,
          status: "completed",
          missingScope: null,
          hasBuff: true, // 已完成：獲得護盾加成 (+5)
        },
      });
    }
  }

  console.log("✔ 已初始化第 1 週 30 位學生之作業登記狀態（含預設完成與示範缺交資料）");
  console.log("== 資料庫種子填充完成！==");
}

seed()
  .catch((e) => {
    console.error("Seed 失敗:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { TimeSlotOption, SlotMatchAnalysis, SlotPeriod } from "@/types";

export const PERIOD_CONFIG: Record<
  SlotPeriod,
  { label: string; timeRange: string; icon: string }
> = {
  morning: { label: "上午時段", timeRange: "09:00 - 12:00", icon: "🌅" },
  afternoon: { label: "下午時段", timeRange: "13:00 - 17:00", icon: "☀️" },
  evening: { label: "晚間黃金時段", timeRange: "18:00 - 21:00", icon: "🌆" },
  night: { label: "深夜電競時段", timeRange: "21:00 - 24:00", icon: "🌙" },
};

export const PERIOD_KEYS: SlotPeriod[] = ["morning", "afternoon", "evening", "night"];

const DAY_NAMES = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

/**
 * 取得下週 (Next Week) 週一至週日的 7 個日期與所有時段選項清單
 * 邏輯：以當前日期為基準，計算下一個星期一至星期日
 */
export function getNextWeekTimeSlots(baseDate: Date = new Date()): TimeSlotOption[] {
  const currentDay = baseDate.getDay(); // 0 is Sunday, 1 is Monday...
  // 計算到下週一的天數
  const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;

  const nextMonday = new Date(baseDate);
  nextMonday.setDate(baseDate.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const slots: TimeSlotOption[] = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(nextMonday);
    targetDate.setDate(nextMonday.getDate() + i);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const date = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${date}`;

    const dayIndex = targetDate.getDay();
    const dayName = DAY_NAMES[dayIndex];
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const dayLabel = `下${dayName} (${month}/${date})`;

    for (const period of PERIOD_KEYS) {
      const pConfig = PERIOD_CONFIG[period];
      const slotId = `${dateStr}-${period}`;

      slots.push({
        id: slotId,
        dateStr,
        dayLabel,
        dayName,
        period,
        periodLabel: `${pConfig.label} (${pConfig.timeRange})`,
        isWeekend,
      });
    }
  }

  return slots;
}

/**
 * 安全解析 JSON 時段陣列
 */
export function parseSlots(slotsJson?: string | null): string[] {
  if (!slotsJson) return [];
  try {
    const parsed = JSON.parse(slotsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 電腦智慧比對雙方空檔演算法
 * 比對 Player 1 與 Player 2 提交的時段，計算交集與個別偏好
 */
export function analyzeMatchSlots(
  p1SlotsJson?: string | null,
  p2SlotsJson?: string | null,
  allSlots?: TimeSlotOption[]
): SlotMatchAnalysis {
  const slotsCatalog = allSlots && allSlots.length > 0 ? allSlots : getNextWeekTimeSlots();
  const slotMap = new Map<string, TimeSlotOption>();
  for (const s of slotsCatalog) {
    slotMap.set(s.id, s);
  }

  const p1Slots = parseSlots(p1SlotsJson);
  const p2Slots = parseSlots(p2SlotsJson);

  const player1Submitted = p1Slots.length > 0;
  const player2Submitted = p2Slots.length > 0;
  const bothSubmitted = player1Submitted && player2Submitted;

  const p1Set = new Set(p1Slots);
  const p2Set = new Set(p2Slots);

  // 計算交集 (Common Overlapping Slots)
  const commonSlotIds = p1Slots.filter((id) => p2Set.has(id));
  const commonSlots = commonSlotIds
    .map((id) => slotMap.get(id))
    .filter((s): s is TimeSlotOption => Boolean(s));

  // 整理詳情
  const player1SlotDetails = p1Slots
    .map((id) => slotMap.get(id))
    .filter((s): s is TimeSlotOption => Boolean(s));

  const player2SlotDetails = p2Slots
    .map((id) => slotMap.get(id))
    .filter((s): s is TimeSlotOption => Boolean(s));

  return {
    player1Submitted,
    player2Submitted,
    bothSubmitted,
    commonSlots,
    hasOverlap: commonSlots.length > 0,
    player1SlotDetails,
    player2SlotDetails,
  };
}

/**
 * 格式化時段顯示標籤
 */
export function formatSlotLabel(slot: TimeSlotOption): string {
  const pConfig = PERIOD_CONFIG[slot.period];
  return `${slot.dayLabel} ${pConfig.icon} ${pConfig.label} ${pConfig.timeRange}`;
}


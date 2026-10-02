export interface NotificationParams {
  studentName: string;
  unitTitle: string;
  missingScope?: string | null;
  deadline: string;
}

/**
 * 模板 A：家長作業提醒通知文字
 */
export function generateParentNotification({
  studentName,
  unitTitle,
  missingScope,
  deadline,
}: NotificationParams): string {
  const scopeText = missingScope && missingScope.trim() ? missingScope.trim() : "指定作業範圍";

  return `【作業提醒通知】
家長您好，我是數學老師。
提醒您，${studentName} 本週的 ${unitTitle}（${scopeText}）尚未繳交完成。
為了讓孩子能跟上後續進度，請協助提醒孩子於 ${deadline} 完成補交與訂正。若有題目不理解的地方，也可提早到班詢問老師，謝謝您的配合！`;
}

/**
 * 批次生成所有未交學生的通知文字，以明確的分隔線合併
 */
export function generateBatchNotifications(
  items: Array<NotificationParams & { studentNumber?: string }>
): string {
  if (items.length === 0) return "目前全班均已繳交完成，無未交學生！";

  return items
    .map((item) => generateParentNotification(item))
    .join("\n\n----------------------------------------\n\n");
}

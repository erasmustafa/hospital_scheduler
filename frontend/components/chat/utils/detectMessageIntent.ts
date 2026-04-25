import type { MessageIntent } from "@/types/chat";

const TASK_KEYWORDS = ["görev", "task", "kontrol et", "tamamla", "incele"];
const REMINDER_KEYWORDS = ["hatırlat", "uyar", "reminder", "yarın", "saat"];
const DECISION_KEYWORDS = ["karar", "onaylandı", "kesinleşti", "uygulanacak"];
const SHIFT_KEYWORDS = ["vardiya", "nöbet", "shift", "mesai"];

function includesKeyword(content: string, keywords: string[]) {
  return keywords.some((keyword) => content.includes(keyword));
}

export default function detectMessageIntent(message: string): MessageIntent {
  const normalized = message.toLocaleLowerCase("tr-TR");

  if (includesKeyword(normalized, SHIFT_KEYWORDS)) {
    return "shift";
  }
  if (includesKeyword(normalized, TASK_KEYWORDS)) {
    return "task";
  }
  if (includesKeyword(normalized, REMINDER_KEYWORDS)) {
    return "reminder";
  }
  if (includesKeyword(normalized, DECISION_KEYWORDS)) {
    return "decision";
  }

  return "general";
}

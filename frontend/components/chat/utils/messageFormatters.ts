export function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMessageDay(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

export function formatRelativeShort(value: string) {
  const date = new Date(value).getTime();
  const diffMinutes = Math.round((Date.now() - date) / 60000);

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)} dk önce`;
  }
  if (diffMinutes < 1440) {
    return `${Math.round(diffMinutes / 60)} sa önce`;
  }
  return `${Math.round(diffMinutes / 1440)} gün önce`;
}

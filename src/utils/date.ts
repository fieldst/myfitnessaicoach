export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function formatDisplayDate(dateKey: string): string {
  const date = new Date(dateKey + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isToday(dateKey: string): boolean {
  return dateKey === getTodayKey();
}

export function dateFromDayNumber(startDate: string, dayNumber: number): string {
  const base = new Date(`${startDate}T00:00:00`);
  base.setDate(base.getDate() + (dayNumber - 1));
  return base.toISOString().slice(0, 10);
}

export function dayNumberFromDate(startDate: string, isoDate: string): number | null {
  const start = new Date(`${startDate}T00:00:00`);
  const current = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return null;
  const diffMs = current.getTime() - start.getTime();
  const dayNumber = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return dayNumber > 0 ? dayNumber : null;
}

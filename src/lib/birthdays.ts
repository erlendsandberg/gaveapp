export type NextBirthday = {
  daysUntil: number;
  date: Date;
  age: number;
  isToday: boolean;
  isSoon: boolean; // within 7 days
};

export function nextBirthday(birthdayStr: string): NextBirthday {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bday = new Date(birthdayStr);
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  const isToday = thisYear.getTime() === today.getTime();
  const isPast = thisYear < today && !isToday;

  const nextDate = isPast
    ? new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate())
    : thisYear;

  const daysUntil = isToday
    ? 0
    : Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const age = nextDate.getFullYear() - bday.getFullYear();

  return {
    daysUntil,
    date: nextDate,
    age,
    isToday,
    isSoon: daysUntil > 0 && daysUntil <= 7,
  };
}

export function formatBirthday(birthdayStr: string): string {
  const d = new Date(birthdayStr);
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
}

export function formatDaysUntil(days: number): string {
  if (days === 0) return "I dag! 🎉";
  if (days === 1) return "I morgen!";
  if (days <= 7) return `Om ${days} dager`;
  if (days < 30) return `Om ${days} dager`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Om 1 uke";
  if (weeks < 8) return `Om ${weeks} uker`;
  const months = Math.floor(days / 30);
  if (months === 1) return "Om 1 måned";
  return `Om ${months} måneder`;
}

export function sortByUpcoming<T extends { birthday: string | null }>(items: T[]): T[] {
  return [...items]
    .filter((i) => i.birthday)
    .sort((a, b) => {
      const da = nextBirthday(a.birthday!).daysUntil;
      const db_ = nextBirthday(b.birthday!).daysUntil;
      return da - db_;
    });
}

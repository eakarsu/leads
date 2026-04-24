// Scheduling utility functions ported from IHSS scheduling engine

export interface TimeWindow {
  start: number; // minutes from midnight
  end: number;
}

export interface Slot {
  start: string; // "HH:MM"
  end: string;
  durationMinutes: number;
}

/**
 * Convert "HH:MM" time string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to "HH:MM" time string
 */
export function minutesToTime(mins: number): string {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Subtract busy intervals from free windows using interval subtraction.
 * Both inputs should be sorted arrays of non-overlapping intervals.
 */
export function subtractIntervals(
  freeWindows: TimeWindow[],
  busyIntervals: TimeWindow[]
): TimeWindow[] {
  const result: TimeWindow[] = [];

  for (const free of freeWindows) {
    let current = free.start;

    for (const busy of busyIntervals) {
      // Skip busy intervals that end before or start after this free window
      if (busy.end <= free.start || busy.start >= free.end) continue;

      // If there's a gap before this busy interval, it's free
      if (busy.start > current) {
        result.push({ start: current, end: Math.min(busy.start, free.end) });
      }

      // Move current past the busy interval
      current = Math.max(current, busy.end);
    }

    // If there's remaining time after all busy intervals
    if (current < free.end) {
      result.push({ start: current, end: free.end });
    }
  }

  return result;
}

/**
 * Break free windows into fixed-duration slots (default 30-min increments)
 */
export function generateSlots(
  freeWindows: TimeWindow[],
  durationMinutes: number,
  incrementMinutes: number = 30
): Slot[] {
  const slots: Slot[] = [];

  for (const window of freeWindows) {
    let slotStart = window.start;
    while (slotStart + durationMinutes <= window.end) {
      slots.push({
        start: minutesToTime(slotStart),
        end: minutesToTime(slotStart + durationMinutes),
        durationMinutes,
      });
      slotStart += incrementMinutes;
    }
  }

  return slots;
}

/**
 * Get the day-of-week operating hours fields for a given date
 */
export function getDayFields(date: Date): { startField: string; endField: string } {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[date.getDay()];
  return {
    startField: `${day}Start`,
    endField: `${day}End`,
  };
}

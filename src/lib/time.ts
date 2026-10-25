import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import type { Block } from './schemas';

export function deadlineInstant(date: string, time: string | null, timezone: string): Date {
  return fromZonedTime(`${date}T${time || '23:59:59'}`, timezone);
}
export function displayDeadline(date: string, time: string | null, timezone: string) {
  return formatInTimeZone(
    deadlineInstant(date, time, timezone),
    timezone,
    time ? 'MMM d, yyyy · h:mm a' : 'MMM d, yyyy · end of day',
  );
}
export function splitAndValidateBlocks(blocks: Block[]): Block[] {
  const normalized: Block[] = [];
  for (const block of blocks) {
    if (block.start_time === block.end_time) throw new Error('Start and end times must differ.');
    if (block.start_time < block.end_time) normalized.push(block);
    else {
      normalized.push({ ...block, end_time: '24:00' });
      if (block.end_time !== '00:00')
        normalized.push({
          weekday: (block.weekday + 1) % 7,
          start_time: '00:00',
          end_time: block.end_time,
        });
    }
  }
  normalized.sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time));
  for (let i = 1; i < normalized.length; i++) {
    const previous = normalized[i - 1],
      current = normalized[i];
    if (previous.weekday === current.weekday && current.start_time < previous.end_time)
      throw new Error(
        'Study blocks overlap. Adjust the highlighted day, including any overnight blocks.',
      );
  }
  return normalized;
}

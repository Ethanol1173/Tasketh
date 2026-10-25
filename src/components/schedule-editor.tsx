'use client';
import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { saveSchedule } from '@/app/actions/workspace';
import type { Availability } from '@/lib/database.types';
import type { Block } from '@/lib/schemas';
import { Feedback, Submit } from './ui';
export const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
export function ScheduleEditor({
  availability,
  timezone,
  onboarding = false,
}: {
  availability: Availability[];
  timezone: string;
  onboarding?: boolean;
}) {
  const [blocks, setBlocks] = useState<(Block & { key: string })[]>(() =>
    availability.map((a) => ({
      key: a.id,
      weekday: a.weekday,
      start_time: a.start_time.slice(0, 5),
      end_time: a.end_time.slice(0, 5),
    })),
  );
  const [copies, setCopies] = useState<Record<number, string>>({});
  const [state, action] = useActionState(saveSchedule, {});
  function add(day: number) {
    setBlocks((b) => [
      ...b,
      { key: crypto.randomUUID(), weekday: day, start_time: '09:00', end_time: '10:00' },
    ]);
  }
  function update(key: string, field: 'start_time' | 'end_time', value: string) {
    setBlocks((b) => b.map((a) => (a.key === key ? { ...a, [field]: value } : a)));
  }
  function copy(day: number) {
    const target = Number(copies[day]);
    if (copies[day] == null || day === target) return;
    setBlocks((previous) => [
      ...previous.filter((b) => b.weekday !== target),
      ...previous
        .filter((b) => b.weekday === day)
        .map((b) => ({ ...b, key: crypto.randomUUID(), weekday: target })),
    ]);
  }
  return (
    <form action={action}>
      <input name="onboarding" type="hidden" value={String(onboarding)} />
      <input
        name="blocks"
        type="hidden"
        value={JSON.stringify(
          blocks.map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time })),
        )}
      />
      <p className="schedule-note">
        Your recurring study windows in <strong>{timezone}</strong>. This is separate from the time
        you have right now. Overnight ranges are split across days when saved. Empty days are fine.
      </p>
      <div className="schedule-grid">
        {dayNames.map((day, index) => (
          <section key={day} className="day-card">
            <div className="row-between">
              <h3>{day}</h3>
              <button
                type="button"
                className="icon-button"
                aria-label={`Add block on ${day}`}
                onClick={() => add(index)}
              >
                <Plus size={16} />
              </button>
            </div>
            {!blocks.some((b) => b.weekday === index) && (
              <p>No study blocks. Keep some breathing room.</p>
            )}
            {blocks
              .filter((b) => b.weekday === index)
              .map((b) => (
                <div className="time-block" key={b.key}>
                  <input
                    type="time"
                    required
                    aria-label={`${day} start time`}
                    value={b.start_time}
                    onChange={(e) => update(b.key, 'start_time', e.target.value)}
                  />
                  <span className="muted">–</span>
                  {b.end_time === '24:00' ? (
                    <select
                      aria-label={`${day} end time`}
                      value={b.end_time}
                      onChange={(e) => update(b.key, 'end_time', e.target.value)}
                    >
                      <option value="24:00">24:00 (day end)</option>
                      <option value="00:00">00:00 (overnight)</option>
                      <option value="23:59">23:59</option>
                    </select>
                  ) : (
                    <input
                      type="time"
                      required
                      aria-label={`${day} end time`}
                      value={b.end_time}
                      onChange={(e) => update(b.key, 'end_time', e.target.value)}
                    />
                  )}
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove ${day} block`}
                    onClick={() => setBlocks((previous) => previous.filter((a) => a.key !== b.key))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            <div className="copy-row">
              <select
                aria-label={`Copy ${day} to`}
                value={copies[index] ?? ''}
                onChange={(e) => setCopies({ ...copies, [index]: e.target.value })}
              >
                <option value="">Copy day to…</option>
                {dayNames.map(
                  (d, i) =>
                    i !== index && (
                      <option value={i} key={d}>
                        {d}
                      </option>
                    ),
                )}
              </select>
              <button
                type="button"
                className="button secondary"
                disabled={copies[index] == null || copies[index] === ''}
                onClick={() => copy(index)}
              >
                Copy
              </button>
            </div>
          </section>
        ))}
      </div>
      <p className="helper" style={{ marginTop: 15 }}>
        Copy replaces the destination day’s unsaved blocks. Ranges cannot overlap, including across
        midnight.
      </p>
      <Feedback state={state} />
      <div className="button-row" style={{ marginTop: 25 }}>
        <Submit>{onboarding ? 'Save & continue' : 'Save weekly schedule'}</Submit>
      </div>
    </form>
  );
}

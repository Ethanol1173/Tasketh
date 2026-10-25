'use client';
import { useActionState, useState } from 'react';
import { saveAssignment, saveCourse } from '@/app/actions/workspace';
import { ActionForm, Feedback, Submit } from './ui';
import type { Assignment, Course } from '@/lib/database.types';
import { assignmentTypes, efforts, labels } from '@/lib/schemas';
export function CourseCreator() {
  return (
    <div className="course-inline">
      <h3>Add a course</h3>
      <ActionForm action={saveCourse} submit="Add course">
        <input
          aria-label="New course name"
          name="name"
          required
          maxLength={100}
          placeholder="e.g. Statistics"
        />
      </ActionForm>
    </div>
  );
}
export function AssignmentForm({
  courses,
  assignment,
  onboarding = false,
  timezone,
}: {
  courses: Course[];
  assignment?: Assignment;
  onboarding?: boolean;
  timezone: string;
}) {
  const [state, action] = useActionState(saveAssignment, {});
  const [estimated, setEstimated] = useState(assignment?.estimated_minutes != null);
  return (
    <>
      <CourseCreator />
      <form action={action} onReset={(event) => event.preventDefault()} className="assignment-form">
        <input type="hidden" name="onboarding" value={String(onboarding)} />
        {assignment && <input type="hidden" name="id" value={assignment.id} />}
        <label>
          Assignment Name *
          <input
            name="title"
            defaultValue={assignment?.title}
            required
            maxLength={160}
            placeholder="e.g. Statistics Homework 3"
          />
        </label>
        <div className="form-columns">
          <label>
            Course *
            <select name="course_id" required defaultValue={assignment?.course_id || ''}>
              <option value="" disabled>
                Select a course
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!courses.length && <small>Add your first course above, then select it here.</small>}
          </label>
          <label>
            Assignment Type *
            <select
              name="assignment_type"
              defaultValue={assignment?.assignment_type || ''}
              required
            >
              <option value="" disabled>
                Choose a type
              </option>
              {assignmentTypes.map((t) => (
                <option key={t} value={t}>
                  {labels[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-columns">
          <label>
            Deadline *
            <input type="date" name="due_date" required defaultValue={assignment?.due_date} />
            <small>No exact time? We use end of day in {timezone}.</small>
          </label>
          <label>
            Due time (optional)
            <input type="time" name="due_time" defaultValue={assignment?.due_time?.slice(0, 5)} />
            <small>Times are shown in your profile’s timezone.</small>
          </label>
        </div>
        <label>
          Grade Weight (%) *
          <input
            type="number"
            name="grade_weight"
            required
            min="0"
            max="100"
            step="0.01"
            defaultValue={assignment?.grade_weight}
            placeholder="e.g. 15"
          />
          <small>
            If you don&apos;t know the exact percentage, you can enter your best estimate.
          </small>
        </label>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="field-label" style={{ marginBottom: 10 }}>
            Estimated Effort *
          </legend>
          <div className="effort-grid">
            {efforts.map((e) => (
              <label className="effort-option" key={e}>
                <input
                  type="radio"
                  name="effort_level"
                  value={e}
                  required
                  defaultChecked={assignment?.effort_level === e}
                />
                {labels[e]}
                <span>
                  {
                    {
                      small: 'A quick assignment.',
                      medium: 'Requires some focused work.',
                      large: 'A substantial assignment or project.',
                      unknown: 'We’ll treat this neutrally.',
                    }[e]
                  }
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <details open={estimated} onToggle={(e) => setEstimated(e.currentTarget.open)}>
          <summary>I know approximately how long this will take.</summary>
          <label>
            Approximate duration (minutes)
            <input
              type="number"
              name="estimated_minutes"
              disabled={!estimated}
              min="1"
              max="60000"
              defaultValue={assignment?.estimated_minutes || ''}
              placeholder="e.g. 90"
            />
            <small>Optional. A rough estimate is enough.</small>
          </label>
        </details>
        <label>
          Description (optional)
          <textarea
            name="description"
            defaultValue={assignment?.description || ''}
            maxLength={2000}
            placeholder="Any notes that will help you get started…"
          />
          <small>Relevant notes may be sent to Gemini when you request a recommendation.</small>
        </label>
        <Feedback state={state} />
        <div className="button-row">
          <Submit disabled={!courses.length}>
            {assignment ? 'Save changes' : 'Save assignment'}
          </Submit>
        </div>
      </form>
    </>
  );
}

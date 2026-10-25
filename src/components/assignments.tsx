'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, ListTodo, Plus, CircleCheck, CircleDashed } from 'lucide-react';
import type { Assignment, Course } from '@/lib/database.types';
import { assignmentTypes, labels, statuses } from '@/lib/schemas';
import { deadlineInstant, displayDeadline } from '@/lib/time';

export function AssignmentList({
  assignments,
  courses,
  timezone,
  compact = false,
  now,
}: {
  assignments: Assignment[];
  courses: Course[];
  timezone: string;
  compact?: boolean;
  now: string;
}) {
  const [course, setCourse] = useState('all'),
    [type, setType] = useState('all'),
    [status, setStatus] = useState('all'),
    [deadline, setDeadline] = useState('all'),
    [sort, setSort] = useState('deadline');
  const time = new Date(now).getTime();
  const filtered = assignments
    .filter((a) => {
      const remaining = deadlineInstant(a.due_date, a.due_time, timezone).getTime() - time;
      return (
        (course === 'all' || a.course_id === course) &&
        (type === 'all' || a.assignment_type === type) &&
        (status === 'all' || a.status === status) &&
        (deadline === 'all' ||
          (deadline === 'overdue'
            ? remaining < 0 && a.status !== 'completed'
            : remaining >= 0 && remaining <= 7 * 86400000))
      );
    })
    .sort((a, b) =>
      sort === 'name'
        ? a.title.localeCompare(b.title)
        : sort === 'weight'
          ? b.grade_weight - a.grade_weight
          : deadlineInstant(a.due_date, a.due_time, timezone).getTime() -
            deadlineInstant(b.due_date, b.due_time, timezone).getTime(),
    );
  return (
    <>
      {!compact && (
        <div className="filter-bar">
          <label>
            Course
            <select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              {assignmentTypes.map((t) => (
                <option key={t} value={t}>
                  {labels[t]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Deadline
            <select value={deadline} onChange={(e) => setDeadline(e.target.value)}>
              <option value="all">All deadlines</option>
              <option value="week">Next 7 days</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label>
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="deadline">Deadline</option>
              <option value="weight">Grade weight</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
      )}
      {filtered.length ? (
        <div className="assignment-list">
          {(compact ? filtered.slice(0, 5) : filtered).map((a) => {
            const overdue =
              a.status !== 'completed' &&
              deadlineInstant(a.due_date, a.due_time, timezone).getTime() < time;
            return (
              <Link key={a.id} href={`/assignments/${a.id}`} className="assignment-item">
                <div className="assignment-main">
                  <span className="task-icon">
                    {a.status === 'completed' ? (
                      <CircleCheck size={18} />
                    ) : (
                      <CircleDashed size={18} />
                    )}
                  </span>
                  <div>
                    <div className="assignment-title">{a.title}</div>
                    <div className="assignment-meta">
                      <span>{courses.find((c) => c.id === a.course_id)?.name || 'Course'}</span>
                      <span>·</span>
                      <span className={overdue ? 'overdue' : ''}>
                        {overdue ? 'Overdue · ' : ''}
                        {displayDeadline(a.due_date, a.due_time, timezone)}
                      </span>
                      <span>· {a.grade_weight}% weight</span>
                      <span>· {labels[a.effort_level]}</span>
                    </div>
                  </div>
                </div>
                <div className="assignment-item-actions">
                  <span className={`badge ${a.status === 'in_progress' ? 'green' : ''}`}>
                    {labels[a.status]}
                  </span>
                  <ArrowUpRight size={17} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <ListTodo size={30} />
          <h3>{assignments.length ? 'No matching assignments.' : 'A clear head starts here.'}</h3>
          <p>
            {assignments.length
              ? 'Try another filter to find what you need.'
              : 'Add your first assignment. We’ll help you figure out the next step.'}
          </p>
          <Link href="/assignments/new" className="button small">
            <Plus size={15} /> Add assignment
          </Link>
        </div>
      )}
    </>
  );
}

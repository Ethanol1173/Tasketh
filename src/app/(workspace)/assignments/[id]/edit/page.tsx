import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { workspaceData } from '@/lib/data';
import { AssignmentForm } from '@/components/assignment-form';
export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { assignments, courses, profile } = await workspaceData();
  const assignment = assignments.find((a) => a.id === id);
  if (!assignment) notFound();
  return (
    <div className="form-width">
      <header className="page-heading">
        <div>
          <Link href={`/assignments/${id}`} className="text-link">
            ← Back to assignment
          </Link>
          <h1>A little change of plan.</h1>
          <p>Keep your assignment details up to date.</p>
        </div>
      </header>
      <div className="card">
        <AssignmentForm assignment={assignment} courses={courses} timezone={profile.timezone} />
      </div>
    </div>
  );
}

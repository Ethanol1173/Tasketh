import Link from 'next/link';
import { workspaceData } from '@/lib/data';
import { AssignmentForm } from '@/components/assignment-form';
export default async function NewAssignmentPage() {
  const { courses, profile } = await workspaceData();
  return (
    <div className="form-width">
      <header className="page-heading">
        <div>
          <Link href="/assignments" className="text-link">
            ← All assignments
          </Link>
          <h1>One less thing to remember.</h1>
          <p>Add an assignment. Estimates are welcome.</p>
        </div>
      </header>
      <div className="card">
        <AssignmentForm courses={courses} timezone={profile.timezone} />
      </div>
    </div>
  );
}

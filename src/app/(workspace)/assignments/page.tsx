import Link from 'next/link';
import { Plus } from 'lucide-react';
import { workspaceData } from '@/lib/data';
import { AssignmentList } from '@/components/assignments';
export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { assignments, courses, profile } = await workspaceData();
  const params = await searchParams;
  return (
    <>
      <header className="page-heading">
        <div>
          <span className="eyebrow">GET IT OUT OF YOUR HEAD</span>
          <h1>Your assignments</h1>
          <p>Everything on your plate, with a little more clarity.</p>
        </div>
        <Link href="/assignments/new" className="button">
          <Plus size={16} /> Add assignment
        </Link>
      </header>
      {params.deleted && (
        <p className="notice success" role="status">
          Assignment deleted.
        </p>
      )}
      <AssignmentList
        assignments={assignments}
        courses={courses}
        timezone={profile.timezone}
        now={new Date().toISOString()}
      />
    </>
  );
}

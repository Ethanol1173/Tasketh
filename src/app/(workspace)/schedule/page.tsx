import { workspaceData } from '@/lib/data';
import { ScheduleEditor } from '@/components/schedule-editor';
export default async function SchedulePage() {
  const { profile, availability } = await workspaceData();
  return (
    <div className="form-width">
      <header className="page-heading">
        <div>
          <span className="eyebrow">MAKE SPACE FOR PROGRESS</span>
          <h1>Your weekly rhythm</h1>
          <p>A flexible plan for the week you actually have.</p>
        </div>
      </header>
      <ScheduleEditor availability={availability} timezone={profile.timezone} />
    </div>
  );
}

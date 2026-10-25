import { workspaceData } from '@/lib/data';
import { CourseCreator } from '@/components/assignment-form';
import { ActionForm, DeleteForm } from '@/components/ui';
import { saveCourse, deleteCourse } from '@/app/actions/workspace';
export default async function CoursesPage() {
  const { courses, assignments } = await workspaceData();
  return (
    <div className="form-width">
      <header className="page-heading">
        <div>
          <span className="eyebrow">YOUR SEMESTER, A LITTLE CLEARER</span>
          <h1>Your courses</h1>
          <p>Organize your work around the things you’re learning.</p>
        </div>
      </header>
      <CourseCreator />
      <div className="stack">
        {courses.map((c) => (
          <section className="card stack-sm" key={c.id}>
            <ActionForm action={saveCourse} submit="Save course" className="stack-sm">
              <input type="hidden" name="id" value={c.id} />
              <label>
                Course name
                <input name="name" required maxLength={100} defaultValue={c.name} />
              </label>
            </ActionForm>
            <p className="helper">
              {assignments.filter((a) => a.course_id === c.id).length} assignments · Move or delete
              assignments before deleting a course.
            </p>
            <div>
              <DeleteForm action={deleteCourse} id={c.id} label="course" />
            </div>
          </section>
        ))}
        {!courses.length && (
          <div className="empty-state">
            <h3>What are you learning?</h3>
            <p>Add your first course above. All your assignments will have a home.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { workspaceData } from '@/lib/data';
import { RecommendationComposer } from '@/components/recommendation';
export default async function RecommendationPage() {
  const { assignments, courses, profile } = await workspaceData();
  return (
    <>
      <header className="page-heading">
        <div>
          <span className="eyebrow">ONE GOOD NEXT STEP</span>
          <h1>A little time. A lot of possibility.</h1>
          <p>Choose your window. Let’s figure out where to start.</p>
        </div>
      </header>
      <RecommendationComposer
        aiEnabled={process.env.TASKETH_RECOMMENDATION_MODE === 'gemini'}
        assignments={assignments}
        courses={courses}
        timezone={profile.timezone}
      />
    </>
  );
}

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Clock3,
  Check,
  CalendarDays,
  ListTodo,
  WandSparkles,
} from 'lucide-react';
import { Brand } from '@/components/brand';
export default function Home() {
  return (
    <div className="landing">
      <header className="public-header">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how-it-works" className="text-link hide-small">
            How it works
          </a>
          <Link href="/login" className="text-link">
            Log in
          </Link>
          <Link href="/onboarding/theme" className="button small">
            Get Started <ArrowUpRight size={16} />
          </Link>
        </nav>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <div className="pill">
              <span className="live-dot" /> YOUR NEXT STEP, FIGURED OUT
            </div>
            <h1>
              Less planning.
              <br />
              <span>More doing.</span>
              <svg className="hero-scribble" viewBox="0 0 300 24" aria-hidden="true">
                <path d="M3 15Q150 -4 296 13M33 22Q150 8 267 19" />
              </svg>
            </h1>
            <p>
              Too many assignments and not sure where to start? Tasketh helps you figure out what to
              work on and make the most of your study time.
            </p>
            <div className="button-row">
              <Link href="/onboarding/theme" className="button">
                Find your focus <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="button secondary">
                How It Works
              </a>
            </div>
            <div className="hero-footnote">
              <span>
                <Check size={14} /> Built for student life
              </span>
              <span>
                <Check size={14} /> Your vibe, your pace
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Illustration of the Tasketh recommendation experience"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-note">
              <Sparkles size={15} /> A clear head starts here.
            </div>
            <div className="product-window">
              <div className="window-bar">
                <div className="window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>YOUR FOCUS SPACE</span>
                <Sparkles size={14} />
              </div>
              <div className="product-content">
                <span className="eyebrow">LESS OVERTHINKING. MORE MOMENTUM.</span>
                <h2>
                  Make your next
                  <br />
                  30 minutes count.
                </h2>
                <div className="preview-time">
                  <span>15 min</span>
                  <span className="chosen">30 min</span>
                  <span>60 min</span>
                  <span>90 min</span>
                </div>
                <div className="preview-recommendation">
                  <div className="row-between">
                    <span className="accent-label">
                      <WandSparkles size={14} /> YOUR NEXT MOVE
                    </span>
                    <span className="tiny muted">Illustration</span>
                  </div>
                  <h3>One task. A clear starting point.</h3>
                  <p>
                    A recommendation that balances your deadlines, grade impact, and the time you
                    have.
                  </p>
                  <div className="preview-next">
                    <span className="check-circle">
                      <Check size={16} />
                    </span>
                    <span>Start with one manageable step.</span>
                  </div>
                </div>
                <div className="preview-bottom">
                  <span>
                    <span className="live-dot" /> A little progress is still progress.
                  </span>
                  <ArrowUpRight size={18} />
                </div>
              </div>
            </div>
            <div className="floating-time">
              <Clock3 size={18} />
              <div>
                <strong>Your time, well spent.</strong>
                <span>Make room for what matters.</span>
              </div>
            </div>
          </div>
        </section>
        <section className="value-strip">
          <span>Less decision fatigue.</span>
          <span>More meaningful progress.</span>
          <span>A study space that feels like you.</span>
        </section>
        <section id="how-it-works" className="how-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM OVERWHELMED TO ON IT</span>
              <h2>Find your flow in four steps.</h2>
            </div>
            <Link href="/onboarding/theme" className="text-link">
              Let’s get you started <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="step-grid">
            {[
              {
                icon: CalendarDays,
                title: 'Make a little space',
                copy: 'Set your weekly study availability. Keep it realistic.',
              },
              {
                icon: ListTodo,
                title: 'Get it out of your head',
                copy: 'Add assignments, deadlines, and estimated grade weights.',
              },
              {
                icon: Clock3,
                title: 'Pick your window',
                copy: 'Got 15 minutes or a full afternoon? Start where you are.',
              },
              {
                icon: Sparkles,
                title: 'Know your next move',
                copy: 'Get a practical recommendation, then make it happen.',
              },
            ].map(({ icon: Icon, title, copy }, i) => (
              <article key={title} className="step-card">
                <div className="row-between">
                  <Icon size={23} />
                  <span className="step-number">0{i + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="closing-card">
          <div>
            <span className="eyebrow">LESS OPEN TABS. MORE OPEN POSSIBILITIES.</span>
            <h2>Your next step is closer than you think.</h2>
          </div>
          <Link href="/onboarding/theme" className="button">
            Make it yours <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="public-footer">
        <Brand />
        <span>Made for a little less overwhelm.</span>
        <Link href="/privacy">Privacy & AI</Link>
      </footer>
    </div>
  );
}

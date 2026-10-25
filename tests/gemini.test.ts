import { afterEach, describe, expect, it, vi } from 'vitest';
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));
import { recommend } from '@/lib/recommendations/gemini';
import { assignment, firstId } from './fixtures';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe('provider orchestration (SDK boundary mocked; not a live API test)', () => {
  it('uses fallback without a key and never calls the provider', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    expect((await recommend([assignment()], [], 30, 'UTC'))?.source).toBe('fallback');
    expect(generateContent).not.toHaveBeenCalled();
  });
  it('uses rules by default even when a Gemini key is present', async () => {
    vi.stubEnv('TASKETH_RECOMMENDATION_MODE', 'rules');
    vi.stubEnv('GEMINI_API_KEY', 'unit-test-only');
    expect((await recommend([assignment()], [], 30, 'UTC'))?.source).toBe('fallback');
    expect(generateContent).not.toHaveBeenCalled();
  });
  it('uses validated structured output and omits private account fields when Gemini is enabled', async () => {
    vi.stubEnv('TASKETH_RECOMMENDATION_MODE', 'gemini');
    vi.stubEnv('GEMINI_API_KEY', 'unit-test-only');
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        recommended_assignment_id: firstId,
        reason: 'The deadline and estimated weight make this useful.',
        suggested_action: 'Review the requirements and begin a manageable part.',
        suggested_minutes: 20,
        alternative_assignment_id: null,
        alternative_reason: null,
      }),
    });
    expect((await recommend([assignment()], [], 30, 'UTC'))?.source).toBe('gemini');
    const payload = generateContent.mock.calls[0][0];
    expect(payload.config.responseMimeType).toBe('application/json');
    expect(payload.contents).not.toContain('user_id');
    expect(payload.contents).not.toContain('unit-test-only');
  });
  it('falls back on API failure and invalid output', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'unit-test-only');
    generateContent.mockRejectedValueOnce(new Error('provider unavailable'));
    expect((await recommend([assignment()], [], 30, 'UTC'))?.source).toBe('fallback');
    generateContent.mockResolvedValueOnce({ text: '{"suggested_minutes":999}' });
    expect((await recommend([assignment()], [], 30, 'UTC'))?.source).toBe('fallback');
  });
});

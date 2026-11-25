import { describe, it, expect } from 'vitest';
import { INITIAL_DEMO_RUN } from './data/demoFixtures';

describe('TokenOS MVP Consistency & Demo Fixture Verification', () => {
  it('contains the exact synthetic sales numbers in demo fixture', () => {
    expect(INITIAL_DEMO_RUN.originalRequest).toContain('August');
    expect(INITIAL_DEMO_RUN.originalRequest).toContain('September');
    expect(INITIAL_DEMO_RUN.originalRequest).toContain('1,600');
  });

  it('verifies initial contract has 4 success criteria (a, b, c, d)', () => {
    const criteria = INITIAL_DEMO_RUN.contract.successCriteria;
    expect(criteria.length).toBe(4);
    expect(criteria.map((c) => c.code)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('verifies prompt v2 has token estimate of 1284', () => {
    const promptV2 = INITIAL_DEMO_RUN.prompts.find((p) => p.id === 'prompt-v2');
    expect(promptV2?.estimatedTokenCount).toBe(1284);
  });

  it('verifies answer v1 report fails criteria b, a, c with exact severity', () => {
    const repV1 = INITIAL_DEMO_RUN.verificationReports.find((r) => r.answerVersionId === 'ans-v1');
    expect(repV1?.overallStatus).toBe('failed');
    const failedFindings = repV1?.findings.filter((f) => f.status === 'not_met');
    expect(failedFindings?.length).toBe(3);
  });

  it('verifies answer v2 report passes all criteria after improvement', () => {
    const repV2 = INITIAL_DEMO_RUN.verificationReports.find((r) => r.answerVersionId === 'ans-v2');
    expect(repV2?.overallStatus).toBe('passed');
    const metFindings = repV2?.findings.filter((f) => f.status === 'met');
    expect(metFindings?.length).toBe(4);
  });
});

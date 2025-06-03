import { describe, test, expect } from 'vitest';
import { RuleEngine, RuleContext } from '@shared/RuleEngine';
import ruleset from 'ruleset.json';
import { DEFAULT_CONFIG } from '@shared/defaultConfig';

// @ts-ignore
import contexts from './scanContexts_20.json';

const engine = new RuleEngine(ruleset, DEFAULT_CONFIG);

describe('RuleEngine - ruleset expected score validation', () => {
  contexts.forEach((ctx: RuleContext & { expectedScore: number }, index: number) => {
    test(`Case #${index + 1} - ${ctx.process} (${ctx.country})`, () => {
      const result = engine.evaluate(ctx);
      expect(result).toHaveProperty('score');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBe(ctx.expectedScore);
    });
  });
});

import { Config } from '../types/config';

export interface RuleContext {
    process: string;
    processPath: string;
    isSigned: boolean;
    country?: string;
    provider?: string;
    organization?: string;
    config: Config;
    datasets: Record<string, any>;
    [key: string]: any;
}

type RuleSet = {
    datasets: Record<string, any>;
    rules: Rule[];
};

type Rule = {
    label: string;
    condition: Condition;
    extraCondition?: Condition;
    weight: number;
};

type Condition =
    | { field: string; equals: any }
    | { field: string; in: string | any[] }
    | { field: string; greaterThan: number }
    | { field: string; matchDatasetMap: { dataset: string; matchField: string } }
    | { field: string; notMatchDatasetMap: { dataset: string; matchField: string } };

export class RuleEngine {
    private rules: Rule[];
    private datasets: Record<string, any>;
    private config: Config;

    constructor(ruleSet: RuleSet, config: Config) {
        this.rules = ruleSet.rules;
        this.datasets = this._prepareDatasets(ruleSet.datasets);
        this.config = config;
    }

    public evaluate(context: RuleContext): { score: number; reasons: string[] } {
        console.log("[RuleEngine] --------------------");
        console.log("[RuleEngine] Evaluating: ", context.process);

        let score = -5;
        const reasons: string[] = [];

        for (const rule of this.rules) {
            const allConditionsPass = rule.conditions.every((cond) =>
                this.evaluateCondition(cond, context)
            );
            if (allConditionsPass) {
                console.log("[RuleEngine] Rule passed: ", rule.label);
                score += rule.weight;
                if (rule.weight < 0) {
                    reasons.push(rule.label);
                }
            }
        }

        return { score, reasons };
    }

    private evaluateCondition(condition: Condition, context: RuleContext): boolean {
        const value = this.resolveField(condition.field, context);

        if ('equals' in condition) {
            return value === condition.equals;
        }

        if ('greaterThan' in condition) {
            return Number(value) > Number(condition.greaterThan);
        }

        if ('in' in condition) {
            if (typeof condition.in === 'string') {
                if (condition.in.startsWith('@dataset:')) {
                    const datasetKey = this.extractDatasetKey(condition.in);
                    const dataset = this.datasets?.[datasetKey]; // ← ici au lieu de context.datasets
                    if (!dataset || !dataset.values) return false;

                    if (dataset.type === 'regex') {
                        return dataset.values.some((regex: RegExp) => regex.test(value));
                    }

                    return this.isIncluded(value, dataset.values);
                }
                if (condition.in.startsWith('@config:')) {
                    const configKey = this.extractDatasetKey(condition.in) as keyof Config;
                    return this.isIncluded(value, this.config?.[configKey]);
                }
            } else if (Array.isArray(condition.in)) {
                return this.isIncluded(value, condition.in);
            }
        }

        if ('matchDatasetMap' in condition) {
            const { dataset, matchField } = condition.matchDatasetMap;
            const patternMap = this.datasets?.[dataset]?.values;
            const otherValue = context[matchField];
            let regex = patternMap?.[otherValue?.toLowerCase()];
            if (typeof regex === 'string') {
                regex = new RegExp(regex, 'i');
            }
            if (regex instanceof RegExp) {
                return regex.test(value);
            }
        }

        if ('notMatchDatasetMap' in condition) {
            const { dataset, matchField } = condition.notMatchDatasetMap;
            const patternMap = this.datasets?.[dataset]?.values;
            const otherValue = context[matchField];
            let regex = patternMap?.[otherValue?.toLowerCase()];
            if (typeof regex === 'string') {
                regex = new RegExp(regex, 'i');
            }
            if (regex instanceof RegExp) {
                return !regex.test(value);
            }
        }

        return false;
    }

    private isIncluded(value: any, list: unknown): boolean {
        if (Array.isArray(list)) {
            return list.includes(value);
        }
        return false;
    }

    private resolveField(field: string, context: RuleContext): any {
        return context[field];
    }

    private extractDatasetKey(raw: string): string {
        return raw.replace(/^@(?:dataset|config):/, '');
    }

    private _prepareDatasets(datasets: Record<string, any>): Record<string, any> {
        const compiled: Record<string, any> = {};

        for (const [key, value] of Object.entries(datasets)) {
            if (value.type === 'regex') {
                compiled[key] = {
                    type: 'regex',
                    values: value.values.map((r: string) => new RegExp(r, 'i')),
                };
            } else if (value.type === 'map') {
                compiled[key] = {
                    type: 'map',
                    values: Object.fromEntries(
                        Object.entries(value.values).map(([k, v]) => [k.toLowerCase(), new RegExp(v, 'i')])
                    )
                };
            } else {
                compiled[key] = {
                    type: 'array',
                    values: value.values,
                };
            }
        }

        return compiled;
    }
}

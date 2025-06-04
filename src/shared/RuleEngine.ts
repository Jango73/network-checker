import { Config } from '../types/config';

export interface RuleContext {
    process: string;
    processPath: string;
    isSigned: boolean;
    country?: string;
    provider?: string;
    [key: string]: any;
}

type RuleSet = {
    datasets: Record<string, any>;
    rules: Rule[];
};

type Rule = {
    label: string;
    conditions: Condition[];
    weight: number;
};

type Condition =
    | { field: string; equals: any }
    | { field: string; greaterThan: number }
    | { field: string; in: string | any[] }
    | { field: string; notIn: string | any[] }
    | { field: string; containsAny: string | any[] }
    | { field: string; notContainsAny: string | any[] }
    | {
          field: string;
          matchDatasetMap: { dataset: string; matchField: string };
      }
    | {
          field: string;
          notMatchDatasetMap: { dataset: string; matchField: string };
      };

export class RuleEngine {
    private rules: Rule[];
    private datasets: Record<string, any>;
    private config: Config;

    constructor(ruleSet: RuleSet, config: Config) {
        this.rules = ruleSet.rules;
        this.datasets = this._prepareDatasets(ruleSet.datasets);
        this.config = config;
    }

    public evaluate(context: RuleContext): {
        score: number;
        reasons: string[];
    } {
        let score = -5;
        const reasons: string[] = [];

        for (const rule of this.rules) {
            const results = rule.conditions.map(cond => ({
                cond,
                value: this.resolveField(cond.field, context),
                passed: this.evaluateCondition(cond, context),
            }));

            const allConditionsPass = results.every(r => r.passed);

            if (allConditionsPass) {
                score += rule.weight;
                if (rule.weight < 0) reasons.push(rule.label);
            }
        }

        return { score, reasons };
    }

    private evaluateCondition(
        condition: Condition,
        context: RuleContext
    ): boolean {
        const value = this.resolveField(condition.field, context);

        if ('equals' in condition) {
            return value === condition.equals;
        }

        if ('greaterThan' in condition) {
            return Number(value) > Number(condition.greaterThan);
        }

        if ('in' in condition || 'notIn' in condition) {
            const ref = (condition as any).in ?? (condition as any).notIn;
            let returnValue = false;

            if (typeof ref === 'string') {
                if (ref.startsWith('@dataset:')) {
                    const datasetKey = this.extractDatasetKey(ref);
                    const dataset = this.datasets?.[datasetKey];
                    returnValue = this.isIncludedInDataset(value, dataset);
                }
                if (ref.startsWith('@config:')) {
                    const configKey = this.extractDatasetKey(
                        ref
                    ) as keyof Config;
                    returnValue = this.isIncluded(
                        value,
                        this.config?.[configKey]
                    );
                }
            } else if (Array.isArray(ref)) {
                returnValue = this.isIncluded(value, ref);
            }

            if ('notIn' in condition) returnValue = !returnValue;

            return returnValue;
        }

        if ('containsAny' in condition || 'notContainsAny' in condition) {
            const ref =
                (condition as any).containsAny ??
                (condition as any).notContainsAny;
            let returnValue = false;
            let list: string[] = [];

            if (typeof ref === 'string') {
                if (ref.startsWith('@dataset:')) {
                    const datasetKey = this.extractDatasetKey(ref);
                    const dataset = this.datasets?.[datasetKey];
                    list = Array.isArray(dataset?.values) ? dataset.values : [];
                }
                if (ref.startsWith('@config:')) {
                    const configKey = this.extractDatasetKey(
                        ref
                    ) as keyof Config;
                    const configList = this.config?.[configKey];
                    list = Array.isArray(configList) ? configList : [];
                }
            } else if (Array.isArray(ref)) {
                list = ref;
            }

            returnValue = this.isContained(value, list);

            if ('notContainsAny' in condition) returnValue = !returnValue;

            return returnValue;
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
            return list.some(item =>
                typeof item === 'string' && typeof value === 'string'
                    ? item.toLowerCase() === value.toLowerCase()
                    : item === value
            );
        }
        return false;
    }

    private isContained(value: any, list: unknown): boolean {
        return typeof value === 'string' && Array.isArray(list)
            ? list.some(
                  entry =>
                      typeof entry === 'string' &&
                      value.toLowerCase().includes(entry.toLowerCase())
              )
            : false;
    }

    private resolveField(field: string, context: RuleContext): any {
        return context[field];
    }

    private extractDatasetKey(raw: string): string {
        return raw.replace(/^@(?:dataset|config):/, '');
    }

    private isIncludedInDataset(value: any, dataset: any): boolean {
        if (!dataset || !dataset.values) return false;

        if (dataset.type === 'regex') {
            return dataset.values.some((regex: RegExp) => regex.test(value));
        }

        if (dataset.type === 'array') {
            return dataset.values.includes(value);
        }

        if (dataset.type === 'map') {
            return Object.keys(dataset.values).includes(value.toLowerCase());
        }

        return false;
    }

    private _prepareDatasets(
        datasets: Record<string, any>
    ): Record<string, any> {
        const compiled: Record<string, any> = {};

        for (const [key, value] of Object.entries(datasets)) {
            if (value.type === 'regex') {
                compiled[key] = {
                    type: 'regex',
                    values: value.values.map((r: string) => new RegExp(r, 'i')),
                };
            } else if (value.type === 'map') {
                const entries = Object.entries(
                    value.values as Record<string, string>
                );
                compiled[key] = {
                    type: 'map',
                    values: Object.fromEntries(
                        entries.map(([k, v]) => [
                            k.toLowerCase(),
                            new RegExp(v, 'i'),
                        ])
                    ),
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

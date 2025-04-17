export declare function isObject(value: any): value is Record<string | number | symbol, any>;
export declare function isRecord<TKey extends string | number | symbol = string, TValue = any>(value: any): value is Record<TKey, TValue>;

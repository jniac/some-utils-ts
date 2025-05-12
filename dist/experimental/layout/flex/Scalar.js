export var ScalarType;
(function (ScalarType) {
    ScalarType[ScalarType["Auto"] = 0] = "Auto";
    ScalarType[ScalarType["Absolute"] = 1] = "Absolute";
    ScalarType[ScalarType["Relative"] = 2] = "Relative";
    ScalarType[ScalarType["OppositeRelative"] = 3] = "OppositeRelative";
    ScalarType[ScalarType["SmallerRelative"] = 4] = "SmallerRelative";
    ScalarType[ScalarType["LargerRelative"] = 5] = "LargerRelative";
    ScalarType[ScalarType["Fraction"] = 6] = "Fraction";
})(ScalarType || (ScalarType = {}));
const scalarExtensions = {
    'abs': ScalarType.Absolute,
    'rel': ScalarType.Relative,
    'opp': ScalarType.OppositeRelative,
    'sm': ScalarType.SmallerRelative,
    'lg': ScalarType.LargerRelative,
    'fr': ScalarType.Fraction,
};
const scalarExtraExtensions = {
    '%': ScalarType.Relative,
    'part': ScalarType.Fraction,
    /**
     * "sh" for "share".
     */
    'sh': ScalarType.Fraction,
};
const allScalarExtensions = { ...scalarExtensions, ...scalarExtraExtensions };
const scalarExtensionsReverse = Object.fromEntries(Object.entries(allScalarExtensions).map(([k, v]) => [v, k]));
export function parseScalar(arg, out = new Scalar()) {
    if (arg === 'auto') {
        out.value = 1;
        out.type = ScalarType.Auto;
        return out;
    }
    if (typeof arg === 'number') {
        out.value = arg;
        out.type = ScalarType.Absolute;
        return out;
    }
    if (typeof arg !== 'string') {
        console.log(`received:`, arg);
        throw new Error('Invalid scalar declaration');
    }
    const m = arg.match(/([\d\.]+)([a-z%]+)?$/);
    if (!m) {
        console.log(`received:`, arg);
        throw new Error('Invalid scalar declaration');
    }
    const [_, v, t] = m;
    let value = Number.parseFloat(v);
    const type = allScalarExtensions[t] ?? ScalarType.Absolute;
    if (Number.isNaN(value)) {
        throw new Error('Invalid scalar declaration');
    }
    if (t === '%') {
        value /= 100;
    }
    out.value = value;
    out.type = type;
    return out;
}
export class Scalar {
    static parse(str, out = new Scalar()) {
        out.parse(str);
        return out;
    }
    value;
    type;
    constructor(value = 0, mode = ScalarType.Absolute) {
        this.value = value;
        this.type = mode;
    }
    set(value, mode = this.type) {
        this.value = value;
        this.type = mode;
    }
    compute(parentValue, parentOppositeValue) {
        switch (this.type) {
            case ScalarType.Absolute:
                return this.value;
            case ScalarType.Relative:
                return this.value * parentValue;
            case ScalarType.OppositeRelative:
                return this.value * parentOppositeValue;
            case ScalarType.SmallerRelative:
                return this.value * Math.min(parentValue, parentOppositeValue);
            case ScalarType.LargerRelative:
                return this.value * Math.max(parentValue, parentOppositeValue);
            case ScalarType.Auto:
            case ScalarType.Fraction:
                return parentValue; // "Part" space is always parent's size on normal axis (on colinear axis it is not computed here)
        }
    }
    parse(arg) {
        parseScalar(arg, this);
        return this;
    }
    toString() {
        return `${this.value}${scalarExtensionsReverse[this.type]}`;
    }
}
//# sourceMappingURL=Scalar.js.map
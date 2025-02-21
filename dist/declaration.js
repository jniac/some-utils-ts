import { formatNumber } from './string/number.js';
export const angleUnits = ['rad', 'deg', 'turn'];
export const angleScalars = {
    rad: 1,
    deg: Math.PI / 180,
    turn: Math.PI * 2,
};
export function isAngleUnit(arg) {
    return typeof arg === 'string' && angleUnits.includes(arg);
}
/**
 * Transforms the given angle declaration into a number in radians.
 */
export function fromAngleDeclaration(declaration, defaultUnit = 'rad') {
    let unit = defaultUnit;
    let value = 0;
    if (typeof declaration === 'number') {
        value = declaration;
    }
    else {
        const match = declaration.match(/^\s*(-?[0-9.]+)\s*(\/\s*-?[0-9.]+)?\s*(rad|deg|turn)\s*$/);
        if (match) {
            const [_, v, d, u] = match;
            value = Number.parseFloat(v);
            if (d) {
                value /= Number.parseFloat(d.slice(1));
            }
            unit = u;
        }
        else {
            value = Number.parseFloat(declaration);
        }
    }
    return value * angleScalars[unit];
}
export function toAngleDeclarationString(value, unit = 'rad') {
    return `${formatNumber(value / angleScalars[unit])}${unit}`;
}
function isNumber(v) {
    return typeof v === 'number';
}
export function isVector2Declaration(arg, isBaseType = (isNumber)) {
    if (isBaseType(arg))
        return true;
    if (Array.isArray(arg))
        return arg.length >= 2 && arg.length <= 3 && arg.every(v => isBaseType(v));
    if (typeof arg === 'object') {
        if ('x' in arg && 'y' in arg)
            return isBaseType(arg.x) && isBaseType(arg.y);
        if ('width' in arg && 'height' in arg)
            return isBaseType(arg.width) && isBaseType(arg.height);
    }
    return false;
}
export function fromVector2Declaration(arg, out, defaultValue, isBaseType) {
    defaultValue ??= 0;
    isBaseType ??= isNumber;
    out ??= { x: defaultValue, y: defaultValue };
    if (arg === undefined || arg === null) {
        return out;
    }
    if (isBaseType(arg)) {
        out.x = arg;
        out.y = arg;
        return out;
    }
    if (Array.isArray(arg)) {
        const [x, y] = arg;
        out.x = x;
        out.y = y;
        return out;
    }
    if ('width' in arg) {
        const { width, height } = arg;
        out.x = width;
        out.y = height;
        return out;
    }
    const { x, y } = arg;
    out.x = x;
    out.y = y;
    return out;
}
export function toVector2Declaration(arg) {
    const { x, y } = fromVector2Declaration(arg);
    return [x, y];
}
export function isVector3Declaration(arg, isBaseType = (isNumber)) {
    return isVector2Declaration(arg, isBaseType);
}
export function fromVector3Declaration(arg, out, defaultValue, isBaseType) {
    isBaseType ??= isNumber;
    defaultValue ??= 0;
    out ??= { x: defaultValue, y: defaultValue, z: defaultValue };
    if (arg === undefined || arg === null) {
        return out;
    }
    if (isBaseType(arg)) {
        out.x = arg;
        out.y = arg;
        out.z = arg;
        return out;
    }
    if (Array.isArray(arg)) {
        const [x, y, z = defaultValue] = arg;
        out.x = x;
        out.y = y;
        out.z = z;
        return out;
    }
    if ('width' in arg) {
        const { width, height = defaultValue, depth = defaultValue } = arg;
        out.x = width;
        out.y = height;
        out.z = depth;
        return out;
    }
    const { x = defaultValue, y = defaultValue, z = defaultValue } = arg;
    out.x = x;
    out.y = y;
    out.z = z;
    return out;
}
export function toVector3Declaration(arg) {
    const { x, y, z } = fromVector3Declaration(arg);
    return [x, y, z];
}
export function isVector4Declaration(arg, isBaseType = (isNumber)) {
    return (isVector2Declaration(arg, isBaseType)
        || (typeof arg === 'object' && isBaseType(arg.x) && isBaseType(arg.y) && isBaseType(arg.z) && isBaseType(arg.w)));
}
export function fromVector4Declaration(arg, out, defaultValue, isBaseType) {
    isBaseType ??= isNumber;
    defaultValue ??= 0;
    out ??= { x: defaultValue, y: defaultValue, z: defaultValue, w: defaultValue };
    if (arg === undefined || arg === null) {
        return out;
    }
    if (isBaseType(arg)) {
        out.x = arg;
        out.y = arg;
        out.z = arg;
        out.w = arg;
        return out;
    }
    if (Array.isArray(arg)) {
        const [x, y, z = defaultValue, w = defaultValue] = arg;
        out.x = x;
        out.y = y;
        out.z = z;
        out.w = w;
        return out;
    }
    if ('width' in arg) {
        const { width, height = defaultValue, depth = defaultValue, time = defaultValue } = arg;
        out.x = width;
        out.y = height;
        out.z = depth;
        out.w = time;
        return out;
    }
    if ('top' in arg) {
        const { top, right = defaultValue, bottom = defaultValue, left = defaultValue } = arg;
        // top, right, bottom, left (CSS order)
        out.x = top;
        out.y = right;
        out.z = bottom;
        out.w = left;
        return out;
    }
    const { x = defaultValue, y = defaultValue, z = defaultValue, w = defaultValue } = arg;
    out.x = x;
    out.y = y;
    out.z = z;
    out.w = w;
    return out;
}
export function toVector4Declaration(arg) {
    const { x, y, z, w } = fromVector4Declaration(arg);
    return [x, y, z, w];
}

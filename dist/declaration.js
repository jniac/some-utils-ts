import { formatNumber } from './string/number.js';
const vector2DeclarationStrings = ['x', 'y'];
const vector3DeclarationStrings = ['x', 'y', 'z'];
const vector4DeclarationStrings = ['x', 'y', 'z', 'w'];
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
    if (typeof arg === 'string')
        return arg === 'x' || arg === 'y';
    if (Array.isArray(arg))
        return (arg.length >= 2
            && isBaseType(arg[0])
            && isBaseType(arg[1]));
    if (typeof arg === 'object') {
        if ('x' in arg && isBaseType(arg.x)
            && 'y' in arg && isBaseType(arg.y))
            return true;
        if ('width' in arg && isBaseType(arg.width)
            && 'height' in arg && isBaseType(arg.height))
            return true;
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
    if (typeof arg === 'string') {
        switch (arg) {
            case 'x':
                out.x = 1;
                out.y = 0;
                return out;
            case 'y':
                out.x = 0;
                out.y = 1;
                return out;
            default:
                throw new Error(`Invalid vector2 declaration: ${arg}`);
        }
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
    if (isBaseType(arg))
        return true;
    if (typeof arg === 'string')
        return arg === 'x' || arg === 'y' || arg === 'z';
    if (Array.isArray(arg))
        return (arg.length >= 2
            && isBaseType(arg[0])
            && isBaseType(arg[1])
            && (arg[2] === undefined || isBaseType(arg[2])));
    if (typeof arg === 'object') {
        if ('x' in arg && isBaseType(arg.x)
            && 'y' in arg && isBaseType(arg.y)
            && ('z' in arg ? isBaseType(arg.z) : true))
            return true;
        if ('width' in arg && isBaseType(arg.width)
            && 'height' in arg && isBaseType(arg.height)
            && ('depth' in arg ? isBaseType(arg.depth) : true))
            return true;
    }
    return false;
}
export function fromVector3Declaration(arg, out, defaultValue, isBaseType) {
    isBaseType ??= isNumber;
    defaultValue ??= 0;
    out ??= { x: defaultValue, y: defaultValue, z: defaultValue };
    if (arg === undefined || arg === null) {
        return out;
    }
    if (typeof arg === 'string') {
        switch (arg) {
            case 'x':
                out.x = 1;
                out.y = 0;
                out.z = 0;
                return out;
            case 'y':
                out.x = 0;
                out.y = 1;
                out.z = 0;
                return out;
            case 'z':
                out.x = 0;
                out.y = 0;
                out.z = 1;
                return out;
            default:
                throw new Error(`Invalid vector2 declaration: ${arg}`);
        }
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
    if (isBaseType(arg))
        return true;
    if (typeof arg === 'string')
        return arg === 'x' || arg === 'y' || arg === 'z' || arg === 'w';
    if (Array.isArray(arg))
        return (arg.length >= 2
            && isBaseType(arg[0])
            && isBaseType(arg[1])
            && (arg[2] === undefined || isBaseType(arg[2]))
            && (arg[3] === undefined || isBaseType(arg[3])));
    if (typeof arg === 'object') {
        if ('x' in arg && isBaseType(arg.x)
            && 'y' in arg && isBaseType(arg.y)
            && ('z' in arg ? isBaseType(arg.z) : true))
            return true;
        if ('width' in arg && isBaseType(arg.width)
            && 'height' in arg && isBaseType(arg.height)
            && ('depth' in arg ? isBaseType(arg.depth) : true))
            return true;
    }
    return false;
}
export function fromVector4Declaration(arg, out, defaultValue, isBaseType) {
    isBaseType ??= isNumber;
    defaultValue ??= 0;
    out ??= { x: defaultValue, y: defaultValue, z: defaultValue, w: defaultValue };
    if (arg === undefined || arg === null) {
        return out;
    }
    if (typeof arg === 'string') {
        switch (arg) {
            case 'x':
                out.x = 1;
                out.y = 0;
                out.z = 0;
                out.w = 0;
                return out;
            case 'y':
                out.x = 0;
                out.y = 1;
                out.z = 0;
                out.w = 0;
                return out;
            case 'z':
                out.x = 0;
                out.y = 0;
                out.z = 1;
                out.w = 0;
                return out;
            case 'w':
                out.x = 0;
                out.y = 0;
                out.z = 0;
                out.w = 1;
                return out;
            default:
                throw new Error(`Invalid vector2 declaration: ${arg}`);
        }
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
//# sourceMappingURL=declaration.js.map
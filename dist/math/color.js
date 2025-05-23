import { lerp, toff } from './basic.js';
import webColors from './web-colors.json';
export function isColor4Like(arg) {
    return typeof arg === 'object' && 'r' in arg && 'g' in arg && 'b' in arg && 'a' in arg;
}
export function toFFString(f) {
    return toff(f).toString(16).padStart(2, '0');
}
export function hexToColor4(hex, out) {
    out ??= { r: 1, g: 1, b: 1, a: 1 };
    out.r = ((hex >> 16) & 255) / 255;
    out.g = ((hex >> 8) & 255) / 255;
    out.b = (hex & 255) / 255;
    return out;
}
export function webColorToHex(color) {
    const re = new RegExp(`^${color.toLowerCase()}$`, 'i');
    const entry = webColors.find((entry) => entry.name.match(re));
    if (entry) {
        return Number.parseInt(entry.hex, 16);
    }
    throw new Error('Invalid web color');
}
export function parseHexString(hex, out) {
    out ??= { r: 1, g: 1, b: 1, a: 1 };
    if (hex.startsWith('#'))
        hex = hex.slice(1);
    if (hex.length === 3 || hex.length === 4) {
        const [R, G, B, A = 'f'] = hex;
        out.r = Number.parseInt(R + R, 16) / 255;
        out.g = Number.parseInt(G + G, 16) / 255;
        out.b = Number.parseInt(B + B, 16) / 255;
        out.a = Number.parseInt(A + A, 16) / 255;
        return out;
    }
    if (hex.length === 6 || hex.length === 8) {
        const R = hex.slice(0, 2);
        const G = hex.slice(2, 4);
        const B = hex.slice(4, 6);
        const A = hex.slice(6, 8) || 'ff';
        out.r = Number.parseInt(R, 16) / 255;
        out.g = Number.parseInt(G, 16) / 255;
        out.b = Number.parseInt(B, 16) / 255;
        out.a = Number.parseInt(A, 16) / 255;
        return out;
    }
    throw new Error('Invalid hex string');
}
export function parseColorDeclaration(color, out) {
    out ??= { r: 1, g: 1, b: 1, a: 1 };
    switch (typeof color) {
        case 'number': {
            return hexToColor4(color, out);
        }
        case 'string': {
            if (color.startsWith('#')) {
                return parseHexString(color, out);
            }
            if (color.startsWith('rgb')) {
                throw new Error('Not implemented');
            }
            if (color.startsWith('hsl')) {
                throw new Error('Not implemented');
            }
            try {
                return hexToColor4(webColorToHex(color), out);
            }
            catch {
                throw new Error('Invalid color string');
            }
        }
        case 'object': {
            if (Array.isArray(color)) {
                const [r, g, b, a = 1] = color;
                out.r = r;
                out.g = g;
                out.b = b;
                out.a = a;
                return out;
            }
            if (isColor4Like(color)) {
                out.r = color.r;
                out.g = color.g;
                out.b = color.b;
                out.a = color.a;
                return out;
            }
        }
    }
    throw new Error('Invalid color declaration');
}
export class Color4 {
    static from(color) {
        return parseColorDeclaration(color, new Color4());
    }
    static lerpColors(c1, c2, t) {
        return new Color4().lerpColors(c1, c2, t);
    }
    r = 1;
    g = 1;
    b = 1;
    a = 1;
    constructor(color) {
        if (color) {
            parseColorDeclaration(color, this);
        }
    }
    set(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }
    lerpColors(c1, c2, t) {
        this.r = lerp(c1.r, c2.r, t);
        this.g = lerp(c1.g, c2.g, t);
        this.b = lerp(c1.b, c2.b, t);
        this.a = lerp(c1.a, c2.a, t);
        return this;
    }
    toCSS(format = 'hex') {
        switch (format) {
            case 'hex': {
                return `#${toFFString(this.r)}${toFFString(this.g)}${toFFString(this.b)}${toFFString(this.a)}`;
            }
            case 'rgba': {
                return `rgba(${toff(this.r)}, ${toff(this.g)}, ${toff(this.b)}, ${this.a.toFixed(2)})`;
            }
        }
        throw new Error('Invalid format');
    }
}
//# sourceMappingURL=color.js.map
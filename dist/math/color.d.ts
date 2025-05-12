import { Color4Like } from '../types';
export declare function isColor4Like(arg: any): arg is Color4Like;
export declare function toFFString(f: number): string;
export type ColorDeclaration = Color4Like | [r: number, g: number, b: number, a?: number] | string | number;
export declare function hexToColor4<T extends Color4Like = Color4Like>(hex: number, out?: T): T;
export declare function webColorToHex(color: string): number;
export declare function parseHexString<T extends Color4Like = Color4Like>(hex: string, out?: T): T;
export declare function parseColorDeclaration<T extends Color4Like = Color4Like>(color: ColorDeclaration, out?: T): T;
export declare class Color4 {
    static from(color: ColorDeclaration): Color4;
    static lerpColors(c1: Color4, c2: Color4, t: number): Color4;
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(color?: ColorDeclaration);
    set(r: number, g: number, b: number, a?: number): this;
    lerpColors(c1: Color4, c2: Color4, t: number): this;
    toCSS(format?: 'hex' | 'rgba'): string;
}
//# sourceMappingURL=color.d.ts.map
import { Vector2Declaration } from '../../declaration';
import { Vector2Like } from '../../types';
declare enum Line2Side {
    Left = -1,
    On = 0,
    Right = 1
}
type Line2Like = {
    ox: number;
    oy: number;
    vx: number;
    vy: number;
};
type PointDeclarationArray = [number, number, number, number] | [Vector2Declaration, Vector2Declaration];
type Line2Declaration = Line2Like | PointDeclarationArray;
declare function ensure(value: unknown): Line2;
declare class Line2 implements Line2Like {
    static from(...args: Parameters<Line2['from']>): Line2;
    static ensure: typeof ensure;
    ox: number;
    oy: number;
    vx: number;
    vy: number;
    set(ox: number, oy: number, vx: number, vy: number): this;
    copy(value: Line2Like): this;
    clone(): Line2;
    from(...args: [Line2Declaration] | PointDeclarationArray): Line2;
    fromStartEnd(...args: [PointDeclarationArray] | PointDeclarationArray): Line2;
    pointAt<T extends Vector2Like>(t: number, { out, }?: {
        out?: T | null | undefined;
    }): T;
    p0<T extends Vector2Like>(out?: T | null): T;
    p1<T extends Vector2Like>(out?: T | null): T;
    vector<T extends Vector2Like>(out?: T | null): T;
    orthogonal<T extends Vector2Like>(out?: T | null): T;
    computeT(point: Vector2Declaration): number;
    project<T extends Vector2Like>(point: Vector2Declaration, { out, }?: {
        out?: T | null | undefined;
    }): T;
    side(point: Vector2Declaration, { epsilon, }?: {
        epsilon?: number | undefined;
    }): Line2Side;
    start: <T extends Vector2Like>(out?: T | null) => T;
    end: <T extends Vector2Like>(out?: T | null) => T;
}
export { Line2, Line2Declaration, Line2Like, Line2Side };

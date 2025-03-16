import { AngleDeclaration, Vector2Declaration } from '../../declaration';
import { Vector2Like } from '../../types';
export type Transform2Declaration = number[] | Partial<{
    x: number;
    y: number;
    translation: Vector2Declaration;
    scale: Vector2Declaration;
    rotation: AngleDeclaration;
}>;
export declare class Path2<T extends Vector2Like = Vector2Like> {
    points: T[];
    constructor(points?: T[]);
    from(points: Vector2Declaration[], { pointType, }?: {
        pointType?: (new () => Vector2Like) | undefined;
    }): this;
    copy(source: Path2<T>): this;
    clone(): Path2<T>;
    set(points: T[]): this;
    offset(amount: number): this;
    transform(...values: Transform2Declaration[]): this;
    roundCorner(radius: number, { tension, resolution }?: {
        tension?: number | undefined;
        resolution?: number | undefined;
    }): this;
}

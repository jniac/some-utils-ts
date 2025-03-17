import { AngleDeclaration, Vector2Declaration } from '../../declaration';
import { Vector2Like } from '../../types';
import { Line2 } from './line2';
export type Transform2Declaration = number[] | Partial<{
    x: number;
    y: number;
    translation: Vector2Declaration;
    scale: Vector2Declaration;
    rotation: AngleDeclaration;
}>;
declare const roundCornerOptionsDefaults: {
    tension: number;
    resolution: number;
    radius: number;
};
type RoundCornerOptions = Partial<typeof roundCornerOptionsDefaults>;
type RoundCornerDelegate = (info: {
    point: Vector2Like;
    cross: number;
    line1: Line2;
    line2: Line2;
}) => RoundCornerOptions;
export declare class Path2<T extends Vector2Like = Vector2Like> {
    points: T[];
    constructor(points?: T[]);
    from(points: Vector2Declaration[], { pointType, }?: {
        pointType?: (new () => Vector2Like) | undefined;
    }): this;
    copy(source: Path2<T>): this;
    clone(): Path2<T>;
    set(points: T[]): this;
    clean({ threshold }?: {
        threshold?: number | undefined;
    }): this;
    offset(amount: number): this;
    transform(...values: Transform2Declaration[]): this;
    roundCorner(options: number | RoundCornerDelegate | RoundCornerOptions): this;
}
export {};

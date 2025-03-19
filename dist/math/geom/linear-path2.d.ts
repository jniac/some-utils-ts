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
declare function simplify<T extends Vector2Like>(points: T[], closed: boolean, { distanceThresold, angleThreshold }?: {
    distanceThresold?: number | undefined;
    angleThreshold?: number | undefined;
}): T[];
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
export declare class LinearPath2<T extends Vector2Like = Vector2Like> {
    points: T[];
    closed: boolean;
    constructor(points?: T[], closed?: boolean);
    from(points: Vector2Declaration[], closed?: boolean, { pointType, }?: {
        pointType?: (new () => Vector2Like) | undefined;
    }): this;
    copy(source: LinearPath2<T>): this;
    clone(): LinearPath2<T>;
    set(points: T[], closed?: boolean): this;
    /**
     * Removes duplicate and collinear points.
     */
    simplify(options?: Parameters<typeof simplify>[2]): this;
    offset(amount: number): this;
    outline(width: number): this;
    transform(...values: Transform2Declaration[]): this;
    roundCorner(options: number | RoundCornerDelegate | RoundCornerOptions): this;
}
export {};

import { Vector2Declaration } from '../../declaration';
import { Ray2Like, RectangleLike, Vector2Like } from '../../types';
import { Line2 } from './line2';
import { PaddingDeclaration } from './padding';
import { Ray2Args } from './ray2';
import { SvgUtils } from './rectangle.svg';
declare const alignOptions: {
    'top-left': {
        x: number;
        y: number;
    };
    'top-center': {
        x: number;
        y: number;
    };
    'top-right': {
        x: number;
        y: number;
    };
    'center-left': {
        x: number;
        y: number;
    };
    center: {
        x: number;
        y: number;
    };
    'center-right': {
        x: number;
        y: number;
    };
    'bottom-left': {
        x: number;
        y: number;
    };
    'bottom-center': {
        x: number;
        y: number;
    };
    'bottom-right': {
        x: number;
        y: number;
    };
};
type AlignDeclaration = Vector2Declaration | keyof typeof alignOptions;
type WithAlignOption<T> = T & {
    align?: AlignDeclaration;
};
export type RectangleDeclaration = [x: number, y: number, width: number, height: number] | [width: number, height: number] | WithAlignOption<Partial<RectangleLike>> | WithAlignOption<{
    aspect: number;
    diagonal: number;
}> | WithAlignOption<{
    center?: Vector2Declaration;
    extent: number | Vector2Declaration;
}> | WithAlignOption<{
    position?: Vector2Declaration;
    extent: number | Vector2Declaration;
}> | WithAlignOption<{
    position?: Vector2Declaration;
    size: Vector2Declaration;
}>;
export declare const defaultRectangleDeclaration: RectangleDeclaration;
export declare function fromRectangleDeclaration(declaration: RectangleDeclaration, out?: Rectangle): Rectangle;
export declare function union<T extends RectangleLike>(out: T, a: RectangleLike, b: RectangleLike): void;
export declare function intersection<T extends RectangleLike>(out: T, a: RectangleLike, b: RectangleLike): void;
export declare function innerRectangle<T extends RectangleLike>(out: T, outerRect: RectangleLike, innerAspect: number, sizeMode: "contain" | "cover", alignX: number, alignY: number): void;
declare class RectangleCastResult {
    ray: Ray2Like;
    intersects: boolean;
    tmin: number;
    tmax: number;
    constructor(ray: Ray2Like, intersects: boolean, tmin: number, tmax: number);
    getRayPoint<T extends Vector2Like>(t: number, out?: T): T;
    /**
     * @deprecated Use `getRayPoint()` instead.
     */
    getPoint: RectangleCastResult['getRayPoint'];
    getPointMin<T extends Vector2Like>(out?: T, { offset, }?: {
        offset?: number | undefined;
    }): T;
    getPointMax<T extends Vector2Like>(out?: T, { offset, }?: {
        offset?: number | undefined;
    }): T;
}
/**
 * Very versatile and useful class for working with rectangles.
 *
 * Features:
 * - alignment
 * - aspect ratio
 * - diagonal
 * - area
 * - padding
 * - inner rectangle
 * - relative coordinates
 * - uv coordinates
 * - contains methods
 */
export declare class Rectangle implements RectangleLike, Iterable<number> {
    #private;
    static from(source?: RectangleDeclaration): Rectangle;
    x: number;
    y: number;
    width: number;
    height: number;
    constructor();
    constructor(width: number, height: number);
    constructor(x: number, y: number, width: number, height: number);
    [Symbol.iterator](): Generator<number>;
    copy(other: RectangleLike): this;
    clone(): Rectangle;
    set(width: number, height: number): this;
    set(x: number, y: number, width: number, height: number): this;
    set(other: Rectangle): this;
    fromDeclaration(declaration: RectangleDeclaration): this;
    /**
     * Converts a point relative to the rectangle to an absolute point.
     *
     * ```
     * const rect = new Rectangle(10, 10, 20, 30)
     * const point = rect.fromRelativePoint(.5, .5) // center of the rectangle (20, 25)
     * ```
     */
    fromRelativePoint<T extends Vector2Like>(alignX: number, alignY: number, out?: T): T;
    fromRelativePoint<T extends Vector2Like>(align: AlignDeclaration, out?: T): T;
    toRelativePoint<T extends Vector2Like>(point: Vector2Like, out?: T): T;
    getCenterX(): number;
    setCenterX(value: number): this;
    getCenterY(): number;
    setCenterY(value: number): this;
    getCenter<T extends Vector2Like>(out?: T): T;
    setCenter(point: Vector2Declaration): this;
    getMinX(): number;
    setMinX(value: number, mode?: 'resize' | 'translate'): this;
    incrementMinX(value: number): this;
    getMaxX(): number;
    setMaxX(value: number, mode?: 'resize' | 'translate'): this;
    incrementMaxX(value: number): this;
    getMinY(): number;
    setMinY(value: number, mode?: 'resize' | 'translate'): this;
    incrementMinY(value: number): this;
    getMaxY(): number;
    setMaxY(value: number, mode?: 'resize' | 'translate'): this;
    incrementMaxY(value: number): this;
    getMin<T extends Vector2Like>(out?: T): T;
    getMax<T extends Vector2Like>(out?: T): T;
    translate(deltaX: number, deltaY: number): this;
    translate(delta: Vector2Declaration): this;
    multiplyScalar(scalar: number): this;
    multiply(scalarX: number, scalarY: number): this;
    multiply(scalar: Vector2Declaration): this;
    setPosition(x: number, y: number, align?: Vector2Like): this;
    getSize<T extends Vector2Like>(out?: T): T;
    setWidth(width: number, align?: number): this;
    setHeight(height: number, align?: number): this;
    setSize(width: number, height: number, align?: Vector2Like): this;
    /**
     * Resize the rectangle to fit a given area, keeping the aspect ratio.
     */
    setArea(value: number, align?: Vector2Like): this;
    setDiagonal(value: number, align?: Vector2Like): this;
    setAspect(aspect: number, align?: Vector2Like): this;
    setDiagonalAndAspect(diagonal: number, aspect: number, align?: Vector2Like): this;
    static applyPaddingDefaultOptions: {
        mode: "shrink" | "grow";
        /**
         * How to handle negative size values when shrinking the rectangle beyond its limits.
         * By default, the rectangle will collapse to a point (center).
         */
        safeMode: "collapse" | "flip" | "none";
    };
    applyPadding(padding: PaddingDeclaration, options?: Partial<typeof Rectangle.applyPaddingDefaultOptions>): this;
    applyPadding(padding: PaddingDeclaration, mode: 'shrink' | 'grow'): this;
    /**
     * Inflates the rectangle by the given padding (use negative values to shrink).
     */
    inflate(padding: PaddingDeclaration, options?: Partial<Omit<typeof Rectangle.applyPaddingDefaultOptions, 'mode'>>): this;
    toBoundingInt(): this;
    innerBoundingPositionInt<T extends Vector2Like>(out?: T): Generator<T>;
    toFloorInt(): this;
    innerFloorPositionInt<T extends Vector2Like>(out?: T): Generator<T>;
    toContainedInt(): this;
    innerContainedPositionInt<T extends Vector2Like>(out?: T): Generator<T>;
    relativeTranslate(x: number, y: number): this;
    /**
     * Less useful method than `flipY()`, but still useful for flipping the x-axis.
     */
    flipX(): this;
    /**
     * Useful for flipping the y-axis (e.g. canvas / web coordinates vs. screen / gl coordinates)
     */
    flipY(): this;
    union(other: RectangleLike): this;
    unionRectangles(a: RectangleLike, b: RectangleLike): this;
    intersection(other: RectangleLike): this;
    intersectionRectangles(a: RectangleLike, b: RectangleLike): this;
    innerRectangle({ aspect, sizeMode, alignX, alignY, padding, }: Partial<{
        aspect: number;
        sizeMode: "contain" | "cover";
        alignX: number;
        alignY: number;
        padding: PaddingDeclaration;
    }>, out?: Rectangle): Rectangle;
    /**
     * Very useful method to calculate, for example, the uv coordinates of a rectangle.
     *
     * Warning: Mutates self.
     */
    relativeTo(other: RectangleLike): this;
    lerpRectangles(a: RectangleLike, b: RectangleLike, t: number): this;
    lerp(other: RectangleLike, t: number): this;
    intersectsRect(other: RectangleLike): boolean;
    containsXY(x: number, y: number): boolean;
    containsPoint(point: Vector2Like): boolean;
    containsRect(other: RectangleLike): boolean;
    /**
     * Readable / declarative method that can be called with different parameters:
     * contains(x, y) -> containsXY(x, y)
     * contains([x, y]) -> containsXY(x, y)
     * contains(point) -> containsPoint(point)
     * contains(rect) -> containsRect(rect)
     */
    contains(x: number, y: number): boolean;
    contains(other: Vector2Like): boolean;
    contains(other: RectangleLike): boolean;
    uv<T extends Vector2Like = Vector2Like>({ x, y }: T, out?: T): T;
    linecast(...ray2Args: Ray2Args): RectangleCastResult;
    raycast(...ray2Args: Ray2Args): RectangleCastResult;
    /**
     * Iterates over the sides of the rectangle in clockwise order.
     *
     * NOTE: The same Line2 instance is reused for performance reasons. Clone it if needed.
     */
    sides(): Generator<Line2>;
    get centerX(): number;
    set centerX(value: number);
    get centerY(): number;
    set centerY(value: number);
    get center(): Vector2Like;
    set center(point: Vector2Like);
    get minX(): number;
    set minX(value: number);
    get min(): Vector2Like;
    get maxX(): number;
    set maxX(value: number);
    get max(): Vector2Like;
    get minY(): number;
    set minY(value: number);
    get maxY(): number;
    set maxY(value: number);
    /**
     * Shorthand for `minX`.
     */
    get left(): number;
    set left(value: number);
    /**
     * Shorthand for `maxX`.
     */
    get right(): number;
    set right(value: number);
    /**
     * DOM oriented (y-axis is inverted).
     *
     * Shorthand for `minY`.
     */
    get top(): number;
    set top(value: number);
    /**
     * DOM oriented (y-axis is inverted).
     *
     * Shorthand for `maxY`.
     */
    get bottom(): number;
    set bottom(value: number);
    get size(): Vector2Like;
    set size(value: Vector2Like);
    get area(): number;
    set area(value: number);
    get diagonal(): number;
    set diagonal(value: number);
    get aspect(): number;
    set aspect(value: number);
    tupple(scalar?: number): [number, number, number, number];
    /**
     * Access to the SVG utility methods.
     */
    get svg(): typeof SvgUtils;
    /**
     * @deprecated Use `svg.toViewBox()` instead.
     */
    toViewBox(): string;
    toCSS(): {
        left: string;
        top: string;
        width: string;
        height: string;
    };
}
export {};

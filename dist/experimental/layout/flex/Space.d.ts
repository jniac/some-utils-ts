import { Vector2Declaration } from '../../../declaration';
import { Rectangle } from '../../../math/geom/rectangle';
import { Vector2Like } from '../../../types';
import { Scalar, ScalarDeclaration } from './Scalar';
import { Direction, DirectionDeclaration, Positioning, PositioningDeclaration } from './types';
export type Scalar2Declaration = ScalarDeclaration | [x: ScalarDeclaration, y: ScalarDeclaration] | {
    x: ScalarDeclaration;
    y: ScalarDeclaration;
};
export declare function fromScalar2Declaration(arg: Scalar2Declaration, outX: Scalar, outY: Scalar): [Scalar, Scalar];
type BoxSpacingTupleDeclaration = [top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration];
type BoxSpacingDeclaration = ScalarDeclaration | [all: ScalarDeclaration] | [vertical: ScalarDeclaration, horizontal: ScalarDeclaration] | BoxSpacingTupleDeclaration;
type SpacingTupleDeclaration = [gap: ScalarDeclaration, ...BoxSpacingTupleDeclaration];
type SpacingDeclaration = ScalarDeclaration | [gap: ScalarDeclaration, padding: ScalarDeclaration] | [gap: ScalarDeclaration, vertical: ScalarDeclaration, horizontal: ScalarDeclaration] | SpacingTupleDeclaration;
type SetProps = Partial<{
    direction: DirectionDeclaration;
    positioning: PositioningDeclaration;
    offset: Scalar2Declaration;
    offsetX: ScalarDeclaration;
    offsetY: ScalarDeclaration;
    size: Scalar2Declaration;
    sizeX: ScalarDeclaration;
    sizeY: ScalarDeclaration;
    alignChildren: Vector2Declaration;
    alignChildrenX: number;
    alignChildrenY: number;
    alignSelf: Vector2Declaration<number | null>;
    alignSelfX: number | null;
    alignSelfY: number | null;
    aspect: null | number;
    padding: BoxSpacingDeclaration;
    paddingTop: ScalarDeclaration;
    paddingRight: ScalarDeclaration;
    paddingBottom: ScalarDeclaration;
    paddingLeft: ScalarDeclaration;
    margin: BoxSpacingDeclaration;
    marginTop: ScalarDeclaration;
    marginRight: ScalarDeclaration;
    marginBottom: ScalarDeclaration;
    marginLeft: ScalarDeclaration;
    gap: ScalarDeclaration;
    spacing: SpacingDeclaration;
    userData: Record<string, any>;
}>;
/**
 * `some-utilz/layout/flex` is a naive yet robust flex layout system.
 *
 * It does NOT implement the [official W3C specs](https://www.w3.org/TR/css-flexbox-1/).
 *
 * It's intended to be used in creative coding projects where you need to create
 * complex layouts with relative and absolute sizes, paddings and gaps.
 *
 * ## Features:
 * - Horizontal and vertical directions
 * - Absolute and relative sizes
 *   - Absolute: fixed size in pixels
 *   - Relative: size based on the parent size
 *   - Special relative sizes that take the two parent sizes into account: opposite, smaller, larger
 * - Padding and gaps
 * - Part unit for relative sizes
 * - Layout computation (from root to children)
 * - Tree structure
 *   - add
 *   - remove
 *   - get (with index path)
 *   - find (with predicate)
 * - Declarative syntax for sizes, paddings and gaps
 *
 * ## Exclusive features:
 * - Extra size (extraSizeX, extraSizeY)
 *   It's motion design friendly feature. You can animate the size of a space
 *   based on its current size. It's useful for creating animations where a space
 *   could grow or shrink. The whole layout will be affected by this change
 *   accordingly to the space's direction and alignment.
 *   This extra computed size is added after the regular size computation, so it
 *   will not affect the size of the "part" spaces (only their position).
 *
 * ## Roadmap:
 * - Min and max sizes
 * - Shrinking options?
 *
 * Naive implementation of a flex layout system. Naive but robust. Useful for
 * creating simple layouts with relative and absolute sizes, paddings and gaps
 * that could be easily computed, animated and rendered.
 *
 * ## Usage:
 * ```js
 * const root = new Space(Direction.Horizontal)
 *   .setOffset(100, 100)
 *   .setSize(600, 400)
 *   .setPadding(10)
 *   .setGap(10)
 *
 * // Creates 2 vertical spaces with 25% width and 100% height
 * root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
 * root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
 * root.add(new Space(Direction.Vertical).setSize('.25rel', '1rel').setSpacing(10).setUserData({ color: '#f00' }))
 *
 * // Creates 3 spaces into the first vertical space, with 1fr, 2fr and 3fr height
 * // where fr is a special unit that means "part" of the remaining space
 * for (let i = 0; i < 3; i++) {
 *   root.getChild(0)!
 *     .add(new Space().setSize(`1rel`, `${i + 1}fr`).setSpacing(10))
 * }
 *
 * const ctx = canvas.getContext('2d')!
 * for (const space of root.allDescendants()) {
 *   ctx.strokeStyle = space.userData.color ?? '#fff'
 *   ctx.strokeRect(space.layoutRect.x, space.layoutRect.y, space.layoutRect.width, space.layoutRect.height)
 * }
 * ```
 */
export declare class Space {
    enabled: boolean;
    root: Space;
    parent: Space | null;
    children: Space[];
    direction: Direction;
    positioning: Positioning;
    aspect: number | null;
    offsetX: Scalar;
    offsetY: Scalar;
    sizeX: Scalar;
    sizeY: Scalar;
    extraSizeX: Scalar;
    extraSizeY: Scalar;
    padding: [top: Scalar, right: Scalar, bottom: Scalar, left: Scalar];
    margin: [top: Scalar, right: Scalar, bottom: Scalar, left: Scalar];
    gap: Scalar;
    /**
     * The horizontal alignment of the children spaces:
     * - `0`: left
     * - `1`: right
     *
     * Default is `0.5` (center).
     */
    alignChildrenX: number;
    /**
     * The vertical alignment of the children spaces:
     * - `0`: top
     * - `1`: bottom
     *
     * Default is `0.5` (center).
     */
    alignChildrenY: number;
    alignSelfX: number | null;
    alignSelfY: number | null;
    rect: Rectangle;
    userData: Record<string, any>;
    /**
     * @deprecated Use `new Space({ direction: Direction.Horizontal })` instead.
     */
    constructor(direction: Direction);
    /**
     * Create a new Space with the given properties.
     */
    constructor(props?: SetProps);
    set(props: SetProps): this;
    setDirection(direction: DirectionDeclaration): this;
    setPositioning(positioning: PositioningDeclaration): this;
    setOffset(x: ScalarDeclaration, y?: ScalarDeclaration): this;
    setOffset(value: {
        x: ScalarDeclaration;
        y: ScalarDeclaration;
    }): this;
    setSize(x: ScalarDeclaration, y?: ScalarDeclaration): this;
    setSize(value: {
        x: ScalarDeclaration;
        y: ScalarDeclaration;
    }): this;
    /**
     * Set the size of the space as an absolute rectangle. Useful for setting the
     * size of the root space.
     */
    setOffsetSizeAsAbsoluteRect(rect: Rectangle): this;
    setAlign(x: number, y?: number): this;
    setUserData(props: Record<string, any>): this;
    setPadding(all: BoxSpacingDeclaration): this;
    setPadding(all: ScalarDeclaration): this;
    setPadding(vertical: ScalarDeclaration, horizontal: ScalarDeclaration): this;
    setPadding(top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration): this;
    setGap(value: ScalarDeclaration): this;
    setSpacing(all: ScalarDeclaration): this;
    setSpacing(gap: ScalarDeclaration, padding: ScalarDeclaration): this;
    setSpacing(gap: ScalarDeclaration, vertical: ScalarDeclaration, horizontal: ScalarDeclaration): this;
    setSpacing(gap: ScalarDeclaration, top: ScalarDeclaration, right: ScalarDeclaration, bottom: ScalarDeclaration, left: ScalarDeclaration): this;
    isRoot(): boolean;
    isLeaf(): boolean;
    depth(): number;
    allDescendants({ includeSelf }?: {
        includeSelf?: boolean | undefined;
    }): Generator<Space>;
    descendantsCount({ includeSelf }?: {
        includeSelf?: boolean | undefined;
    }): number;
    allAncestors({ includeSelf }?: {
        includeSelf?: boolean | undefined;
    }): Generator<Space>;
    allLeaves({ includeSelf }?: {
        includeSelf?: boolean | undefined;
    }): Generator<Space>;
    leavesCount({ includeSelf }?: {
        includeSelf?: boolean | undefined;
    }): number;
    path(): number[];
    /**
     * Return the space at the given path.
     *
     * Negative indexes are allowed.
     */
    get(...path: number[]): Space | null;
    get(path: Iterable<number>): Space | null;
    find(predicate: (space: Space) => boolean, { includeSelf }?: {
        includeSelf?: boolean | undefined;
    }): Space | null;
    findAll(predicate: (space: Space) => boolean, { includeSelf }?: {
        includeSelf?: boolean | undefined;
    }): Generator<Space>;
    pointCast(point: Vector2Like): Space | null;
    pointCast(x: number, y: number): Space | null;
    add(...spaces: Space[]): this;
    /**
     * @deprecated Use `populate(count, props)` instead.
     */
    populate(props?: {
        count: number;
        size: ScalarDeclaration;
        sizeX: ScalarDeclaration;
        sizeY: ScalarDeclaration;
        spacing: ScalarDeclaration;
        gap: ScalarDeclaration;
        padding: BoxSpacingDeclaration;
    }): this;
    /**
     * Populate the space with `count` spaces with the given properties for each space.
     * @param count
     * @param props
     */
    populate(count: number, props?: SetProps): this;
    addTo(space: Space): this;
    prepend(...space: Space[]): this;
    prependTo(space: Space): this;
    removeFromParent(): this;
    remove(...spaces: Space[]): this;
    sort(predicate: (a: Space, b: Space) => number): this;
    /**
     * Return the size of the space in the direction of the parent space.
     *
     * "tangent" means the direction of the parent space (horizontal -> sizeX, vertical -> sizeY).
     */
    tangentSize(): Scalar;
    /**
     * Return the size of the space in the direction of the children spaces.
     *
     * "normal" means the direction of the children spaces (horizontal -> sizeX, vertical -> sizeY).
     */
    normalSize(): Scalar;
    getUvRect(): Rectangle;
    parse(str: string): void;
    /**
     * Compute the layout of the space and its children. Should be called on the root space.
     */
    computeLayout(): this;
}
export {};
//# sourceMappingURL=Space.d.ts.map
import { fromVector2Declaration } from '../../../declaration.js';
import { Rectangle } from '../../../math/geom/rectangle.js';
import { Scalar, ScalarType } from './Scalar.js';
import { computeChildrenRect, computeRootRect } from './Space.layout.js';
import { Direction, parseDirection, parsePositioning, Positioning } from './types.js';
export function fromScalar2Declaration(arg, outX, outY) {
    if (Array.isArray(arg)) {
        const [x, y] = arg;
        outX.parse(x);
        outY.parse(y);
        return [outX, outY];
    }
    if (typeof arg === 'object') {
        outX.parse(arg.x);
        outY.parse(arg.y);
        return [outX, outY];
    }
    outX.parse(arg);
    outY.parse(arg);
    return [outX, outY];
}
function fromBoxSpacingDeclaration(arg) {
    if (Array.isArray(arg) === false) {
        return [arg, arg, arg, arg];
    }
    else {
        const array = arg;
        if (array.length === 1) {
            return [array[0], array[0], array[0], array[0]];
        }
        else if (array.length === 2) {
            return [array[0], array[1], array[0], array[1]];
        }
        else if (array.length === 4) {
            return array;
        }
    }
    throw new Error('Invalid number of arguments');
}
function fromSpacingDeclaration(arg) {
    if (Array.isArray(arg) === false) {
        return [arg, arg, arg, arg, arg];
    }
    const [gap, ...rest] = arg;
    return [gap, ...fromBoxSpacingDeclaration(rest)];
}
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
export class Space {
    enabled = true;
    root = this;
    parent = null;
    children = [];
    direction = Direction.Horizontal;
    positioning = Positioning.Flow;
    aspect = null;
    offsetX = new Scalar(0, ScalarType.Absolute);
    offsetY = new Scalar(0, ScalarType.Absolute);
    sizeX = new Scalar(1, ScalarType.Auto);
    sizeY = new Scalar(1, ScalarType.Auto);
    extraSizeX = new Scalar(1, ScalarType.Relative);
    extraSizeY = new Scalar(1, ScalarType.Relative);
    padding = [
        new Scalar(0, ScalarType.Absolute),
        new Scalar(0, ScalarType.Absolute),
        new Scalar(0, ScalarType.Absolute),
        new Scalar(0, ScalarType.Absolute),
    ];
    margin = [
        new Scalar(0, ScalarType.Absolute),
        new Scalar(0, ScalarType.Absolute),
        new Scalar(0, ScalarType.Absolute),
        new Scalar(0, ScalarType.Absolute),
    ];
    gap = new Scalar(0, ScalarType.Absolute);
    /**
     * The horizontal alignment of the children spaces:
     * - `0`: left
     * - `1`: right
     *
     * Default is `0.5` (center).
     */
    alignChildrenX = .5;
    /**
     * The vertical alignment of the children spaces:
     * - `0`: top
     * - `1`: bottom
     *
     * Default is `0.5` (center).
     */
    alignChildrenY = .5;
    alignSelfX = null;
    alignSelfY = null;
    rect = new Rectangle();
    userData = {};
    constructor(arg) {
        if (arg) {
            if (typeof arg === 'object') {
                this.set(arg);
            }
            else {
                this.direction = arg;
            }
            this.root = this;
        }
    }
    set(props) {
        if (props.direction !== undefined) {
            this.direction = parseDirection(props.direction);
        }
        if (props.positioning !== undefined) {
            this.positioning = parsePositioning(props.positioning);
        }
        if (props.offset !== undefined) {
            fromScalar2Declaration(props.offset, this.offsetX, this.offsetY);
        }
        if (props.offsetX !== undefined) {
            this.offsetX.parse(props.offsetX);
        }
        if (props.offsetY !== undefined) {
            this.offsetY.parse(props.offsetY);
        }
        if (props.size !== undefined) {
            fromScalar2Declaration(props.size, this.sizeX, this.sizeY);
        }
        if (props.sizeX !== undefined) {
            this.sizeX.parse(props.sizeX);
        }
        if (props.sizeY !== undefined) {
            this.sizeY.parse(props.sizeY);
        }
        if (props.aspect !== undefined) {
            this.aspect = props.aspect;
        }
        if (props.alignChildren !== undefined) {
            const { x, y } = fromVector2Declaration(props.alignChildren);
            this.alignChildrenX = x;
            this.alignChildrenY = y;
        }
        if (props.alignChildrenX !== undefined) {
            this.alignChildrenX = props.alignChildrenX;
        }
        if (props.alignChildrenY !== undefined) {
            this.alignChildrenY = props.alignChildrenY;
        }
        if (props.alignSelf !== undefined) {
            const { x, y } = fromVector2Declaration(props.alignSelf);
            this.alignSelfX = x;
            this.alignSelfY = y;
        }
        if (props.alignSelfX !== undefined) {
            this.alignSelfX = props.alignSelfX;
        }
        if (props.alignSelfY !== undefined) {
            this.alignSelfY = props.alignSelfY;
        }
        if (props.padding !== undefined) {
            const [top, right, bottom, left] = fromBoxSpacingDeclaration(props.padding);
            this.padding[0].parse(top);
            this.padding[1].parse(right);
            this.padding[2].parse(bottom);
            this.padding[3].parse(left);
        }
        if (props.paddingTop !== undefined) {
            this.padding[0].parse(props.paddingTop);
        }
        if (props.paddingRight !== undefined) {
            this.padding[1].parse(props.paddingRight);
        }
        if (props.paddingBottom !== undefined) {
            this.padding[2].parse(props.paddingBottom);
        }
        if (props.paddingLeft !== undefined) {
            this.padding[3].parse(props.paddingLeft);
        }
        if (props.margin !== undefined) {
            const [top, right, bottom, left] = fromBoxSpacingDeclaration(props.margin);
            this.margin[0].parse(top);
            this.margin[1].parse(right);
            this.margin[2].parse(bottom);
            this.margin[3].parse(left);
        }
        if (props.marginTop !== undefined) {
            this.margin[0].parse(props.marginTop);
        }
        if (props.marginRight !== undefined) {
            this.margin[1].parse(props.marginRight);
        }
        if (props.marginBottom !== undefined) {
            this.margin[2].parse(props.marginBottom);
        }
        if (props.marginLeft !== undefined) {
            this.margin[3].parse(props.marginLeft);
        }
        if (props.gap !== undefined) {
            this.gap.parse(props.gap);
        }
        if (props.spacing !== undefined) {
            const [gap, top, right, bottom, left] = fromSpacingDeclaration(props.spacing);
            this.gap.parse(gap);
            this.padding[0].parse(top);
            this.padding[1].parse(right);
            this.padding[2].parse(bottom);
            this.padding[3].parse(left);
        }
        if (props.userData !== undefined) {
            Object.assign(this.userData, props.userData);
        }
        return this;
    }
    setDirection(direction) {
        this.direction = parseDirection(direction);
        return this;
    }
    setPositioning(positioning) {
        this.positioning = parsePositioning(positioning);
        return this;
    }
    setOffset(...args) {
        if (args[0] && typeof args[0] === 'object') {
            const { x, y = x } = args[0];
            this.offsetX.parse(x);
            this.offsetY.parse(y);
        }
        else {
            const [x, y = x] = args;
            this.offsetX.parse(x);
            this.offsetY.parse(y);
        }
        return this;
    }
    setSize(...args) {
        if (args[0] && typeof args[0] === 'object') {
            const { x, y = x } = args[0];
            this.sizeX.parse(x);
            this.sizeY.parse(y);
        }
        else {
            const [x, y = x] = args;
            this.sizeX.parse(x);
            this.sizeY.parse(y);
        }
        return this;
    }
    /**
     * Set the size of the space as an absolute rectangle. Useful for setting the
     * size of the root space.
     */
    setOffsetSizeAsAbsoluteRect(rect) {
        this.offsetX.set(rect.x, ScalarType.Absolute);
        this.offsetY.set(rect.y, ScalarType.Absolute);
        this.sizeX.set(rect.width, ScalarType.Absolute);
        this.sizeY.set(rect.height, ScalarType.Absolute);
        return this;
    }
    setAlign(x, y = x) {
        this.alignChildrenX = x;
        this.alignChildrenY = y;
        return this;
    }
    setUserData(props) {
        Object.assign(this.userData, props);
        return this;
    }
    setPadding(...args) {
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0];
        }
        const [top, right, bottom, left] = fromBoxSpacingDeclaration(args);
        this.padding[0].parse(top);
        this.padding[1].parse(right);
        this.padding[2].parse(bottom);
        this.padding[3].parse(left);
        return this;
    }
    setGap(value) {
        this.gap.parse(value);
        return this;
    }
    setSpacing(...args) {
        const [gap, ...padding] = args;
        this.setGap(gap);
        if (padding.length > 0) {
            this.setPadding.apply(this, padding);
        }
        else {
            this.setPadding(gap);
        }
        return this;
    }
    isRoot() {
        return this.root === this;
    }
    isLeaf() {
        return this.children.length === 0;
    }
    depth() {
        let depth = 0;
        let current = this;
        while (current) {
            current = current.parent;
            depth++;
        }
        return depth;
    }
    *allDescendants({ includeSelf = false } = {}) {
        if (includeSelf) {
            yield this;
        }
        for (const child of this.children) {
            yield* child.allDescendants({ includeSelf: true });
        }
    }
    descendantsCount({ includeSelf = false } = {}) {
        let count = 0;
        for (const _ of this.allDescendants({ includeSelf })) {
            count++;
        }
        return count;
    }
    *allAncestors({ includeSelf = false } = {}) {
        let current = includeSelf ? this : this.parent;
        while (current) {
            yield current;
            current = current.parent;
        }
    }
    *allLeaves({ includeSelf = true } = {}) {
        for (const space of this.allDescendants({ includeSelf })) {
            if (space.children.length === 0) {
                yield space;
            }
        }
    }
    leavesCount({ includeSelf = true } = {}) {
        let count = 0;
        for (const _ of this.allLeaves({ includeSelf })) {
            count++;
        }
        return count;
    }
    path() {
        const path = [];
        let current = this;
        while (current.parent) {
            path.push(current.parent.children.indexOf(current));
            current = current.parent;
        }
        return path.reverse();
    }
    get(...args) {
        const path = (args[0] && typeof args[0] === 'object' && Symbol.iterator in args[0]) ? args[0] : args;
        let current = this;
        for (let index of path) {
            if (index < 0) {
                index = current.children.length + index;
            }
            current = current.children[index];
            if (!current) {
                return null;
            }
        }
        return current;
    }
    find(predicate, { includeSelf = true } = {}) {
        for (const space of this.allDescendants({ includeSelf })) {
            if (predicate(space)) {
                return space;
            }
        }
        return null;
    }
    *findAll(predicate, { includeSelf = true } = {}) {
        for (const space of this.allDescendants({ includeSelf })) {
            if (predicate(space)) {
                yield space;
            }
        }
    }
    pointCast(...args) {
        const [x, y] = args.length === 1 ? [args[0].x, args[0].y] : args;
        for (const space of this.allLeaves()) {
            if (space.rect.containsXY(x, y)) {
                return space;
            }
        }
        return null;
    }
    add(...spaces) {
        for (const space of spaces) {
            space.removeFromParent();
            space.parent = this;
            space.root = this.root;
            this.children.push(space);
        }
        return this;
    }
    populate(...args) {
        if (args.length === 1 && typeof args[0] === 'object') {
            const { count, ...props } = args[0];
            return this.populate(count, props);
        }
        const [count, props] = args;
        for (let i = 0; i < count; i++) {
            this.add(new Space(props));
        }
        return this;
    }
    addTo(space) {
        space.add(this);
        return this;
    }
    prepend(...space) {
        for (const s of space) {
            s.removeFromParent();
            this.children.unshift(s);
            s.parent = this;
            s.root = this.root;
        }
        return this;
    }
    prependTo(space) {
        space.prepend(this);
        return this;
    }
    removeFromParent() {
        if (this.parent) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
            this.parent = null;
            this.root = this;
        }
        return this;
    }
    remove(...spaces) {
        for (const space of spaces) {
            if (space.parent === this) {
                space.removeFromParent();
            }
        }
        return this;
    }
    sort(predicate) {
        this.children.sort(predicate);
        return this;
    }
    /**
     * Return the size of the space in the direction of the parent space.
     *
     * "tangent" means the direction of the parent space (horizontal -> sizeX, vertical -> sizeY).
     */
    tangentSize() {
        const direction = this.parent?.direction ?? this.direction;
        return direction === Direction.Horizontal ? this.sizeX : this.sizeY;
    }
    /**
     * Return the size of the space in the direction of the children spaces.
     *
     * "normal" means the direction of the children spaces (horizontal -> sizeX, vertical -> sizeY).
     */
    normalSize() {
        const direction = this.direction;
        return direction === Direction.Horizontal ? this.sizeX : this.sizeY;
    }
    // Utils:
    getUvRect() {
        return this.rect.clone().relativeTo(this.root.rect);
    }
    parse(str) {
        if (!str) {
            return;
        }
        // Define the regular expression pattern
        const pattern = /(\w+)(?:\(([^)]+)\))?/g;
        const matches = [];
        // Iterate over all matches
        let match;
        while ((match = pattern.exec(str)) !== null) {
            const token = match[1];
            const args = match[2] ? match[2].split(',').map(arg => arg.trim()) : [];
            matches.push({ token, args });
        }
        for (const { token, args } of matches) {
            switch (token) {
                case 'horizontal': {
                    this.direction = Direction.Horizontal;
                    break;
                }
                case 'vertical': {
                    this.direction = Direction.Vertical;
                    break;
                }
                case 'size': {
                    const [width, height = width] = args;
                    this.sizeX.parse(width);
                    this.sizeY.parse(height);
                    break;
                }
                default: {
                    console.log(str, matches);
                    throw new Error(`Unknow type: "${token}"`);
                }
            }
        }
    }
    /**
     * Compute the layout of the space and its children. Should be called on the root space.
     */
    computeLayout() {
        if (this.isRoot()) {
            computeRootRect(this);
        }
        const queue = [this];
        while (queue.length > 0) {
            const current = queue.shift();
            computeChildrenRect(current);
            queue.push(...current.children);
        }
        return this;
    }
}
